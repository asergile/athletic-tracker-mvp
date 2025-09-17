# Deployment Guide

**Last Updated:** September 17, 2025  
**Status:** Production Deployment with Custom Domains  
**Target:** Live Production Environment with pbgb.ai/.io

## 🚀 Current Production Setup

### Production Environment (ESTABLISHED)
**Primary URL:** https://pbgb.ai  
**Redirect URL:** https://pbgb.io → https://pbgb.ai  
**Production Vercel:** https://pbgb-production.vercel.app  
**Staging URL:** https://athletic-tracker-mvp.vercel.app  

### Development Workflow
```bash
# 1. Develop locally
cd /Users/alain/Projects/athletic-tracker-mvp
npm start  # Test at localhost:3000

# 2. Push to staging
git checkout staging
git push origin staging  # Auto-deploys to staging URL

# 3. Test staging environment
# Visit: https://athletic-tracker-mvp.vercel.app

# 4. Deploy to production
git checkout main
git merge staging
git push origin main  # Auto-deploys to pbgb.ai
```

**Result:** Staged deployment with production safety

### Option 2: Netlify
```bash
# Build production version
npm run build

# Go to https://netlify.com
# Drag the /build folder to deploy
```

**Result:** Live app URL in ~1 minute

## ⚙️ Pre-Deployment Checklist

### Local Testing
- [ ] **Dependencies Install:** `npm install` completes without errors
- [ ] **Local Build:** `npm start` loads app at localhost:3000  
- [ ] **Core Functions:** Can log workout and view history
- [ ] **Mobile Test:** Works on phone browser (responsive design)
- [ ] **Performance:** Loads quickly, animations smooth

### Production Readiness
- [ ] **Build Success:** `npm run build` completes without errors
- [ ] **Bundle Size:** Build folder <5MB (target: <2MB)
- [ ] **No Console Errors:** Clean browser console on production build
- [ ] **PWA Ready:** Can "Add to Home Screen" on mobile
- [ ] **Cross-Browser:** Works in Chrome, Safari, Firefox

## 🔧 Deployment Configuration

### Vercel Setup (Detailed)
```bash
# Install Vercel CLI globally (first time only)
npm install -g vercel

# In project directory
cd /Users/alain/Projects/athletic-tracker-mvp

# Install project dependencies
npm install

# Deploy to Vercel
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: athletic-tracker-mvp
# - Directory: ./ (current directory)
# - Override settings? No

# For production deployment
vercel --prod
```

### Custom Domain (Optional)
```bash
# If you have a domain name
vercel domains add yourdomain.com
vercel alias [deployment-url] yourdomain.com
```

### Environment Variables (None needed for MVP)
Current app requires no environment variables - everything runs client-side.

## 📊 Post-Deployment Verification

### Functionality Testing
1. **Open deployed URL** in browser
2. **Log a test workout:** Select type → Enter duration → Rate experience → Submit
3. **Check history view:** Verify workout appears in history
4. **Test streak calculation:** Verify current streak shows correctly
5. **Mobile responsiveness:** Test on phone browser

### Performance Testing
- **Load Speed:** App loads within 2 seconds on 3G
- **Interaction Speed:** Button taps respond within 100ms  
- **Animation Smoothness:** Gradients and transitions smooth at 60fps
- **Bundle Analysis:** Total app size <500KB

### Analytics Setup (Optional)
```javascript
// Add to public/index.html if desired
<script>
  // Simple usage tracking
  window.addEventListener('load', () => {
    console.log('App loaded:', new Date().toISOString());
  });
</script>
```

## 🔒 Security Considerations

### Data Security (Local Storage)
- **No sensitive data:** Only workout type, duration, rating stored
- **Client-side only:** No server to secure or compromise
- **User owns data:** Stored locally in their browser
- **Privacy by design:** No tracking, accounts, or data collection

### Application Security
- **Static deployment:** No server-side vulnerabilities
- **HTTPS enforced:** Vercel/Netlify provide SSL by default
- **No authentication:** No login system to compromise
- **No external APIs:** No third-party data dependencies

## 📈 Monitoring Setup

### Basic Monitoring (Built-in)
```javascript
// Already included in app:
- Page load time logging
- Error tracking to console
- Local storage usage monitoring
```

### Enhanced Monitoring (Optional)
For alpha testing, consider adding:
- **User session tracking** (anonymous)
- **Workout logging frequency** analysis
- **Error reporting** service
- **Performance monitoring** dashboard

## 🔧 Troubleshooting

### Common Deployment Issues

#### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Vercel Deployment Fails
```bash
# Check node version
node --version
# Should be 16+ 

# Redeploy with specific settings
vercel --prod --build-env NODE_VERSION=18
```

#### App Doesn't Load
1. **Check browser console** for errors
2. **Verify bundle size** isn't too large
3. **Test different browsers** (Chrome, Safari, Firefox)
4. **Check mobile compatibility**

### Quick Fixes
- **Tailwind not loading:** CDN link in public/index.html present?
- **Icons not showing:** Lucide React dependency installed?
- **Data not persisting:** LocalStorage enabled in browser?
- **Animations laggy:** Test on different device/browser

## 🚦 Go-Live Checklist

### Pre-Alpha Release
- [ ] **Production URL live** and accessible
- [ ] **Core functionality verified** on deployed version
- [ ] **Mobile experience tested** on iOS/Android
- [ ] **Performance acceptable** (<2s load, smooth interactions)
- [ ] **No console errors** on production build

### Alpha Testing Ready
- [ ] **User instructions prepared** (1 page max)
- [ ] **Feedback collection system** ready (Google Form/email)
- [ ] **Alpha user list confirmed** (5-10 committed athletes)
- [ ] **Check-in schedule planned** (Day 1, 3, 7, 14)
- [ ] **Success metrics defined** (30s logging, 5+ workouts/week)

### Communication Materials
- [ ] **Alpha invite message** written and tested
- [ ] **App instructions** clear and concise
- [ ] **Feedback channels** established and communicated
- [ ] **Check-in cadence** scheduled with users

## 🎯 Post-Deployment Actions

### Immediate (Day 1)
1. **Send app URL to first alpha user** for initial test
2. **Monitor first few workout logs** for any issues
3. **Collect initial feedback** on first impression
4. **Fix any critical bugs** that emerge

### Week 1
1. **Send to all alpha users** with instructions
2. **Monitor usage patterns** daily
3. **Respond to feedback** quickly
4. **Track logging times** and user engagement

### Ongoing
1. **Weekly usage analysis** from localStorage data
2. **Feedback synthesis** and prioritization
3. **Performance monitoring** and optimization
4. **Iteration planning** based on user behavior

## 🔄 Update Deployment Process

### For Future Updates
```bash
# Make changes to code
# Test locally
npm start

# Build and deploy
npm run build
vercel --prod
```

### Rollback Process
```bash
# View previous deployments
vercel ls

# Rollback to previous version
vercel alias [previous-deployment-url] [your-domain]
```

### Feature Flag Strategy (Future)
For testing new features with subset of users:
```javascript
// Simple feature flagging
const isAlphaUser = localStorage.getItem('alpha-user') === 'true';
if (isAlphaUser) {
  // Show new feature
}
```

**Ready to deploy!** 🚀

**Next:** `npm install && vercel --prod` then send to alpha users.