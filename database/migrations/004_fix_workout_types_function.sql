-- Migration 004: Fix get_user_workout_types function to include ID for deletion
-- Run this in your Supabase SQL Editor
-- Date: August 11, 2025

-- Step 1: Drop the existing function explicitly
DROP FUNCTION get_user_workout_types(p_user_id UUID);

-- Step 2: Create the new function with updated return structure
CREATE FUNCTION get_user_workout_types(
  p_user_id UUID
) RETURNS TABLE (
  id UUID,
  name TEXT,
  is_custom BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  -- Default workout types (no ID since they're not stored)
  SELECT 
    NULL::UUID as id,
    default_types.name,
    false as is_custom
  FROM (
    VALUES 
      ('Swimming'),
      ('Running'),
      ('Cycling'),
      ('Weight Training'),
      ('Dryland'),
      ('CrossFit'),
      ('Walking'),
      ('Soccer'),
      ('Tennis'),
      ('Other')
  ) AS default_types(name)
  
  UNION ALL
  
  -- User's custom workout types (include ID for deletion)
  SELECT 
    cwt.id,
    cwt.name, 
    true as is_custom
  FROM custom_workout_types cwt
  WHERE cwt.user_id = p_user_id
  ORDER BY is_custom, name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION get_user_workout_types(UUID) TO authenticated;
