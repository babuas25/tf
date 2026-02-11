// Role definitions
export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  STAFF: 'Staff',
  PARTNER: 'Partner',
  AGENT: 'Agent',
  USER: 'User',
} as const

export type RoleType = (typeof ROLES)[keyof typeof ROLES]

// Sub-role definitions
export const SUB_ROLES = {
  STAFF: {
    ACCOUNTS: 'Accounts',
    SUPPORT: 'Support',
    KEY_MANAGER: 'Key Manager',
    RESEARCH: 'Research',
    MEDIA: 'Media',
    SALES: 'Sales',
  },
  PARTNER: {
    SUPPLIER: 'Supplier',
    SERVICE_PROVIDER: 'Service Provider',
  },
  AGENT: {
    DISTRIBUTOR: 'Distributor',
    FRANCHISE: 'Franchise',
    B2B: 'B2B',
  },
} as const

// Role hierarchy for access control
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 6,
  [ROLES.ADMIN]: 5,
  [ROLES.STAFF]: 4,
  [ROLES.PARTNER]: 3,
  [ROLES.AGENT]: 2,
  [ROLES.USER]: 1,
} as const

// Role assignment permissions
export const ROLE_ASSIGNMENT_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.STAFF,
    ROLES.PARTNER,
    ROLES.AGENT,
    ROLES.USER,
  ],
  [ROLES.ADMIN]: [ROLES.STAFF, ROLES.PARTNER, ROLES.AGENT, ROLES.USER],
  [ROLES.STAFF]: [],
  [ROLES.PARTNER]: [],
  [ROLES.AGENT]: [],
  [ROLES.USER]: [],
} as const

// Dashboard routes by role
export const DASHBOARD_ROUTES = {
  [ROLES.SUPER_ADMIN]: '/superadmin/admin',
  [ROLES.ADMIN]: '/users/admin',
  [ROLES.STAFF]: '/users/staff',
  [ROLES.PARTNER]: '/users/partner',
  [ROLES.AGENT]: '/users/agent',
  [ROLES.USER]: '/users/publicuser',
} as const

// Role-based categories
export const ROLE_CATEGORIES = {
  [ROLES.SUPER_ADMIN]: ['Admin'],
  [ROLES.ADMIN]: ['Admin'],
  [ROLES.STAFF]: ['Accounts', 'Support', 'Key Manager', 'Research', 'Media', 'Sales'],
  [ROLES.PARTNER]: ['Supplier', 'Service Provider'],
  [ROLES.AGENT]: ['Distributor', 'Franchise', 'B2B'],
  [ROLES.USER]: ['Default'],
} as const

export type CategoryType = string

// Get super admin emails from environment variables
export const getSuperAdminEmails = (): readonly string[] => {
  // Check both server-side and client-side environment variables
  const emails = process.env.SUPER_ADMIN_EMAILS || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS
  if (!emails) {
    // Only show warning in development environment
    if (process.env.NODE_ENV === 'development') {
      console.warn('SUPER_ADMIN_EMAILS environment variable not set. Using fallback emails.')
    }
    return ['babuas25@gmail.com', 'md.ashifbabu@gmail.com'] as const
  }
  return emails.split(',').map((email) => email.trim().toLowerCase()) as readonly string[]
}

// For backward compatibility - use lazy getter to avoid early execution
let _superAdminEmails: readonly string[] | undefined
export const SUPER_ADMIN_EMAILS = () => {
  if (!_superAdminEmails) {
    _superAdminEmails = getSuperAdminEmails()
  }
  return _superAdminEmails
}

// Navigation menu items by role
export const NAVIGATION_ITEMS = {
  [ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard', href: '/superadmin/admin', icon: 'Home' },
    { label: 'My Booking', href: '/superadmin/bookings', icon: 'Briefcase' },
    { label: 'User Management', href: '/superadmin/admin/user-management', icon: 'Users' },
    { label: 'Travellers', href: '/superadmin/travellers', icon: 'UserCheck' },
    { label: 'Appearance', href: '/superadmin/theme', icon: 'Palette' },
    { label: 'Footer', href: '/superadmin/footer', icon: 'FileText' },
  ],
  [ROLES.ADMIN]: [
    { label: 'Dashboard', href: '/users/admin', icon: 'Home' },
    { label: 'My Booking', href: '/users/admin/bookings', icon: 'Briefcase' },
    { label: 'User Management', href: '/users/admin/user-management', icon: 'Users' },
    { label: 'Travellers', href: '/users/admin/travellers', icon: 'UserCheck' },
  ],
  [ROLES.STAFF]: [
    { label: 'Dashboard', href: '/users/staff', icon: 'Home' },
    { label: 'My Booking', href: '/users/staff/bookings', icon: 'Briefcase' },
    { label: 'Travellers', href: '/users/staff/travellers', icon: 'UserCheck' },
  ],
  [ROLES.PARTNER]: [
    { label: 'Dashboard', href: '/users/partner', icon: 'Home' },
    { label: 'My Booking', href: '/users/partner/bookings', icon: 'Briefcase' },
    { label: 'Travellers', href: '/users/partner/travellers', icon: 'UserCheck' },
  ],
  [ROLES.AGENT]: [
    { label: 'Dashboard', href: '/users/agent', icon: 'Home' },
    { label: 'My Booking', href: '/users/agent/bookings', icon: 'Briefcase' },
    { label: 'Travellers', href: '/users/agent/travellers', icon: 'UserCheck' },
  ],
  [ROLES.USER]: [
    { label: 'Dashboard', href: '/users/publicuser', icon: 'Home' },
    { label: 'My Booking', href: '/users/publicuser/bookings', icon: 'Briefcase' },
    { label: 'Travellers', href: '/users/publicuser/travellers', icon: 'UserCheck' },
  ],
} as const
