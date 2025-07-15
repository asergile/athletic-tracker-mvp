# Supabase Implementation Plan

**Status:** Ready for Implementation (Approved July 10, 2025)  
**Priority:** Critical for Alpha Testing Success  
**Goal:** Replace localStorage with cloud database + auth system

## 🎯 **Approved Implementation Scope**

### **Core Requirements**
- **Database:** Supabase PostgreSQL for workout storage
- **Authentication:** Social login (Google/Apple/Facebook) + email/password backup
- **Email Verification:** Required for new email signups
- **Session Management:** 48-hour auto-logout, reset on any interaction
- **Cross-Device Sync:** Real-time workout data synchronization

### **User Experience Changes**
- **Auth Flow:** Users must sign in to access app
- **Success Navigation:** After logging workout → auto-navigate to history view
- **Profile/Settings:** New screen accessible from history view
- **Data Persistence:** No more manual backup/restore needed

## 📱 **Complete User Workflow**

### **New User Journey**
```
1. Open App → Auth Screen
2. Choose: [Google] [Apple] [Facebook] OR [Email Signup]
3. Email users → Verify email before access
4. Social login → Immediate access
5. Log Workout Screen (same UI)
6. Fill workout → Success animation → Auto-navigate to History
7. History View → Updated stats, new workout at top
8. Profile icon → Settings/Profile screen
```

### **Returning User Journey**
```
1. Open App → Auto-login check
2. If < 48 hours since last activity → Direct to Log Workout
3. If > 48 hours → Return to Auth Screen
4. Any interaction resets 48-hour timer
```

## 🗄️ **Database Schema**

### **Workouts Table**
```sql
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating IN (1,2,3)),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own workouts
CREATE POLICY "Users can view own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id);
```

### **User Settings Table (Future)**
```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  privacy_level TEXT DEFAULT 'standard',
  auto_logout_hours INTEGER DEFAULT 48,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 **Authentication Configuration**

### **Required OAuth Providers**
- **Google:** For Gmail integration
- **Apple:** For iOS users  
- **Facebook:** For social users
- **Email/Password:** Backup option with verification

### **Supabase Auth Settings**
```javascript
// Site URL: https://athletic-tracker-mvp.vercel.app
// Redirect URLs: 
// - https://athletic-tracker-mvp.vercel.app/auth/callback
// - http://localhost:3000/auth/callback (development)

// Email Templates: Customize verification email
// Session Duration: 48 hours
// Email Confirmation: Required for email signups
```

## 🖼️ **Screen Wireframes**

### **1. Auth/Landing Screen (NEW)**
```
┌─────────────────────────────────┐
│    💪 Athletic Tracker          │
│                                 │
│   Log workouts in 30 seconds   │
│   Track your progress instantly │
│                                 │
│  [🔵 Continue with Google]      │
│  [⚫ Continue with Apple]        │
│  [🔷 Continue with Facebook]     │
│                                 │
│     ── OR ──                    │
│                                 │
│  📧 Email: ________________     │
│  🔒 Password: _____________     │
│                                 │
│  [Create Account] [Sign In]     │
│                                 │
│  New? → Create Account          │
│  Have account? → Sign In        │
└─────────────────────────────────┘
```

### **2. Log Workout Screen (SAME + auto-navigation)**
- Same UI as current
- After success animation → auto-navigate to History
- Data saves to Supabase instead of localStorage

### **3. History Screen (SAME + profile access)**
- Same UI as current  
- Profile icon (👤) in top right
- Loads data from Supabase
- Shows fresh stats after workout logging

### **4. Profile/Settings Screen (NEW)**
```
┌─────────────────────────────────┐
│  ← Profile & Settings           │
│                                 │
│  👤 John Athlete               │
│  📧 john@example.com           │
│                                 │
│  ──── ACCOUNT ────             │
│  📧 Change Email               │
│  🔒 Change Password            │
│  🚪 Sign Out                   │
│                                 │
│  ──── SHARING (Future) ────    │
│  👥 Manage Coaches & Parents   │
│  🔒 Privacy Settings           │
│  📤 Invite Others              │
│                                 │
│  ──── DATA ────                │
│  📊 Export Workouts            │
│  🗑️  Delete Account            │
└─────────────────────────────────┘
```

## 🔄 **Component Changes Required**

### **New Components**
1. **AuthScreen.js** - Social login + email signup
2. **ProfileScreen.js** - Settings and account management  
3. **LoadingScreen.js** - Auth state checking
4. **ProtectedRoute.js** - Ensure user authenticated

### **Modified Components**
1. **App.js** - Add auth state management, session timer
2. **LogWorkoutView.js** - Replace localStorage with Supabase calls
3. **HistoryView.js** - Load from database, add profile navigation
4. **All components** - Add session timer reset on interactions

## 📊 **Data Migration Strategy**

### **MVP Approach: No Migration**
- Fresh start for alpha testing
- Users create new accounts
- No localStorage import (alpha phase acceptable)

### **Future Consideration**
- Export/import functionality in Profile settings
- One-time migration tool for existing users

## 🧪 **Testing Requirements**

### **Auth Flow Testing**
- [ ] Google OAuth works on mobile/desktop
- [ ] Apple OAuth works on iOS
- [ ] Facebook OAuth works across platforms
- [ ] Email verification email sent and received
- [ ] Password reset functionality
- [ ] Session timeout at 48 hours
- [ ] Session reset on user interaction

### **Data Flow Testing**  
- [ ] Workouts save to database
- [ ] Real-time sync across devices
- [ ] History loads from database
- [ ] Auto-navigation after workout success
- [ ] Profile screen accessible and functional

### **Cross-Device Testing**
- [ ] Log workout on phone → see on laptop instantly
- [ ] Login on multiple devices simultaneously
- [ ] Logout on one device doesn't affect others

## 🚀 **Implementation Priority Order**

### **Phase 1: Core Infrastructure**
1. Supabase project setup
2. Database schema creation
3. Auth provider configuration (Google first)
4. Basic auth state management in App.js

### **Phase 2: Auth UI**
1. AuthScreen component with Google login
2. Loading states and error handling
3. Add Apple and Facebook providers
4. Email/password signup with verification

### **Phase 3: Data Integration**
1. Replace localStorage calls with Supabase
2. Update LogWorkoutView to save to database
3. Update HistoryView to load from database
4. Implement auto-navigation after success

### **Phase 4: Profile & Settings**
1. ProfileScreen component
2. Profile navigation from History
3. Basic account management (change email/password)
4. Sign out functionality

### **Phase 5: Session Management**
1. 48-hour auto-logout implementation
2. Session timer reset on interactions
3. Graceful session expiry handling

## ⚠️ **Implementation Notes**

### **Critical Success Factors**
- Keep existing UI/UX exactly the same
- Maintain <30 second workout logging time
- Real-time sync must be seamless
- Auth flow must be simple and fast

### **Development Workflow**
- Follow new protocol: Propose → Approve → Implement → Test locally → Push
- Test each phase thoroughly before moving to next
- Maintain backward compatibility during transition

## 📋 **Ready for Implementation**

**User Approval Status:** ✅ Approved  
**Wireframes Confirmed:** ✅ Complete  
**Technical Approach:** ✅ Validated  
**Next Step:** Implement Phase 1 (Supabase setup + basic auth)

**Implementation can begin with explicit user confirmation.**