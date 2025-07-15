# Supabase Setup Guide - Phase 1 Implementation

**Status:** Ready for Configuration  
**Next Step:** Set up your Supabase project and configure environment variables

## 🚀 Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click \"New Project\"
3. Choose organization and enter project details:
   - **Name:** `athletic-tracker-mvp`
   - **Database Password:** Choose a strong password
   - **Region:** Select closest to your users
4. Wait for project to be created (~2 minutes)

### 2. Get API Keys
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL:** `https://your-project-id.supabase.co`
   - **Project API Key (anon public):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Configure Environment Variables
1. In your project root: `/Users/alain/Projects/athletic-tracker-mvp/`
2. Create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```
3. Edit `.env.local` with your actual values:
   ```
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Set Up Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click \"New query\"
3. Copy and paste the entire contents of `/supabase/schema.sql`
4. Click \"Run\" to create all tables and policies

### 5. Configure Google OAuth (For Google Sign-In)
1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find \"Google\" and click the toggle to enable it
3. **For Development:**
   - Use pre-configured Supabase Google OAuth (no setup needed)
   - Just enable the toggle and you're ready

**For Production Setup (when deploying):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Copy Client ID and Secret to Supabase

### 6. Test the Setup
1. Install dependencies: `npm install`
2. Start development server: `npm start`
3. You should see the auth screen
4. Try signing in with Google
5. If successful, you'll see the workout logging interface

## ✅ Verification Checklist

**Environment Setup:**
- [ ] `.env.local` file created with correct Supabase credentials
- [ ] Database schema applied in Supabase SQL Editor
- [ ] Google OAuth provider enabled in Supabase
- [ ] `npm install` completed successfully

**App Functionality:**
- [ ] App loads without console errors
- [ ] Auth screen displays properly
- [ ] Google sign-in works (redirects and signs you in)
- [ ] After auth, workout logging screen appears
- [ ] Can log a test workout successfully
- [ ] Workout appears in history view
- [ ] Profile screen accessible with sign-out option

**Database Verification:**
- [ ] In Supabase dashboard → Table Editor, you see `workouts` table
- [ ] After logging test workout, data appears in workouts table
- [ ] Row Level Security policies are active (users only see their own data)

## 🔧 Troubleshooting

### Common Issues:

**\"Invalid API key\" error:**
- Double-check your `.env.local` file has correct values
- Restart development server (`npm start`) after changing .env.local
- Ensure no extra spaces in environment variable values

**Google sign-in not working:**
- Check that Google provider is enabled in Supabase Authentication
- For development, use Supabase's pre-configured Google OAuth
- Check browser console for specific error messages

**Database errors:**
- Verify schema.sql was run completely in Supabase SQL Editor
- Check that Row Level Security policies are created
- Ensure your user has proper permissions

**App not loading:**
- Run `npm install` to ensure all dependencies are installed
- Check that React development server is running on port 3000
- Look for console errors in browser developer tools

### Getting Help:
1. Check browser console for specific error messages
2. Check Supabase dashboard → Logs for server-side errors
3. Verify each setup step was completed correctly

## 📊 What's Included in Phase 1

**✅ Completed Features:**
- Google OAuth authentication
- Email/password authentication with verification
- User session management (48-hour timeout)
- Cloud database storage for workouts
- Real-time cross-device synchronization
- Profile/settings screen with sign-out
- Data export functionality
- Auto-navigation after workout logging

**🔄 Phase 1 Success Criteria:**
- Users can sign in with Google (no setup required)
- Workouts save to cloud database
- Data syncs across devices instantly
- Session management works properly
- App maintains existing UI/UX and <30 second logging

## 🚀 Ready for Alpha Testing

Once setup is complete, the app is ready for alpha testing with real users. The core value proposition remains the same:

**\"Log your workout in under 30 seconds. See your progress instantly.\"**

Plus now with cloud sync and authentication for persistent data across devices.

## 📋 Next Session: Phase 2 Planning

After successful Phase 1 testing:
- Apple and Facebook OAuth providers
- Enhanced profile/settings functionality  
- Team invitation system foundation
- Advanced analytics and goal setting
- Progressive Web App (PWA) installation

**Current Status:** Phase 1 implementation complete, ready for Supabase configuration and testing.
