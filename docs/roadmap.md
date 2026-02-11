# Complete Project Prompt: Role-Based Dashboard System

## 🎯 Project Overview

Build a **scalable role-based dashboard application** using **Next.js 14 (App Router)**, **NextAuth.js**, **Firebase (Firestore + Admin SDK)**, and **shadcn/ui + TailwindCSS**. The system must support hierarchical role management, social authentication, and role-specific dashboard access with enterprise-grade security.

---

## 🔧 Core Functional Requirements

### 1. Authentication System

**NextAuth.js Integration with Firebase Backend**

#### Authentication Providers:

- **Email & Password** (Credentials provider via NextAuth)
- **Google OAuth**
- **Facebook OAuth**

#### User Registration Flow:

```typescript
// Registration payload structure
interface UserRegistration {
  firstName: string
  lastName: string
  email: string
  password: string
  gender: 'Male' | 'Female' | 'Other'
  dateOfBirth: string // YYYY-MM-DD format
  mobile: string
  role?: 'User' // Default assignment
}
```

#### Firebase User Document Structure:

```typescript
// Firestore: /users/{uid}
interface UserDocument {
  uid: string
  email: string
  role: RoleType
  profile: {
    firstName: string
    lastName: string
    gender: 'Male' | 'Female' | 'Other'
    dateOfBirth: string
    mobile: string
    avatar?: string
  }
  metadata: {
    createdAt: Timestamp
    lastLoginAt: Timestamp
    isActive: boolean
    emailVerified: boolean
  }
  permissions?: string[]
  assignedBy?: string // uid of admin who assigned role
}
```

#### Special Admin Assignment:

- **Automatic SuperAdmin Assignment**:
  - `babuas25@gmail.com`
  - `md.ashifbabu@gmail.com`
- These emails receive `SuperAdmin` role immediately upon registration/first login

---

## 2. Role-Based Access Control (RBAC)

### Role Hierarchy & Permissions:

#### **SuperAdmin** (`/superadmin/admin`)

- **Full system access**
- Can assign **any role** including SuperAdmin & Admin
- Can override all lower-role permissions
- Can manage system settings
- Can delete/deactivate any user

#### **Admin** (`/users/admin`)

- Can manage: Staff, Partner, Agent, User
- **Cannot** manage: SuperAdmin or other Admins
- Can view all user analytics
- Can manage content and system configurations

#### **Staff** (`/users/staff`)

- **Sub-roles with specific functions:**
  - `Accounts` - Financial management
  - `Support` - Customer service
  - `Key Manager` - Access management
  - `Research` - Data analysis
  - `Media` - Content management
  - `Sales` - Sales operations
- Dashboard access only to assigned functions

#### **Partner** (`/users/partner`)

- **Sub-roles:**
  - `Supplier` - Inventory management
  - `Service Provider` - Service delivery
- Limited dashboard with partner-specific tools

#### **Agent** (`/users/agent`)

- **Sub-roles:**
  - `Distributor` - Distribution management
  - `Franchise` - Franchise operations
  - `B2B` - Business-to-business operations
- Agent-specific dashboard and reporting

#### **User** (`/users/publicuser`)

- **Default role** for all new registrations
- Basic dashboard with personal profile management
- Limited feature access

### Role Assignment Rules:

```typescript
type RoleAssignmentMatrix = {
  SuperAdmin: ['SuperAdmin', 'Admin', 'Staff', 'Partner', 'Agent', 'User']
  Admin: ['Staff', 'Partner', 'Agent', 'User']
  Staff: [] // Cannot assign roles
  Partner: [] // Cannot assign roles
  Agent: [] // Cannot assign roles
  User: [] // Cannot assign roles
}
```

---

## 3. Page Structure & Routing

### **Home Page** (`/`)

- **Public landing page**
- Hero section with app overview
- Feature highlights
- Call-to-action buttons (Sign In / Register)
- Responsive design
- SEO optimized

### **Authentication Page** (`/auth`)

- **Dual-tab interface**: Sign In | Registration
- **Sign In Form:**
  - Email/Password fields
  - Social login buttons (Google, Facebook)
  - "Forgot Password" link
  - "Remember Me" checkbox
- **Registration Form:**

  ```typescript
  interface RegistrationFields {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
    gender: 'Male' | 'Female' | 'Other'
    dateOfBirth: string
    mobile: string
    acceptTerms: boolean
  }
  ```

- **Form Validation:**
  - Email format validation
  - Password strength requirements (8+ chars, uppercase, lowercase, number)
  - Phone number validation
  - Age verification (18+)

### **Dashboard System** (`/dashboard`)

- **Protected routes** - redirect to `/auth` if unauthenticated
- **Role-based dashboard rendering**
- **Common Dashboard Components:**
  - Collapsible sidebar (collapsed by default)
  - User profile dropdown
  - Notification center
  - Search functionality
  - Breadcrumb navigation

#### Dashboard Widgets (Role-Specific):

```typescript
interface DashboardWidget {
  id: string
  title: string
  type: 'stats' | 'chart' | 'table' | 'quick-actions'
  data: any
  permissions: RoleType[]
  size: 'small' | 'medium' | 'large'
}
```

**Universal Widgets:**

- Welcome banner with user info
- Quick actions panel
- Recent activity feed
- System notifications

**Role-Specific Widgets:**

- **SuperAdmin/Admin**: User management, system analytics, role assignment
- **Staff**: Task management, department metrics, team collaboration
- **Partner**: Partner performance, supply chain metrics
- **Agent**: Sales pipeline, territory management, commission tracking
- **User**: Personal profile, usage statistics, preference settings

---

## 🎨 Design System & UI/UX

### Typography

```css
/* Font Configuration */
@import url('https://fonts.googleapis.com/css2?family=Geist+Sans:wght@300;400;500;600;700&display=swap');

/* Logo Font - Google Sans Bold */
@font-face {
  font-family: 'Google Sans';
  src: url('./fonts/GoogleSans-Bold.ttf') format('truetype');
  font-weight: 700;
  font-display: swap;
}
```

### Color Palette

```typescript
// tailwind.config.ts
const colors = {
  // Primary Brand Colors
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Main primary
    600: '#2563EB', // DEFAULT
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },

  // Secondary Accent
  secondary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // DEFAULT
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Neutral Grays
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // Status Colors
  success: {
    DEFAULT: '#22C55E',
    light: '#4ADE80',
    dark: '#15803D',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FDE047',
    dark: '#D97706',
  },
  danger: {
    DEFAULT: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
  },
  info: {
    DEFAULT: '#3B82F6',
    light: '#60A5FA',
    dark: '#1D4ED8',
  },
}
```

### Component Design Principles

- **Consistent spacing**: Use Tailwind's spacing scale (4px increments)
- **Subtle shadows**: Implement depth with `shadow-sm`, `shadow-md`, `shadow-lg`
- **Rounded corners**: Default `rounded-lg` (8px) for cards, `rounded-md` (6px) for inputs
- **Micro-interactions**: Hover states, loading states, smooth transitions
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support

---

## 🏗️ Technical Architecture

### Project Structure

```
src/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Route groups
│   │   ├── auth/
│   │   │   ├── page.tsx         # Sign In/Register
│   │   │   └── loading.tsx
│   │   └── layout.tsx           # Auth layout
│   ├── (dashboard)/
│   │   ├── dashboard/           # Main dashboard
│   │   ├── superadmin/
│   │   │   └── admin/
│   │   │       └── page.tsx     # SuperAdmin dashboard
│   │   └── users/
│   │       ├── admin/           # Admin dashboard
│   │       ├── staff/           # Staff dashboard
│   │       ├── partner/         # Partner dashboard
│   │       ├── agent/           # Agent dashboard
│   │       └── publicuser/      # User dashboard
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts     # NextAuth configuration
│   │   ├── users/
│   │   │   ├── roles/           # Role management
│   │   │   └── profile/         # User profile
│   │   └── admin/               # Admin operations
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── not-found.tsx
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── layout/                  # Layout components
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   ├── footer.tsx
│   │   └── breadcrumb.tsx
│   ├── forms/                   # Form components
│   │   ├── sign-in-form.tsx
│   │   ├── register-form.tsx
│   │   └── profile-form.tsx
│   ├── dashboard/               # Dashboard widgets
│   │   ├── stats-card.tsx
│   │   ├── activity-feed.tsx
│   │   ├── quick-actions.tsx
│   │   └── analytics-chart.tsx
│   └── providers/               # Context providers
│       ├── auth-provider.tsx
│       ├── theme-provider.tsx
│       └── role-provider.tsx
├── lib/
│   ├── firebase/               # Firebase configuration
│   │   ├── config.ts           # Firebase client config
│   │   ├── admin.ts            # Firebase Admin SDK
│   │   ├── firestore.ts        # Firestore utilities
│   │   └── auth.ts             # Auth utilities
│   ├── auth/                   # Authentication
│   │   ├── nextauth.ts         # NextAuth configuration
│   │   ├── providers.ts        # Auth providers
│   │   └── callbacks.ts        # NextAuth callbacks
│   ├── utils/                  # Utility functions
│   │   ├── cn.ts               # Class name utility
│   │   ├── validation.ts       # Zod schemas
│   │   ├── constants.ts        # App constants
│   │   └── helpers.ts          # Helper functions
│   └── hooks/                  # Custom React hooks
│       ├── useAuth.ts
│       ├── useRole.ts
│       └── useFirestore.ts
├── middleware.ts               # Route protection
├── tailwind.config.ts          # Tailwind configuration
├── next.config.js              # Next.js configuration
└── package.json
```

### Authentication Flow

```typescript
// NextAuth + Firebase Integration
interface AuthFlow {
  // 1. User attempts login/registration
  // 2. NextAuth validates credentials
  // 3. On successful auth:
  //    - Check if user exists in Firestore
  //    - If new user: create profile with default 'User' role
  //    - If special email: assign 'SuperAdmin' role + custom claims
  //    - Sync role to NextAuth session
  // 4. Redirect to role-specific dashboard
}
```

### Role Protection Middleware

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // 1. Get session from NextAuth
  // 2. Extract user role from session
  // 3. Check if requested route matches user role
  // 4. Redirect if unauthorized
  // 5. Allow access if authorized
}
```

### Firebase Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Only admins can modify roles
      allow update: if request.auth != null
        && request.auth.token.role in ['SuperAdmin', 'Admin']
        && request.writeFields.hasOnly(['role', 'permissions']);
    }

    // Role-based access to admin collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.role in ['SuperAdmin', 'Admin'];
    }
  }
}
```

---

## 🔐 Security Implementation

### Authentication Security

- **Password Requirements**: Minimum 8 characters, uppercase, lowercase, number, special character
- **Rate Limiting**: Implement login attempt limits
- **Session Management**: Secure JWT tokens with rotation
- **CSRF Protection**: NextAuth built-in CSRF protection
- **XSS Prevention**: Sanitize all user inputs

### Role-Based Security

- **Server-Side Role Verification**: All role checks happen on server
- **Firebase Admin SDK**: Only server can modify roles/permissions
- **Custom Claims**: Store roles in Firebase custom claims for security
- **API Route Protection**: Middleware checks on all protected routes

### Data Security

- **Input Validation**: Zod schemas for all forms
- **SQL Injection Prevention**: Firestore's NoSQL nature + validation
- **Data Encryption**: Firebase handles encryption at rest
- **Audit Logging**: Track all role changes and sensitive operations

---

## 📈 Scalability Features

### Performance Optimization

- **Next.js 14 App Router**: Server components for optimal performance
- **Static Generation**: Pre-generate public pages
- **Image Optimization**: Next.js built-in image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching Strategy**: Implement Redis for session caching (future)

### Database Optimization

- **Firestore Indexing**: Create composite indexes for complex queries
- **Data Pagination**: Implement cursor-based pagination
- **Real-time Updates**: Use Firestore real-time listeners judiciously
- **Data Validation**: Server-side validation for all operations

### Monitoring & Analytics

- **Error Tracking**: Implement Sentry for error monitoring
- **Performance Monitoring**: Web Vitals tracking
- **User Analytics**: Track user behavior and dashboard usage
- **System Health**: Monitor API response times and database performance

---

## 🚀 Deployment & DevOps

### Environment Configuration

```env
# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

### Deployment Checklist

- ✅ **Vercel Deployment**: Automated CI/CD pipeline
- ✅ **Environment Variables**: Secure secret management
- ✅ **Domain Configuration**: Custom domain with SSL
- ✅ **Firebase Setup**: Production Firestore database
- ✅ **OAuth Setup**: Production OAuth app configurations
- ✅ **Performance Testing**: Load testing for expected user base
- ✅ **Security Audit**: Penetration testing and vulnerability assessment

---

## 🎯 Success Metrics

### Technical KPIs

- **Page Load Speed**: < 3 seconds for all pages
- **Authentication Success Rate**: > 99.5%
- **Uptime**: 99.9% availability
- **Security**: Zero critical vulnerabilities

### User Experience KPIs

- **Registration Completion Rate**: > 85%
- **Login Success Rate**: > 98%
- **Dashboard Engagement**: > 80% daily active users
- **Mobile Responsiveness**: Perfect scores on all devices

---

## 🔧 Development Phases

### Phase 1: Foundation (Week 1-2)

- ✅ Project setup with Next.js 14 + Tailwind + shadcn/ui
- ✅ Firebase configuration (Auth + Firestore)
- ✅ NextAuth integration with social providers
- ✅ Basic UI components and design system

### Phase 2: Authentication (Week 2-3)

- ✅ Registration and login forms
- ✅ Social authentication (Google, Facebook)
- ✅ Role assignment logic and special email handling
- ✅ Middleware for route protection

### Phase 3: Dashboard System (Week 3-4)

- ✅ Role-based dashboard routing
- ✅ Sidebar navigation with role-specific menus
- ✅ Dashboard widgets and components
- ✅ User profile management

### Phase 4: Advanced Features (Week 4-5)

- ✅ Role management interface (Admin/SuperAdmin)
- ✅ Advanced security implementation
- ✅ Performance optimization
- ✅ Mobile responsiveness

### Phase 5: Testing & Deployment (Week 5-6)

- ✅ Comprehensive testing (unit, integration, e2e)
- ✅ Security testing and audit
- ✅ Performance optimization
- ✅ Production deployment on Vercel

---

This comprehensive prompt provides all the technical specifications, design requirements, security considerations, and scalability features needed to build a production-ready role-based dashboard system. The architecture is designed for enterprise-scale applications with robust security, optimal performance, and maintainable code structure.
