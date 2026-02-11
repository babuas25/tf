# Firebase Troubleshooting Guide

This guide helps you diagnose and fix Firebase connection issues in your TripFeels application.

## Common Console Errors and Solutions

### 1. Firestore Connection Timeout Errors

**Error Pattern:**
```
@firebase/firestore: Firestore (10.x.x): Could not reach Cloud Firestore backend. Backend didn't respond within 10 seconds.
```

**Causes & Solutions:**

#### Environment Variables Missing
Check that all Firebase environment variables are properly set in `.env.local`:

```bash
# Required Firebase Client Variables
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcd1234"

# Required Firebase Server Variables
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----"
```

#### Network/Firewall Issues
1. Check your internet connection
2. Disable VPN temporarily to test
3. Check if corporate firewall is blocking Firebase domains:
   - `*.googleapis.com`
   - `*.firebase.com`
   - `*.firebaseapp.com`

#### Firebase Project Configuration
1. Verify your Firebase project is active
2. Check Firebase console for service status
3. Ensure Firestore is enabled in your project
4. Verify Authentication is enabled

### 2. Authentication Backend Connection Issues

**Error Pattern:**
```
auth/network-request-failed
auth/internal-error
```

**Solutions:**

#### Check Firebase Authentication Settings
1. Go to Firebase Console → Authentication
2. Ensure Email/Password provider is enabled
3. Check if Google/Facebook providers are properly configured
4. Verify authorized domains include `localhost` and your production domain

#### API Key Issues
1. Ensure your Firebase API key has proper restrictions
2. Check that the API key isn't restricted to specific IPs if testing locally
3. Regenerate API key if needed

### 3. CORS and Domain Issues

**Error Pattern:**
```
Access to fetch at 'https://identitytoolkit.googleapis.com/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**

#### Add Authorized Domains
1. Go to Firebase Console → Authentication → Settings
2. Add authorized domains:
   - `localhost` (for development)
   - Your production domain
   - `127.0.0.1` (if needed)

## Debug Tools

### 1. Firebase Status Component (Development Only)

The app includes a Firebase debug component that appears in the bottom-right corner during development. It shows:
- Connection status for Auth and Firestore
- Current user information
- Recent errors
- Configuration details

### 2. Browser Console Diagnostics

Open browser console and run:
```javascript
// Run complete Firebase diagnostics
runFirebaseTests()

// Quick connectivity test
quickFirebaseTest()

// Manual diagnostics
firebaseDebugger.diagnose()
```

### 3. Environment Variable Check

Create a simple test file to verify environment variables:

```javascript
// Check in browser console
console.log('Firebase Config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
})
```

## Step-by-Step Troubleshooting

### Step 1: Verify Environment Setup

1. Copy `env.template` to `.env.local`
2. Fill in all required Firebase values
3. Restart your development server
4. Check browser console for initialization messages

### Step 2: Test Basic Connectivity

1. Open browser developer tools
2. Go to Network tab
3. Try to sign in
4. Check for failed requests to Firebase domains
5. Look for specific error codes in responses

### Step 3: Check Firebase Project Status

1. Visit [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Check project status (should be active)
4. Verify billing account if using paid features
5. Check quotas and usage limits

### Step 4: Test Authentication Flow

1. Try anonymous sign-in first (simpler to debug)
2. Test email/password authentication
3. Test social authentication (Google/Facebook)
4. Check Firebase Console → Authentication → Users for created accounts

### Step 5: Test Firestore Connection

1. Try reading from a public collection
2. Try writing to Firestore (check security rules)
3. Monitor Firebase Console → Firestore → Usage

## Common Mistakes

### 1. Environment Variable Naming
- Must start with `NEXT_PUBLIC_` for client-side variables
- Server-side variables should NOT have `NEXT_PUBLIC_` prefix

### 2. Firebase Private Key Format
```bash
# Wrong - single line
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQ..."

# Correct - with \n for line breaks
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----"
```

### 3. Project ID Mismatch
Ensure the project ID in your environment variables matches your Firebase console URL.

### 4. Firestore Security Rules
Default rules deny all access. Update rules for development:

```javascript
// Temporary development rules (NOT for production)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Emergency Reset Steps

If nothing else works:

1. **Create New Firebase Project**
   - Go to Firebase Console
   - Create new project
   - Enable Authentication and Firestore
   - Get new configuration values

2. **Clear Browser Data**
   - Clear localStorage and sessionStorage
   - Clear cookies for localhost
   - Hard refresh (Ctrl+Shift+R)

3. **Reset Environment**
   - Delete `.env.local`
   - Copy fresh `env.template`
   - Fill with new Firebase project values
   - Restart development server

4. **Check Service Worker**
   - Unregister any service workers in DevTools → Application
   - Clear all storage

## Production Deployment Issues

### Domain Authorization
1. Add production domain to Firebase Console → Authentication → Settings
2. Update CORS settings if needed
3. Verify SSL certificates

### Environment Variables
1. Ensure all environment variables are set in production environment
2. Check that `NEXTAUTH_URL` matches your domain
3. Verify `NEXTAUTH_SECRET` is set to a secure value

### Security Rules
Update Firestore security rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add other collection rules as needed
  }
}
```

## Getting Help

### 1. Check Logs
- Browser console errors
- Network tab in DevTools
- Firebase Console logs

### 2. Error Reporting
When reporting issues, include:
- Exact error message
- Browser and version
- Steps to reproduce
- Environment (development/production)
- Firebase project region

### 3. Firebase Support Resources
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Status Page](https://status.firebase.google.com/)
- [Stack Overflow - Firebase Tag](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase GitHub Issues](https://github.com/firebase/firebase-js-sdk/issues)

## Quick Reference

### Essential Commands
```bash
# Check environment variables
npm run dev -- --inspect

# Clear Next.js cache
rm -rf .next

# Check Firebase CLI version
firebase --version

# Test Firebase connection
firebase projects:list
```

### Key Files to Check
- `.env.local` - Environment variables
- `src/lib/firebase/config.ts` - Firebase initialization
- `src/lib/auth/nextauth.ts` - NextAuth configuration
- `next.config.js` - Next.js configuration

### Browser DevTools Shortcuts
- `Ctrl+Shift+I` - Open DevTools
- `Ctrl+Shift+R` - Hard refresh
- `F12` → Application → Storage - Clear storage
- `F12` → Network - Monitor requests