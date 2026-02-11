# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# =============================================================================
# NEXTAUTH CONFIGURATION
# =============================================================================
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# =============================================================================
# FIREBASE CLIENT CONFIGURATION (Public - Safe to expose)
# =============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="your-firebase-app-id"
NEXT_PUBLIC_MEASUREMENT_ID="G-XXXXXXXXXX"

# =============================================================================
# FIREBASE ADMIN SDK (Server-side - Keep Secret!)
# =============================================================================
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----"

# =============================================================================
# OAUTH PROVIDERS
# =============================================================================
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_URL="postgresql://neondb_owner:npg_k7bjuht2NUyP@ep-ancient-shadow-a1ulnnw4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# =============================================================================
# SUPER ADMIN CONFIGURATION
# =============================================================================
SUPER_ADMIN_EMAILS="admin@tripfeels.com,superadmin@tripfeels.com"
NEXT_PUBLIC_SUPER_ADMIN_EMAILS="admin@tripfeels.com,superadmin@tripfeels.com"

# =============================================================================
# ERROR MONITORING (OPTIONAL - SENTRY)
# =============================================================================
SENTRY_DSN="your-sentry-dsn-here"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn-here"
NEXT_PUBLIC_APP_VERSION="1.0.0"
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="your-sentry-project"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
```

## 🔧 Setup Instructions

### 1. NextAuth Configuration

```bash
# Generate a secure secret key
openssl rand -base64 32
```

- Use the generated key for `NEXTAUTH_SECRET`
- Set `NEXTAUTH_URL` to your domain (localhost:3000 for development)

### 2. Firebase Setup

**Client Configuration (Public):**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Project Settings → General
3. Copy the config values to `NEXT_PUBLIC_FIREBASE_*` variables

**Admin SDK (Server-side):**

1. Go to Project Settings → Service Accounts
2. Generate new private key
3. Use the downloaded JSON values for `FIREBASE_*` variables
4. ⚠️ **Important**: Replace `\n` with actual newlines in private key

### 3. OAuth Providers Setup

**Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

**Facebook OAuth:**

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create new app → Add Facebook Login
3. Add redirect URI: `http://localhost:3000/api/auth/callback/facebook`

### 4. Database Setup (Neon PostgreSQL)

1. Go to [Neon Console](https://console.neon.tech)
2. Create new project or select existing
3. Go to "Connection Details"
4. Copy the connection string to `DATABASE_URL`

### 5. Super Admin Configuration

- Add comma-separated email addresses to `SUPER_ADMIN_EMAILS`
- These users will automatically get SuperAdmin role upon registration

### 6. Error Monitoring Setup (Optional)

**Basic Error Monitoring (Built-in):**

- Error boundaries and logging are automatically enabled
- Errors are logged to browser console and localStorage in development
- No additional setup required

**Advanced Error Monitoring (Sentry):**

1. Create account at [Sentry.io](https://sentry.io)
2. Create new Next.js project
3. Copy DSN to `SENTRY_DSN` variables
4. Follow the [Sentry Integration Guide](./SENTRY_INTEGRATION_GUIDE.md) for full setup

### 7. Rate Limiting Configuration (Built-in)

**API Rate Limiting:**

- Comprehensive rate limiting is automatically enabled
- Protects against API abuse and ensures fair usage
- Multiple strategies: IP-based, user-based, combined
- No additional setup required for basic functionality

**Optional Configuration:**

```env
# Rate limiting (enabled by default)
RATE_LIMIT_ENABLED=true

# Redis for distributed rate limiting (optional)
RATE_LIMIT_REDIS_URL=redis://localhost:6379
```

**Rate Limit Types:**

- Authentication: 5 attempts per 15 minutes (IP-based)
- API General: 60 requests per minute (IP + User)
- Admin Operations: 30 requests per minute (User-based)
- User Management: 10 requests per 5 minutes (User-based)
- File Uploads: 5 uploads per minute (User-based)

## 🛡️ Security Notes

### ⚠️ **CRITICAL - Never Commit These Files:**

- `.env.local`
- `.env`
- Any file containing actual secrets

### 🔒 **Environment Variable Security:**

- **Public variables** (`NEXT_PUBLIC_*`): Safe to expose, used in browser
- **Private variables**: Server-side only, never expose to client
- **Firebase Admin SDK**: Most sensitive, gives full database access

### 📋 **Production Deployment:**

1. Set all environment variables in your hosting platform
2. Use different Firebase projects for dev/staging/production
3. Rotate secrets regularly
4. Monitor for exposed credentials

## ✅ **Verification Checklist**

After setting up your `.env.local`:

- [ ] NextAuth login/logout works
- [ ] Google OAuth login works
- [ ] Facebook OAuth login works (if configured)
- [ ] Firebase Admin operations work (user creation, role assignment)
- [ ] Database connection works (if using travellers module)
- [ ] Super admin emails get correct role assignment
- [ ] Error boundaries catch and display errors properly
- [ ] Error monitoring logs errors to console/localStorage
- [ ] Sentry integration works (if configured)
- [ ] Rate limiting is working (check `/api/rate-limit/status`)
- [ ] Rate limit headers appear in API responses
- [ ] Rate limit statistics accessible to SuperAdmin (`/api/rate-limit/stats`)
- [ ] Rate limiting blocks excessive requests (test with rapid API calls)

## 🚨 **Troubleshooting**

**Common Issues:**

1. **Firebase Admin errors**: Check private key formatting (newlines)
2. **OAuth redirect errors**: Verify redirect URIs in provider settings
3. **Database connection errors**: Check DATABASE_URL format and credentials
4. **NextAuth session issues**: Verify NEXTAUTH_SECRET and NEXTAUTH_URL

**Debug Mode:**

- Set `NODE_ENV=development` to see detailed error messages
- Check browser console and server logs for specific error details
