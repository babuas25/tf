# Neon Database Setup Guide for Travellers Module

## 🚀 Complete Step-by-Step Setup

### **Step 1: Create Neon Database**

1. **Visit Neon Console:**
   - Go to [https://console.neon.tech](https://console.neon.tech)
   - Sign up or log in with your GitHub account

2. **Create New Project:**
   - Click "Create Project"
   - Choose a project name (e.g., "tripfeels-travellers")
   - Select your preferred region (closest to your users)
   - Choose PostgreSQL version (recommended: 15 or 16)
   - Click "Create Project"

3. **Get Connection Details:**
   - After creation, go to "Connection Details" tab
   - Copy the connection string (it looks like: `postgresql://username:password@host/database?sslmode=require`)
   - Save this for your environment variables

### **Step 2: Install Dependencies**

```bash
npm install @neondatabase/serverless drizzle-orm drizzle-kit postgres
```

### **Step 3: Environment Variables**

Create a `.env.local` file in your project root:

```env
# Database (Neon)
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# NextAuth (existing)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Firebase (existing)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### **Step 4: Generate Database Schema**

```bash
npm run db:generate
```

This will create migration files in the `drizzle` folder.

### **Step 5: Push Schema to Database**

```bash
npm run db:push
```

This will create the tables in your Neon database.

### **Step 6: Verify Database Setup**

```bash
npm run db:studio
```

This opens Drizzle Studio where you can view and manage your database.

## 📊 Database Schema

### **Travellers Table Structure:**

```sql
CREATE TABLE travellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ptc VARCHAR(10) NOT NULL, -- Adult, Child, Infant
  given_name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL, -- Male, Female, Other
  birthdate DATE NOT NULL,
  nationality VARCHAR(3) NOT NULL, -- Country code (BD, US, etc.)

  -- Contact Information
  phone_number VARCHAR(20) NOT NULL,
  country_dialing_code VARCHAR(5) NOT NULL,
  email_address VARCHAR(255) NOT NULL,

  -- Identity Document
  document_type VARCHAR(50) NOT NULL, -- Passport, National ID, etc.
  document_id VARCHAR(100) NOT NULL,
  document_expiry_date DATE NOT NULL,

  -- Special Service Requests (SSR)
  ssr_codes JSONB DEFAULT '[]',
  ssr_remarks JSONB DEFAULT '{}',

  -- Loyalty Program
  loyalty_airline_code VARCHAR(10) DEFAULT '',
  loyalty_account_number VARCHAR(50) DEFAULT '',

  -- Metadata
  created_by VARCHAR(50) NOT NULL, -- User role who created
  created_by_user_id UUID NOT NULL, -- User ID who created
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## 🔧 API Endpoints

### **GET /api/travellers**

- Get all travellers with role-based filtering
- Query parameters: `search`, `ptc`, `nationality`
- Returns: Array of travellers

### **POST /api/travellers**

- Create new traveller
- Body: Traveller data
- Returns: Created traveller

### **GET /api/travellers/[id]**

- Get traveller by ID
- Returns: Single traveller

### **PUT /api/travellers/[id]**

- Update traveller
- Body: Updated traveller data
- Returns: Updated traveller

### **DELETE /api/travellers/[id]**

- Delete traveller (SuperAdmin only)
- Returns: Success message

## 🛡️ Role-Based Access Control

### **SuperAdmin:**

- ✅ Can see, add, edit, delete all travellers
- ✅ Full access to all traveller data

### **Admin:**

- ✅ Can see, add, edit all travellers
- ❌ Cannot delete travellers

### **Staff, Agent, Partner, User:**

- ✅ Can see, add, edit only their own travellers
- ❌ Cannot delete travellers
- ❌ Cannot see other users' travellers

## 📱 Frontend Integration

### **Update Travellers Pages:**

1. **Replace mock data** with API calls
2. **Add loading states** for better UX
3. **Handle errors** gracefully
4. **Implement real-time updates**

### **Example API Integration:**

```typescript
// Fetch travellers
const response = await fetch('/api/travellers?search=john&ptc=Adult')
const data = await response.json()
const travellers = data.travellers

// Create traveller
const response = await fetch('/api/travellers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(travellerData),
})
```

## 🔍 Database Management

### **Useful Commands:**

```bash
# Generate new migration
npm run db:generate

# Push schema changes
npm run db:push

# Open database studio
npm run db:studio

# Run migrations (if using migrations)
npm run db:migrate
```

### **Drizzle Studio Features:**

- View all tables and data
- Edit records directly
- Run SQL queries
- Export/import data
- Monitor database performance

## 🚀 Production Deployment

### **Environment Variables for Production:**

```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
```

### **Database Backup:**

- Neon provides automatic backups
- Configure backup retention policy
- Test restore procedures regularly

## 🔧 Troubleshooting

### **Common Issues:**

1. **Connection Error:**
   - Check DATABASE_URL format
   - Verify SSL mode is set to 'require'
   - Ensure database is active

2. **Schema Sync Issues:**
   - Run `npm run db:push` to sync schema
   - Check for conflicting migrations

3. **Permission Errors:**
   - Verify role-based access control
   - Check user session and permissions

### **Debug Commands:**

```bash
# Check database connection
npm run db:studio

# View generated migrations
ls -la drizzle/

# Check environment variables
echo $DATABASE_URL
```

## 📈 Performance Optimization

### **Database Indexes:**

- Add indexes for frequently queried fields
- Consider composite indexes for search queries
- Monitor query performance

### **Connection Pooling:**

- Neon handles connection pooling automatically
- Configure appropriate pool sizes
- Monitor connection usage

---

**Status**: ✅ **READY** - Complete Neon database setup for Travellers module
