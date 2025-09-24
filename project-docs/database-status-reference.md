# Database Status & Query Reference

**Created:** September 22, 2025  
**Purpose:** Quick reference for current database state and secure query patterns  
**For:** Future Claude sessions to understand what's implemented

---

## 📊 **Current Database Architecture**

### **Security Status**
⚠️ **ASSUMPTION:** Current tables may NOT have Row Level Security enabled  
🚨 **REQUIRED:** Must implement security patterns before any production deployment

### **Expected Tables**
Based on project documentation, these tables likely exist:

```sql
-- Core application tables
workouts (
  id UUID,
  user_id UUID,  -- References auth.users(id)
  workout_type TEXT,
  duration INTEGER,
  rating INTEGER CHECK (rating IN (1,2,3)),
  date DATE,
  created_at TIMESTAMPTZ
)

athlete_goals (
  id UUID,
  user_id UUID,  -- References auth.users(id)
  goal_type TEXT,
  target_value INTEGER,
  current_value INTEGER,
  deadline DATE,
  created_at TIMESTAMPTZ
)

-- MISSING BUT REQUIRED: profiles table
-- Must be created for secure user data queries
```

---

## 🔍 **Secure Query Solutions**

### **Your Original Problem: Getting User Info with Workouts**

**❌ Won't Work:** Direct auth.users queries (restricted by Supabase)
```sql
-- This fails due to security restrictions
SELECT w.*, au.email 
FROM workouts w 
JOIN auth.users au ON w.user_id = au.id;
```

**✅ Correct Solution:** Use profiles table
```typescript
// 1. First, create profiles table (see supabase-security-implementation.md)
// 2. Then use this secure query pattern:

const { data, error } = await supabase
  .from('workouts')
  .select(`
    id,
    workout_type,
    duration,
    rating,
    date,
    profiles!inner(display_name, email)
  `)
  .eq('user_id', user.id) // RLS ensures this only returns current user's data
```

### **Admin Queries for Development/Testing**
If you need to see all users' data for testing (development only):

```sql
-- Create a database function for admin access
CREATE OR REPLACE FUNCTION get_all_workouts_with_profiles()
RETURNS TABLE (
  workout_id UUID,
  workout_type TEXT,
  duration INTEGER,
  rating INTEGER,
  date DATE,
  user_email TEXT,
  display_name TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.workout_type,
    w.duration,
    w.rating,
    w.date,
    p.email,
    p.display_name
  FROM workouts w
  JOIN profiles p ON w.user_id = p.id;
END;
$$ LANGUAGE plpgsql;

-- Then call: SELECT * FROM get_all_workouts_with_profiles();
```

---

## 📋 **Implementation Checklist**

### **Before Any Database Work**
- [ ] Read `supabase-security-implementation.md` completely
- [ ] Verify current RLS status: `SELECT tablename FROM pg_tables WHERE rowsecurity = true;`
- [ ] Check if profiles table exists: `\d profiles`

### **Required Security Setup**
- [ ] Create profiles table with auto-trigger
- [ ] Enable RLS on all user data tables
- [ ] Create appropriate policies for user access
- [ ] Test that users can't access each other's data

### **Application Code Updates**
- [ ] Replace all direct database calls with secure functions
- [ ] Add authentication checks to all database operations
- [ ] Use profiles table for user information joins
- [ ] Implement proper error handling

---

## 🚨 **Security Testing Commands**

### **Test RLS is Working**
```javascript
// Try to access another user's data (should return empty/fail)
const { data } = await supabase
  .from('workouts')
  .select()
  .eq('user_id', 'some-other-user-id')

console.log('Should be empty or error:', data)
```

### **Test Profiles Join**
```javascript
// This should work once profiles table is created
const { data } = await supabase
  .from('workouts')
  .select(`
    *,
    profiles(email, display_name)
  `)
  .eq('user_id', currentUser.id)
```

---

## ⚡ **Quick Commands for Development**

### **Check Current Security Status**
```sql
-- See which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check existing policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### **Emergency Queries (Development Only)**
```sql
-- See all workouts with user emails (requires service role)
SELECT w.*, au.email 
FROM workouts w 
JOIN auth.users au ON w.user_id = au.id 
LIMIT 10;
```

---

## 💡 **Key Insights for Future Sessions**

1. **Don't try to query auth.users directly** - it's intentionally restricted
2. **The profiles table is not optional** - it's required for user info joins
3. **RLS must be enabled** before production - users can access all data without it
4. **Always test security** by trying to access other users' data (should fail)
5. **Input validation is critical** - sanitize all user-provided data
6. **Error messages matter** - don't leak database schema info to users

### **Common Mistakes to Avoid**
- ❌ Assuming RLS is already enabled (it probably isn't)
- ❌ Using service role key in client-side code (security vulnerability)
- ❌ Trusting client-side validation only (can be bypassed)
- ❌ Returning raw error messages to users (information disclosure)
- ❌ Creating policies that are too permissive (`USING (true)` is dangerous)

### **Red Flags That Indicate Security Issues**
- Users can see other users' workout data
- Database queries work without authentication
- Console shows RLS policy violations
- Service role key visible in browser network tab
- Users can modify data they shouldn't have access to

---

## 🎯 **Success Criteria**

### **Security Implementation Complete When:**
- [ ] All tables have RLS enabled and appropriate policies
- [ ] Profiles table exists and auto-populates
- [ ] Users cannot access each other's data (tested)
- [ ] All application queries use secure patterns
- [ ] Authentication is required for all protected operations
- [ ] Input validation prevents malicious data
- [ ] Error handling doesn't leak sensitive information

### **Ready for Production When:**
- [ ] Security testing passes (all tests in supabase-security-implementation.md)
- [ ] No console errors in production build
- [ ] Cross-device sync works securely
- [ ] Performance is acceptable with security measures
- [ ] Monitoring/logging captures security events

---

**Next Steps:** 
1. Implement security measures from `supabase-security-implementation.md`
2. Test all security patterns thoroughly
3. Update application code to use secure query patterns
4. Verify no users can access each other's data

**Remember:** Security is not optional - it's a requirement for any production deployment.