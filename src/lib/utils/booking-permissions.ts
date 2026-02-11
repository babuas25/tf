import type { RoleType } from './constants'

export interface BookingPermissions {
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canViewAll: boolean // Can see all bookings regardless of creator
  canViewOwn: boolean // Can only see bookings they created
}

export interface BookingUser {
  id: string
  email: string
  role: RoleType
}

export interface BookingRecord {
  referenceNo: string
  createdBy: string
  createdByEmail?: string
  [key: string]: unknown
}

/**
 * Get booking permissions based on user role
 */
export function getBookingPermissions(userRole: RoleType): BookingPermissions {
  switch (userRole) {
    case 'SuperAdmin':
      return {
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canViewAll: true,
        canViewOwn: true,
      }

    case 'Admin':
      return {
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canViewAll: true,
        canViewOwn: true,
      }

    case 'Staff':
      return {
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: false, // Staff cannot delete bookings
        canViewAll: true,
        canViewOwn: true,
      }

    case 'Partner':
      return {
        canView: true,
        canCreate: true,
        canUpdate: false,
        canDelete: false,
        canViewAll: false,
        canViewOwn: true, // Partners can only see their own bookings
      }

    case 'Agent':
      return {
        canView: true,
        canCreate: true,
        canUpdate: false,
        canDelete: false,
        canViewAll: false,
        canViewOwn: true, // Agents can only see their own bookings
      }

    case 'User':
      return {
        canView: true,
        canCreate: true, // Users can create bookings (e.g., from flight booking flow)
        canUpdate: false,
        canDelete: false,
        canViewAll: false,
        canViewOwn: true, // Users can only see bookings they created
      }

    default:
      return {
        canView: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canViewAll: false,
        canViewOwn: false,
      }
  }
}

/**
 * Check if user can view a specific booking
 */
export function canViewBooking(
  user: BookingUser,
  booking: BookingRecord,
  permissions?: BookingPermissions,
): boolean {
  const perms = permissions || getBookingPermissions(user.role)

  if (!perms.canView) {
    return false
  }

  if (perms.canViewAll) {
    return true
  }

  if (perms.canViewOwn) {
    // Check if user created this booking
    return (
      booking.createdBy === user.id ||
      booking.createdBy === user.email ||
      booking.createdByEmail === user.email
    )
  }

  return false
}

/**
 * Check if user can update a specific booking
 */
export function canUpdateBooking(
  user: BookingUser,
  booking: BookingRecord,
  permissions?: BookingPermissions,
): boolean {
  const perms = permissions || getBookingPermissions(user.role)

  if (!perms.canUpdate) {
    return false
  }

  // SuperAdmin and Admin can update any booking
  if (user.role === 'SuperAdmin' || user.role === 'Admin') {
    return true
  }

  // Staff can update any booking they can view
  if (user.role === 'Staff') {
    return canViewBooking(user, booking, perms)
  }

  // Other roles cannot update bookings
  return false
}

/**
 * Check if user can delete a specific booking
 */
export function canDeleteBooking(
  user: BookingUser,
  _booking: BookingRecord,
  permissions?: BookingPermissions,
): boolean {
  const perms = permissions || getBookingPermissions(user.role)

  if (!perms.canDelete) {
    return false
  }

  // Only SuperAdmin and Admin can delete bookings
  return user.role === 'SuperAdmin' || user.role === 'Admin'
}

/**
 * Filter bookings based on user permissions
 */
export function filterBookingsByPermissions(
  user: BookingUser,
  bookings: BookingRecord[],
  permissions?: BookingPermissions,
): BookingRecord[] {
  const perms = permissions || getBookingPermissions(user.role)

  if (!perms.canView) {
    return []
  }

  if (perms.canViewAll) {
    return bookings
  }

  if (perms.canViewOwn) {
    return bookings.filter((booking) => canViewBooking(user, booking, perms))
  }

  return []
}

/**
 * Get role display name for booking history
 */
export function getRoleDisplayName(role: RoleType): string {
  switch (role) {
    case 'SuperAdmin':
      return 'Super Admin'
    case 'Admin':
      return 'Admin'
    case 'Staff':
      return 'Staff (Support)'
    case 'Partner':
      return 'Partner'
    case 'Agent':
      return 'Agent'
    case 'User':
      return 'User'
    default:
      return 'Unknown'
  }
}

/**
 * Check if user has sufficient role level for an operation
 */
export function hasRoleLevel(userRole: RoleType, requiredRole: RoleType): boolean {
  const roleLevels: Record<RoleType, number> = {
    SuperAdmin: 6,
    Admin: 5,
    Staff: 4,
    Partner: 3,
    Agent: 2,
    User: 1,
  }

  return roleLevels[userRole] >= roleLevels[requiredRole]
}

/**
 * Get booking actions available to user
 */
export function getAvailableBookingActions(
  user: BookingUser,
  booking: BookingRecord,
): {
  canView: boolean
  canUpdate: boolean
  canDelete: boolean
  canRefresh: boolean
  canPrint: boolean
} {
  const permissions = getBookingPermissions(user.role)

  return {
    canView: canViewBooking(user, booking, permissions),
    canUpdate: canUpdateBooking(user, booking, permissions),
    canDelete: canDeleteBooking(user, booking, permissions),
    canRefresh: canViewBooking(user, booking, permissions), // Can refresh if can view
    canPrint: canViewBooking(user, booking, permissions), // Can print if can view
  }
}

/**
 * Validate booking operation permission
 */
export function validateBookingOperation(
  user: BookingUser,
  booking: BookingRecord,
  operation: 'view' | 'create' | 'update' | 'delete',
): { allowed: boolean; reason?: string } {
  const permissions = getBookingPermissions(user.role)

  switch (operation) {
    case 'view':
      if (!canViewBooking(user, booking, permissions)) {
        return {
          allowed: false,
          reason: 'You do not have permission to view this booking',
        }
      }
      break

    case 'create':
      if (!permissions.canCreate) {
        return {
          allowed: false,
          reason: 'You do not have permission to create bookings',
        }
      }
      break

    case 'update':
      if (!canUpdateBooking(user, booking, permissions)) {
        return {
          allowed: false,
          reason: 'You do not have permission to update this booking',
        }
      }
      break

    case 'delete':
      if (!canDeleteBooking(user, booking, permissions)) {
        return {
          allowed: false,
          reason: 'You do not have permission to delete this booking',
        }
      }
      break

    default:
      return {
        allowed: false,
        reason: 'Invalid operation',
      }
  }

  return { allowed: true }
}
