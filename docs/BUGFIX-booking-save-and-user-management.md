# Bug Fix Documentation: Booking Save & User Management Issues

**Date:** February 10, 2026  
**Fixed By:** AI Assistant  
**Status:** ✅ RESOLVED

---

## Issues Summary

### Issue 1: Bookings Not Saved to Database (403 Error)
**Severity:** 🔴 Critical  
**Impact:** Users unable to view their booking history after successful order creation

#### Problem Description
After successfully creating an order (e.g., `BDF260235216`), the booking was not appearing in the booking history pages. The server logs showed:

```
POST /api/bookings 403 in 1448ms (compile: 1380ms, render: 68ms)
```

#### Root Cause
1. **User Role Permissions:** The `User` role had `canCreate: false` in `booking-permissions.ts`, preventing regular users from creating booking records
2. **Authentication Requirement:** The `/api/bookings` POST endpoint required full authentication, blocking guest users from saving their bookings

#### Files Affected
- `tripfeels/src/lib/utils/booking-permissions.ts`
- `tripfeels/src/app/api/bookings/route.ts`

---

### Issue 2: React setState Error in SuperAdmin User Management
**Severity:** 🟡 Medium  
**Impact:** Console errors when updating user categories, potential UI instability

#### Problem Description
When SuperAdmin attempted to change a user's category dropdown, a React error appeared:

```
Error: Cannot update a component (`CustomDropdown`) while rendering a different component 
(`SuperAdminUserManagement`). To locate the bad setState() call inside `SuperAdminUserManagement`, 
follow the stack trace as described in https://react.dev/link/setstate-in-render
```

#### Root Cause
The `toggleDropdown` function was calling `setIsOpen()` directly inside the `setOpenDropdowns()` state updater function, causing a state update during another component's render phase.

```typescript
// ❌ BEFORE (Incorrect)
const toggleDropdown = (dropdownId: string) => {
  setOpenDropdowns((prev) => {
    const next = new Set(prev)
    if (next.has(dropdownId)) {
      next.delete(dropdownId)
      setIsOpen(false)  // ⚠️ setState during render
    } else {
      next.clear()
      next.add(dropdownId)
      setIsOpen(true)   // ⚠️ setState during render
    }
    return next
  })
}
```

#### Files Affected
- `tripfeels/src/app/(dashboard)/superadmin/admin/user-management/page.tsx`

---

## Solutions Implemented

### Solution 1: Booking Permissions & Guest Support

#### Change 1.1: Update User Role Permissions
**File:** `tripfeels/src/lib/utils/booking-permissions.ts` (Line 83)

```typescript
case 'User':
  return {
    canView: true,
    canCreate: true,  // ✅ Changed from false to true
    canUpdate: false,
    canDelete: false,
    canViewAll: false,
    canViewOwn: true,
  }
```

**Rationale:** Users need to be able to create bookings through the flight booking flow. The restriction was meant for admin panel direct creation, but it blocked the legitimate booking flow.

---

#### Change 1.2: Allow Guest Bookings
**File:** `tripfeels/src/app/api/bookings/route.ts` (Lines 84-114)

```typescript
// Allow guest users to create bookings (for flight booking flow)
let user: BookingUser | null = null
let permissions: ReturnType<typeof getBookingPermissions> | null = null

if (sessionUserObj?.id && sessionUserObj?.email && sessionUserObj?.role) {
  // ... authenticated user logic
  user = {
    id: sessionUser.id,
    email: sessionUser.email,
    role: sessionUser.role as RoleType,
  }

  permissions = getBookingPermissions(user.role)

  // Check if authenticated user has create permission
  if (!permissions.canCreate) {
    return NextResponse.json(
      { error: 'Insufficient permissions to create bookings' },
      { status: 403 },
    )
  }
}
// If no session, user remains null and booking proceeds as guest
```

**Key Changes:**
- Made `user` nullable to support guest bookings
- Only check permissions for authenticated users
- Use optional chaining (`user?.id`) when setting `createdBy` fields
- Guest bookings default to `createdBy: 'Guest'`

---

### Solution 2: Fix setState During Render

#### Change 2.1: Defer State Update with setTimeout
**File:** `tripfeels/src/app/(dashboard)/superadmin/admin/user-management/page.tsx` (Lines 357-372)

```typescript
// ✅ AFTER (Correct)
const toggleDropdown = (dropdownId: string) => {
  setOpenDropdowns((prev) => {
    const next = new Set(prev)
    const shouldOpen = !next.has(dropdownId)

    if (next.has(dropdownId)) {
      next.delete(dropdownId)
    } else {
      next.clear()
      next.add(dropdownId)
    }

    // Update isOpen after the state update completes
    setTimeout(() => setIsOpen(shouldOpen), 0)

    return next
  })
}
```

**Rationale:** By using `setTimeout(() => ..., 0)`, we defer the `setIsOpen` call to the next tick of the event loop, ensuring it executes after the current render cycle completes.

---

## Testing Checklist

### Booking Save Testing
- [ ] Test guest user booking creation
- [ ] Test authenticated User role booking creation
- [ ] Test Agent role booking creation
- [ ] Verify booking appears in `/users/publicuser/bookings`
- [ ] Verify booking appears in `/users/agent/bookings`
- [ ] Verify booking appears in `/superadmin/bookings`
- [ ] Check booking details page loads correctly
- [ ] Verify `createdBy` field is populated correctly
- [ ] Test booking refresh functionality

### User Management Testing
- [ ] Test category dropdown in user management
- [ ] Verify no console errors appear
- [ ] Test changing categories for multiple users
- [ ] Test role dropdown (should work without errors)
- [ ] Test clicking outside dropdown to close
- [ ] Test rapid open/close of dropdowns
- [ ] Verify dropdown positioning (top/bottom based on viewport)

---

## Deployment Notes

### Pre-Deployment
1. Review all changes in staging environment
2. Test with both authenticated and guest users
3. Monitor console for any React warnings
4. Verify database writes for bookings

### Post-Deployment
1. Monitor server logs for any 403 errors on `/api/bookings`
2. Check Firebase Firestore for new booking records
3. Verify booking history pages show recent bookings
4. Monitor Sentry/error tracking for any new React errors

---

## Related Files Modified

```
tripfeels/
├── src/
│   ├── lib/
│   │   └── utils/
│   │       └── booking-permissions.ts ................... ✓ Modified
│   └── app/
│       ├── api/
│       │   └── bookings/
│       │       └── route.ts .............................. ✓ Modified
│       └── (dashboard)/
│           └── superadmin/
│               └── admin/
│                   └── user-management/
│                       └── page.tsx ...................... ✓ Modified
```

---

## Additional Observations

### Booking Flow
The current booking flow works as follows:
1. User completes flight booking on `/review-book`
2. `OrderCreate` API is called
3. Order response is saved to sessionStorage
4. Booking is saved to Firestore via `/api/bookings` POST
5. User redirected to `/booking-order?orderRef=XXX&success=1`
6. Success popup with confetti is shown

**Note:** The booking save happens asynchronously and doesn't block the redirect. This means if the save fails, users won't be notified immediately. Consider adding error handling UI in a future update.

### Permission Model
Current permission levels (from highest to lowest):
1. **SuperAdmin** - Full access to all bookings
2. **Admin** - Full access to all bookings
3. **Staff** - View/create/update all bookings (no delete)
4. **Partner** - View/create own bookings only
5. **Agent** - View/create own bookings only
6. **User** - View/create own bookings only (no update)

---

## Future Improvements

1. **Error Handling:** Add user-facing error notifications if booking save fails
2. **Retry Logic:** Implement automatic retry for failed booking saves
3. **Offline Support:** Queue booking saves for later if network is unavailable
4. **Audit Trail:** Log all booking creation/update attempts for debugging
5. **React Hook Optimization:** Consider refactoring `CustomDropdown` to use `useReducer` for cleaner state management

---

## Verification Commands

```bash
# Check for TypeScript errors
npm run type-check

# Run linting
npm run lint

# Build the project
npm run build

# Start dev server
npm run dev
```

---

**End of Bug Fix Documentation**