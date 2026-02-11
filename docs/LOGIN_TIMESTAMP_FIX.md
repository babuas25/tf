# Login Timestamp Update Fix

## 🐛 Problem Identified

The "Not available" text for `lastLoginAt` was showing even after logout/login because the timestamp was **NOT being updated** for credentials login (email/password). Only social logins (Google/Facebook) were updating the timestamp.

### Root Cause

- **Social Logins**: ✅ `lastLoginAt` was being updated in the NextAuth JWT callback
- **Credentials Login**: ❌ `lastLoginAt` was **NOT** being updated in the credentials provider

## 🔧 Solution Implemented

### **Fixed Credentials Login Flow** (`src/lib/auth/nextauth.ts`)

Added timestamp update to the credentials provider's `authorize` function:

```typescript
// Before: Only retrieved user data
const userData = await getUser(user.uid)
if (userData) {
  return {
    /* user data */
  }
}

// After: Update timestamp AND retrieve user data
const userData = await getUser(user.uid)
if (userData) {
  // Update last login timestamp for credentials login
  try {
    await adminDb.collection('users').doc(user.uid).update({
      'metadata.lastLoginAt': new Date(),
    })
    console.log('Updated last login timestamp for credentials user:', user.email)
  } catch (error) {
    console.error('Error updating last login timestamp:', error)
  }

  return {
    /* user data */
  }
}
```

### **Added Required Import**

- Added `adminDb` import from `@/lib/firebase/admin` to enable Firestore updates

## 📊 Authentication Flow Comparison

### **Social Logins (Google/Facebook)**

1. User clicks social login button
2. NextAuth handles OAuth flow
3. JWT callback updates `lastLoginAt` timestamp ✅
4. User is logged in

### **Credentials Login (Email/Password) - FIXED**

1. User enters email/password
2. Credentials provider validates with Firebase Auth
3. **NEW**: Updates `lastLoginAt` timestamp in Firestore ✅
4. Returns user data to NextAuth
5. User is logged in

## 🎯 Benefits

### **Consistent Behavior**

- All login methods now update the `lastLoginAt` timestamp
- Users will see their actual last login time instead of "Not available"

### **Better User Experience**

- Accurate login tracking for all authentication methods
- Consistent timestamp display across the application

### **Error Handling**

- Added try-catch block to handle potential Firestore update errors
- Logs success/failure for debugging purposes

## 🔍 Testing Instructions

To verify the fix:

1. **Logout** from the application
2. **Login** using email/password credentials
3. **Check** the user management interface
4. **Verify** that `lastLoginAt` shows the current date/time instead of "Not available"

## 📝 Technical Details

### **Timestamp Format**

- Uses `new Date()` which creates a JavaScript Date object
- Firebase Admin SDK automatically converts this to a Firestore Timestamp
- The frontend utility function `formatFirebaseTimestamp()` handles the conversion to readable format

### **Database Update**

- Updates the `metadata.lastLoginAt` field in the user's Firestore document
- Uses Firebase Admin SDK for server-side database operations
- Non-blocking operation (doesn't affect login flow if it fails)

## ✅ Verification

- ✅ Added timestamp update to credentials login
- ✅ Added proper error handling
- ✅ Added logging for debugging
- ✅ No linting errors
- ✅ Maintains existing functionality

---

**Status**: ✅ **FIXED** - Credentials login now updates `lastLoginAt` timestamp
