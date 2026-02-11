# TripFeels Project Structure

## 📁 Complete Project Map

```
tripfeels/
├── .env.example
├── .env.local
├── .gitattributes
├── .gitignore
├── .prettierignore
├── .prettierrc
├── APIDocumentation.md.txt
├── Request-Response/
│   ├── multicity-request.json
│   ├── multicity-response.json
│   ├── multicity-with-nonstop-response.json
│   ├── multicity-with-stop-response.json
│   ├── oneway-request.json
│   ├── oneway-with-nonstop.json
│   ├── oneway-with-stop.json
│   ├── paired-oneqay-request.json
│   ├── paired-oneway-response.json
│   ├── return-request.json
│   ├── return-response.json
│   ├── return-with-nonstop-response.json
│   └── return-with-stop-response.json
├── docs/
│   ├── AIRPORT_CITY_GROUPING.md
│   ├── ALIGNMENT_FIX_SUMMARY.md
│   ├── AUTH_IMAGE_DIMENSIONS_GUIDE.md
│   ├── COMPLETE_TIMESTAMP_FIX.md
│   ├── DATABASE_ISSUE_FIXED.md
│   ├── DEBUG_TIMESTAMP_ISSUE.md
│   ├── DESIGN_SYSTEM_IMPROVEMENTS.md
│   ├── DROPDOWN_OPACITY_FIX.md
│   ├── EDIT_DELETE_FUNCTIONALITY_COMPLETE.md
│   ├── ENVIRONMENT_SETUP.md
│   ├── FIXED_IMAGE_SIZE_SUMMARY.md
│   ├── FONT_CHANGE_SUMMARY.md
│   ├── LOGIN_TIMESTAMP_FIX.md
│   ├── MOBILE_RESPONSIVE_FIX.md
│   ├── MODAL_POSITIONING_FIX.md
│   ├── NEON_DATABASE_SETUP_GUIDE.md
│   ├── NEON_SETUP_SUCCESS.md
│   ├── OVERFLOW_FIX_SUMMARY.md
│   ├── RATE_LIMITING_GUIDE.md
│   ├── reliability-hardening.md
│   ├── scalability-improvements.md
│   ├── SENTRY_INTEGRATION_GUIDE.md
│   ├── SLATE_THEME_DEFAULT_SUMMARY.md
│   ├── THEME_PERSISTENCE_FIX.md
│   ├── TIMESTAMP_FIX_SUMMARY.md
│   ├── TRAVELLER_DATE_VALIDATION_FIX.md
│   ├── TRAVELLERS_MODULE_FIXES.md
│   ├── TRAVELLERS_MODULE_SUMMARY.md
│   └── VERCEL_ANALYTICS_INTEGRATION.md
├── drizzle/
│   ├── 0000_little_weapon_omega.sql
│   └── meta/
│       ├── _journal.json
│       └── 0000_snapshot.json
├── drizzle.config.ts
├── env.template
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.js
├── production.rules
├── projectmap.md
├── roadmap.md
├── tailwind.config.ts
├── tsconfig.json
├── .github/
│   └── workflows/
│       └── ci.yml
├── .husky/
│   └── pre-commit
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml
│   └── fonts/
│       ├── GoogleSans-Bold.ttf
│       ├── GoogleSans-BoldItalic.ttf
│       ├── GoogleSans-Italic.ttf
│       ├── GoogleSans-Medium.ttf
│       ├── GoogleSans-MediumItalic.ttf
│       ├── GoogleSans-Regular.ttf
│       └── README.md
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── auth/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx
    │   ├── (dashboard)/
    │   │   ├── layout.tsx
    │   │   ├── superadmin/
    │   │   │   ├── admin/
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── user-management/
    │   │   │   │       └── page.tsx
    │   │   │   ├── footer/
    │   │   │   │   └── page.tsx
    │   │   │   ├── theme/
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── SlideshowManager.tsx
    │   │   │   └── travellers/
    │   │   │       └── page.tsx
    │   │   ├── theme-demo/
    │   │   │   └── page.tsx
    │   │   └── users/
    │   │       ├── admin/
    │   │       │   ├── page.tsx
    │   │       │   ├── travellers/
    │   │       │   │   └── page.tsx
    │   │       │   └── user-management/
    │   │       │       └── page.tsx
    │   │       ├── agent/
    │   │       │   ├── page.tsx
    │   │       │   └── travellers/
    │   │       │       └── page.tsx
    │   │       ├── partner/
    │   │       │   ├── page.tsx
    │   │       │   └── travellers/
    │   │       │       └── page.tsx
    │   │       ├── publicuser/
    │   │       │   ├── page.tsx
    │   │       │   └── travellers/
    │   │       │       └── page.tsx
    │   │       └── staff/
    │   │           ├── page.tsx
    │   │           └── travellers/
    │   │               └── page.tsx
    │   ├── api/
    │   │   ├── admin/
    │   │   │   └── users/
    │   │   │       ├── [uid]/
    │   │   │       │   └── route.ts
    │   │   │       └── route.ts
    │   │   ├── auth/
    │   │   │   └── [...nextauth]/
    │   │   │       └── route.ts
    │   │   ├── dashboard/
    │   │   │   └── stats/
    │   │   │       └── route.ts
    │   │   ├── debug/
    │   │   │   ├── timestamp/
    │   │   │   │   └── route.ts
    │   │   │   ├── user-data/
    │   │   │   │   └── route.ts
    │   │   │   └── users/
    │   │   │       └── route.ts
    │   │   ├── fix-ashif-role/
    │   │   │   └── route.ts
    │   │   ├── fix-user-roles/
    │   │   │   └── route.ts
    │   │   ├── rate-limit/
    │   │   │   ├── stats/
    │   │   │   │   └── route.ts
    │   │   │   └── status/
    │   │   │       └── route.ts
    │   │   ├── seo/
    │   │   │   └── route.ts
    │   │   ├── superadmin/
    │   │   │   ├── footer/
    │   │   │   │   └── route.ts
    │   │   │   └── slides/
    │   │   │       ├── [id]/
    │   │   │       │   └── route.ts
    │   │   │       └── route.ts
    │   │   ├── sync-users/
    │   │   │   └── route.ts
    │   │   ├── test-user-creation/
    │   │   │   └── route.ts
    │   │   ├── theme/
    │   │   │   └── route.ts
    │   │   └── travellers/
    │   │       ├── [id]/
    │   │       │   └── route.ts
    │   │       └── route.ts
    │   ├── cookies/
    │   │   └── page.tsx
    │   ├── results/
    │   │   ├── flight-search-client.tsx
    │   │   └── page.tsx
    │   ├── privacy/
    │   │   └── page.tsx
    │   ├── terms/
    │   │   └── page.tsx
    │   ├── globals.css
    │   ├── home-page-client.tsx
    │   ├── layout.tsx
    │   ├── not-found.tsx
    │   └── page.tsx
    ├── components/
    │   ├── auth/
    │   │   └── AuthSlideshow.tsx
    │   ├── dashboard/
    │   │   ├── dashboard-home.tsx
    │   │   └── stats-card.tsx
    │   ├── error/
    │   │   └── ErrorBoundary.tsx
    │   ├── examples/
    │   │   ├── design-system-examples.tsx
    │   │   └── dynamic-theme-examples.tsx
    │   ├── flight/
    │   │   ├── airport-selection/
    │   │   │   ├── airports.json
    │   │   │   ├── AirportSelection.tsx
    │   │   │   └── city-airport-mapping.ts
    │   │   ├── flight-date-picker/
    │   │   │   ├── FlightDatePicker.tsx
    │   │   │   └── index.ts
    │   │   ├── modify-search/
    │   │   │   ├── ExpandableSearchForm.tsx
    │   │   │   ├── index.ts
    │   │   │   ├── ModifySearchButton.tsx
    │   │   │   └── ModifySearchModal.tsx
    │   │   ├── traveler-selection/
    │   │   │   ├── index.ts
    │   │   │   └── TravelerSelection.tsx
    │   │   ├── FlightSearchInterface.tsx
    │   │   └── MulticityFlightSearch.tsx
    │   ├── layout/
    │   │   ├── footer.tsx
    │   │   ├── header.tsx
    │   │   ├── navbar.tsx
    │   │   └── sidebar.tsx
    │   ├── providers/
    │   │   ├── error-monitoring-provider.tsx
    │   │   ├── session-provider.tsx
    │   │   └── theme-provider.tsx
    │   ├── tab/
    │   │   └── TabBar.tsx
    │   ├── travellers/
    │   │   ├── TravellerForm.tsx
    │   │   └── TravellersList.tsx
    │   ├── ui/
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── custom-dropdown.tsx
    │   │   ├── dynamic-theme-components.tsx
    │   │   ├── form.tsx
    │   │   ├── glass-button.tsx
    │   │   ├── glass-card.tsx
    │   │   ├── glass-components.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── simple-dropdown.tsx
    │   │   ├── skeleton-loading.tsx
    │   │   ├── splash-screen.tsx
    │   │   └── tabs.tsx
    │   ├── glass-card.tsx
    │   ├── theme-provider.tsx
    │   └── theme-selector.tsx
    ├── context/
    │   └── theme-context.tsx
    ├── hooks/
    │   └── useErrorHandler.ts
    ├── lib/
    │   ├── auth/
    │   │   └── nextauth.ts
    │   ├── db/
    │   │   ├── index.ts
    │   │   ├── schema.ts
    │   │   └── travellers.ts
    │   ├── firebase/
    │   │   ├── admin.ts
    │   │   ├── config.ts
    │   │   ├── firestore.ts
    │   │   ├── footer.ts
    │   │   ├── slides.ts
    │   │   └── theme.ts
    │   ├── http/
    │   │   └── validator.ts
    │   ├── middleware/
    │   │   └── rate-limit-middleware.ts
    │   ├── utils/
    │   │   ├── constants.ts
    │   │   └── validation.ts
    │   ├── airport-history.ts
    │   ├── cache.ts
    │   ├── color-scheme-guide.md
    │   ├── design-system-guide.md
    │   ├── design-tokens.ts
    │   ├── dynamic-theme-colors.ts
    │   ├── env.client.ts
    │   ├── env.server.ts
    │   ├── env.ts
    │   ├── error-monitoring.ts
    │   ├── pagination.ts
    │   ├── rate-limiting.ts
    │   ├── themeColors.ts
    │   ├── ui-utils.ts
    │   └── utils.ts
    ├── types/
    │   └── next-auth.d.ts
    └── middleware.ts

## 🏗️ Architecture Overview

### **Frontend Architecture**

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + NextAuth sessions
- **Type Safety**: Full TypeScript implementation
- **Theme System**: Dynamic theme with glass morphism design

### **Backend Architecture**

- **Authentication**: NextAuth.js with multiple providers
- **Database**: Firebase Firestore (NoSQL)
- **API**: Next.js API routes with server-side validation
- **Security**: Role-based access control (RBAC)
- **Real-time**: Firebase real-time listeners

### **Security Implementation**

- **Authentication**: Google, Facebook, Email/Password
- **Authorization**: 6-tier role hierarchy (SuperAdmin → User)
- **Route Protection**: Middleware-based access control
- **Data Validation**: Zod schemas for all inputs
- **Security Headers**: CSP, XSS protection, CSRF prevention

## 🔐 Role-Based Access Control (RBAC)

### **Role Hierarchy**

1. **SuperAdmin** - Full system access
2. **Admin** - User management and system settings
3. **Staff** - Internal operations (6 sub-roles)
4. **Partner** - External partnerships (2 sub-roles)
5. **Agent** - Sales and distribution (3 sub-roles)
6. **User** - Basic user access

### **Dashboard Routes**

- SuperAdmin: `/superadmin/admin`
- Admin: `/users/admin`
- Staff: `/users/staff`
- Partner: `/users/partner`
- Agent: `/users/agent`
- User: `/users/publicuser`

## 🎨 Design System

### **Theme Architecture**

- **Base Theme**: Light/Dark mode support
- **Custom Colors**: Primary, secondary, accent color schemes
- **Glass Morphism**: Modern glass-effect components
- **Typography**: Geist Sans + Poppins + Google Sans
- **Responsive**: Mobile-first design approach

### **Component Library**

- **shadcn/ui**: Base component system
- **Custom Components**: Glass morphism variants
- **Form Components**: React Hook Form + Zod validation
- **Layout Components**: Header, sidebar, navigation

## 📊 Key Features

### **Authentication System**

- Multi-provider authentication (Google, Facebook, Email)
- Automatic role assignment for special emails
- Session management with JWT tokens
- Secure password requirements

### **User Management**

- Role-based user creation and management
- Profile management with validation
- User statistics and analytics
- Bulk user operations

### **Theme Management**

- Dynamic theme switching
- Slideshow management for auth pages
- Custom color schemes
- Responsive design system

### **API Endpoints**

- User CRUD operations
- Role management
- Dashboard statistics
- Debug and utility endpoints
- Slideshow management

## 🚀 Performance & SEO

### **SEO Optimization**

- Comprehensive meta tags
- Structured data (JSON-LD)
- Sitemap and robots.txt
- Open Graph and Twitter cards
- Performance optimizations

### **Performance Features**

- Next.js 15 optimizations
- Image optimization
- Code splitting
- Font optimization
- CSS purging

## 🔧 Development Tools

### **Configuration Files**

- `next.config.js` - Next.js configuration with security headers
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `postcss.config.js` - PostCSS configuration

### **Security Rules**

- `production.rules` - Firebase Firestore security rules
- Comprehensive access control
- Data validation rules
- Audit logging

## 📈 Scalability Features

### **Database Design**

- NoSQL Firestore structure
- Optimized queries with indexes
- Real-time data synchronization
- Scalable user management

### **Code Organization**

- Modular component architecture
- Reusable utility functions
- Type-safe implementations
- Clean separation of concerns

## 🎯 Project Status

**Current Version**: 0.1.0  
**Framework**: Next.js 14.5.3  
**TypeScript**: Full implementation  
**Testing**: Not implemented (recommended)  
**Deployment**: Production-ready

---

_This project structure represents a modern, scalable, and secure role-based dashboard application built with enterprise-grade practices._
