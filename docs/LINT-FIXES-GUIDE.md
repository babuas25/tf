# ESLint Fixes Guide

This document outlines all the lint errors and warnings found in the project and how to fix them.

## Summary of Issues

- **Total Issues:** 161
  - **Errors:** 9
  - **Warnings:** 152
- **Auto-fixable:** 7 errors and 0 warnings

## Critical Errors to Fix

### 1. Import Order Issues (7 errors)

#### File: `src/app/(auth)/auth/page.tsx` (Line 27)
**Error:** Empty line within import group
```typescript
// ❌ BEFORE
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { authWithRetry, handleFirebaseError, connectionMonitor } from '@/lib/firebase/connection'

// ✅ AFTER
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { authWithRetry, handleFirebaseError, connectionMonitor } from '@/lib/firebase/connection'
```

#### File: `src/components/debug/FirebaseStatus.tsx` (Lines 4, 7)
**Error:** Incorrect import order
```typescript
// ❌ BEFORE
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

import { firebaseDebugger, type FirebaseDebugInfo } from '@/lib/firebase/debug'
import { connectionMonitor } from '@/lib/firebase/connection'

// ✅ AFTER
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

import { connectionMonitor } from '@/lib/firebase/connection'
import { firebaseDebugger, type FirebaseDebugInfo } from '@/lib/firebase/debug'
```

#### File: `src/components/debug/SuperAdminFixer.tsx` (Line 4)
**Error:** Incorrect import order
```typescript
// ❌ BEFORE
import { useState } from 'react'
import { Settings, Shield, RefreshCw, Users, AlertCircle } from 'lucide-react'

// ✅ AFTER
import { Settings, Shield, RefreshCw, Users, AlertCircle } from 'lucide-react'
import { useState } from 'react'
```

#### File: `src/lib/firebase/test.ts` (Lines 7, 10)
**Error:** Unused imports
```typescript
// ❌ BEFORE
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { authWithRetry, firestoreWithRetry, handleFirebaseError } from './connection'

// ✅ AFTER
import { doc, deleteDoc } from 'firebase/firestore'
import { firestoreWithRetry, handleFirebaseError } from './connection'
```

### 2. TypeScript Comment Issues (1 error)

#### File: `src/lib/firebase/debug.ts` (Line 112)
**Error:** Use `@ts-expect-error` instead of `@ts-ignore`
```typescript
// ❌ BEFORE
// @ts-ignore
const connectionType = navigator.connection?.effectiveType || 'unknown'

// ✅ AFTER
// @ts-expect-error - Navigator.connection is not in TypeScript types
const connectionType = navigator.connection?.effectiveType || 'unknown'
```

## High Priority Warnings

### 1. React Hooks Rules Violations

#### File: `src/components/debug/FirebaseStatus.tsx` (Line 24)
**Warning:** React Hook called conditionally
```typescript
// ❌ BEFORE
export default function FirebaseStatus({ showInProduction = false }: FirebaseStatusProps) {
  const [debugInfo, setDebugInfo] = useState<FirebaseDebugInfo | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const { data: session } = useSession()

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null
  }

// ✅ AFTER
export default function FirebaseStatus({ showInProduction = false }: FirebaseStatusProps) {
  // Don't show in production unless explicitly enabled
  const shouldShow = process.env.NODE_ENV !== 'production' || showInProduction

  const [debugInfo, setDebugInfo] = useState<FirebaseDebugInfo | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const { data: session } = useSession()

  if (!shouldShow) {
    return null
  }
```

### 2. Floating Promises

#### File: `src/app/layout.tsx` (Line 19)
```typescript
// ❌ BEFORE
loadIntercom()

// ✅ AFTER
void loadIntercom()
```

#### File: `src/components/debug/FirebaseStatus.tsx` (Lines 37, 47)
```typescript
// ❌ BEFORE
updateDebugInfo()
intervalId = setInterval(updateDebugInfo, 5000)

// ✅ AFTER
void updateDebugInfo()
intervalId = setInterval(() => {
  void updateDebugInfo()
}, 5000)
```

#### File: `src/lib/firebase/connection.ts` (Lines 53, 71)
```typescript
// ❌ BEFORE
auth.authStateReady().then(() => {
  authReadyPromise.resolve()
})

// ✅ AFTER
void auth.authStateReady().then(() => {
  authReadyPromise.resolve()
})
```

#### File: `src/lib/firebase/debug.ts` (Line 284)
```typescript
// ❌ BEFORE
connectionMonitor.checkConnection()

// ✅ AFTER
void connectionMonitor.checkConnection()
```

### 3. Misused Promises (onClick handlers)

#### File: `src/components/debug/FirebaseStatus.tsx` (Lines 41, 178)
```typescript
// ❌ BEFORE
<button onClick={() => firebaseDebugger.diagnose()}>

// ✅ AFTER
<button onClick={() => { void firebaseDebugger.diagnose() }}>
```

#### File: `src/components/debug/SuperAdminFixer.tsx` (Lines 168, 177, 187, 205, 371)
```typescript
// ❌ BEFORE
<button onClick={fetchUsers}>
<button onClick={fixAllSuperAdmins}>

// ✅ AFTER
<button onClick={() => { void fetchUsers() }}>
<button onClick={() => { void fixAllSuperAdmins() }}>
```

### 4. Unused Variables

#### File: `src/components/debug/SuperAdminFixer.tsx` (Lines 52, 72, 98, 115)
```typescript
// ❌ BEFORE
} catch (error) {
  setResult({ success: false, message: 'Failed to fetch users' })
}

// ✅ AFTER
} catch (_error) {
  setResult({ success: false, message: 'Failed to fetch users' })
}
```

### 5. Explicit `any` Types

#### File: `src/lib/firebase/test.ts` (Line 17)
```typescript
// ❌ BEFORE
details?: any

// ✅ AFTER
details?: unknown
```

#### File: `src/lib/firebase/test.ts` (Lines 302-303)
```typescript
// ❌ BEFORE
;(window as any).runFirebaseTests = runFirebaseTests
;(window as any).quickFirebaseTest = quickFirebaseTest

// ✅ AFTER
;(window as { runFirebaseTests?: typeof runFirebaseTests }).runFirebaseTests = runFirebaseTests
;(window as { quickFirebaseTest?: typeof quickFirebaseTest }).quickFirebaseTest = quickFirebaseTest
```

#### File: `src/components/debug/FirebaseStatus.tsx` (Line 136)
```typescript
// ❌ BEFORE
<div>Role: {(session?.user as any)?.role || 'N/A'}</div>

// ✅ AFTER
<div>Role: {(session?.user as { role?: string })?.role || 'N/A'}</div>
```

### 6. Missing `await` in Async Functions

#### File: `src/lib/firebase/test.ts` (Lines 60, 91, 104)
```typescript
// ❌ BEFORE
async testConfiguration(): Promise<TestResult> {
  return this.runTest('Configuration Check', async () => {
    // ...
  })
}

// ✅ AFTER
async testConfiguration(): Promise<TestResult> {
  return await this.runTest('Configuration Check', async () => {
    // ...
  })
}
```

#### File: `src/lib/firebase/debug.ts` (Line 82)
```typescript
// ❌ BEFORE
async getDebugInfo(): Promise<FirebaseDebugInfo> {
  // No await inside
}

// ✅ AFTER - Either add await or remove async
getDebugInfo(): FirebaseDebugInfo {
  // Synchronous function
}
```

## Low Priority Warnings (Unsafe `any` assignments)

These are in `src/app/api/fix-superadmin/route.ts` and `src/lib/utils/console-helpers.ts`.

### Strategy for `any` Warnings

For files dealing with dynamic API responses, you can:

1. **Create proper type definitions:**
```typescript
interface ApiResponse {
  success: boolean
  users?: Array<{
    uid: string
    email: string
    role: string
    // ... other fields
  }>
  error?: string
}

const data = await response.json() as ApiResponse
```

2. **Use type guards:**
```typescript
function isValidUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'uid' in obj &&
    'email' in obj
  )
}
```

3. **Add ESLint disable comments (last resort):**
```typescript
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const data = await response.json()
```

## Batch Fix Commands

### 1. Auto-fix what's possible
```bash
npm run lint -- --fix
```

### 2. Fix specific file patterns
```bash
# Fix only import order issues
npx eslint --fix --rule 'import/order: error' .

# Fix only unused variables
npx eslint --fix --rule '@typescript-eslint/no-unused-vars: error' .
```

## Files Requiring Manual Fixes

1. ✅ **Already Fixed:**
   - `src/lib/utils/booking-permissions.ts`
   - `src/app/api/bookings/route.ts`
   - `src/app/(dashboard)/superadmin/admin/user-management/page.tsx`

2. **Need Manual Fixes:**
   - `src/app/(auth)/auth/page.tsx` - Remove empty line
   - `src/components/debug/FirebaseStatus.tsx` - Fix imports, hooks, promises
   - `src/components/debug/SuperAdminFixer.tsx` - Fix imports, unused vars, promises
   - `src/lib/firebase/test.ts` - Remove unused imports, fix await
   - `src/lib/firebase/debug.ts` - Change @ts-ignore to @ts-expect-error
   - `src/lib/firebase/connection.ts` - Add void to promises
   - `src/app/layout.tsx` - Add void to promise
   - `src/app/api/fix-superadmin/route.ts` - Add type definitions (optional)
   - `src/lib/utils/console-helpers.ts` - Add type definitions (optional)

## Quick Fix Script

Create a file `fix-lint.sh` for common fixes:

```bash
#!/bin/bash

# Fix import order
npx eslint --fix --rule 'import/order: [error, { groups: [builtin, external, internal, parent, sibling, index] }]' src/

# Fix unused imports
npx eslint --fix --rule 'unused-imports/no-unused-imports: error' src/

# Show remaining issues
npm run lint
```

## ESLint Configuration Recommendations

Consider adding these to `.eslintrc.json` to reduce warnings:

```json
{
  "rules": {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/require-await": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  }
}
```

## Verification After Fixes

```bash
# Check for errors only
npm run lint -- --quiet

# Full lint report
npm run lint

# Type check
npm run type-check

# Build test
npm run build
```

## Summary of Changes Made

### Completed Fixes:
1. ✅ Booking permissions updated (User role can create bookings)
2. ✅ Guest booking support added to `/api/bookings`
3. ✅ SuperAdmin user management setState error fixed

### Remaining Lint Fixes:
- 9 import order/unused import errors
- 152 warnings (mostly unsafe `any` and floating promises)

### Estimated Time to Fix Remaining:
- Critical errors: ~15 minutes
- High priority warnings: ~30 minutes
- Low priority warnings: ~2 hours (if fixing all `any` types)

**Recommendation:** Fix critical errors first, then high priority warnings. Low priority `any` warnings can be addressed gradually.