-- Comprehensive Audit and Monitoring System
-- Run this SQL in your Supabase SQL Editor

-- 1. CREATE AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on audit log (users can only see their own audit entries)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Only system can insert audit logs (prevents tampering)
CREATE POLICY "System only audit insert" ON audit_log
  FOR INSERT WITH CHECK (false);

-- 2. ADD AUDIT FIELDS TO SENSITIVE TABLES

-- Add audit fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add audit fields to workouts table  
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 3. CREATE AUDIT LOGGING FUNCTIONS

-- Generic audit function for any table
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_email_val TEXT;
BEGIN
  -- Get user email for logging
  SELECT email INTO user_email_val 
  FROM auth.users 
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (
      table_name, operation, new_values, user_id, user_email
    ) VALUES (
      TG_TABLE_NAME, 'INSERT', to_jsonb(NEW), auth.uid(), user_email_val
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if data actually changed
    IF to_jsonb(OLD) <> to_jsonb(NEW) THEN
      INSERT INTO public.audit_log (
        table_name, operation, old_values, new_values, user_id, user_email
      ) VALUES (
        TG_TABLE_NAME, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid(), user_email_val
      );
      
      -- Update version number and last_updated_by
      NEW.last_updated_by = auth.uid();
      NEW.version = COALESCE(OLD.version, 0) + 1;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (
      table_name, operation, old_values, user_id, user_email
    ) VALUES (
      TG_TABLE_NAME, 'DELETE', to_jsonb(OLD), auth.uid(), user_email_val
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE AUDIT TRIGGERS

-- Profile audit trigger
DROP TRIGGER IF EXISTS profiles_audit_trigger ON profiles;
CREATE TRIGGER profiles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- Workout audit trigger  
DROP TRIGGER IF EXISTS workouts_audit_trigger ON workouts;
CREATE TRIGGER workouts_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON workouts
  FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- 5. SECURITY MONITORING FUNCTIONS

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  activity_type TEXT,
  count BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.user_id,
    al.user_email,
    'Rapid Updates' as activity_type,
    COUNT(*) as count,
    MAX(al.created_at) as last_activity
  FROM audit_log al
  WHERE al.operation = 'UPDATE'
    AND al.created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY al.user_id, al.user_email
  HAVING COUNT(*) > 20; -- More than 20 updates in an hour
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit history for a specific record
CREATE OR REPLACE FUNCTION get_record_audit_history(
  p_table_name TEXT,
  p_record_id UUID
) RETURNS TABLE (
  operation TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_by_email TEXT,
  changed_at TIMESTAMP WITH TIME ZONE,
  version_number INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.operation,
    al.old_values,
    al.new_values,
    al.user_email as changed_by_email,
    al.created_at as changed_at,
    CASE 
      WHEN al.new_values ? 'version' THEN (al.new_values->>'version')::INTEGER
      ELSE NULL
    END as version_number
  FROM audit_log al
  WHERE al.table_name = p_table_name
    AND (
      (al.new_values->>'id' = p_record_id::TEXT) OR
      (al.old_values->>'id' = p_record_id::TEXT)
    )
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. MONITORING VIEWS

-- Recent audit activity (for admins)
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT 
  table_name,
  operation,
  user_email,
  created_at,
  new_values->'display_name' as display_name_change,
  new_values->'email' as email_change
FROM audit_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  user_email,
  table_name,
  operation,
  COUNT(*) as operation_count,
  MIN(created_at) as first_activity,
  MAX(created_at) as last_activity
FROM audit_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_email, table_name, operation
ORDER BY operation_count DESC;

-- 7. CLEANUP FUNCTION (Optional - for data retention)

-- Function to clean up old audit logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_log 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON audit_log TO authenticated;
GRANT SELECT ON recent_audit_activity TO authenticated;  
GRANT SELECT ON user_activity_summary TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_table_operation_idx ON audit_log(table_name, operation);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at DESC);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Audit and monitoring system installed successfully!';
  RAISE NOTICE 'Tables now have: created_at, updated_at, last_updated_by, version';
  RAISE NOTICE 'All changes are logged to audit_log table';
  RAISE NOTICE 'Use detect_suspicious_activity() to find unusual patterns';
  RAISE NOTICE 'Use get_record_audit_history(table, id) to see change history';
END $$;