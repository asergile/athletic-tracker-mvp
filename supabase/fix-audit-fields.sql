-- Fix the last_updated_by field in audit system
-- Run this SQL in your Supabase SQL Editor

-- Update the audit function to properly set last_updated_by before the update
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
    -- Set initial audit fields for INSERT
    NEW.last_updated_by = auth.uid();
    NEW.version = 1;
    
    INSERT INTO public.audit_log (
      table_name, operation, new_values, user_id, user_email
    ) VALUES (
      TG_TABLE_NAME, 'INSERT', to_jsonb(NEW), auth.uid(), user_email_val
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if data actually changed
    IF to_jsonb(OLD) <> to_jsonb(NEW) THEN
      -- Update audit fields BEFORE logging
      NEW.last_updated_by = auth.uid();
      NEW.version = COALESCE(OLD.version, 0) + 1;
      
      INSERT INTO public.audit_log (
        table_name, operation, old_values, new_values, user_id, user_email
      ) VALUES (
        TG_TABLE_NAME, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid(), user_email_val
      );
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

-- Update triggers to run BEFORE instead of AFTER for UPDATE operations
DROP TRIGGER IF EXISTS profiles_audit_trigger ON profiles;
CREATE TRIGGER profiles_audit_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_table_changes();

DROP TRIGGER IF EXISTS workouts_audit_trigger ON workouts;  
CREATE TRIGGER workouts_audit_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON workouts
  FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- Test the fix by updating your profile
DO $$
BEGIN
  RAISE NOTICE 'Audit system updated - last_updated_by field should now work correctly';
END $$;