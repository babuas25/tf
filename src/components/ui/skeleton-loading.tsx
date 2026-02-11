'use client'

import { type HTMLAttributes } from 'react'

// Basic skeleton component
export function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`animate-pulse bg-gray-300 dark:bg-gray-600 rounded ${className}`} {...props} />
  )
}

// User management skeleton components
export function UserTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/30 bg-white/20 backdrop-blur-md shadow-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-white/20 backdrop-blur-sm">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
              Name
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
              Email
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
              Role
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
              Category
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, index) => index).map((index) => (
            <tr key={index} className="border-t border-white/10">
              <td className="px-4 py-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-8 w-20 rounded-lg" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-8 w-24 rounded-lg" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-6 w-16 rounded-full" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function UserCardSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }, (_, index) => index).map((index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-xl"
        >
          {/* Card Header */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Last Login Info */}
            <div className="mb-4">
              <Skeleton className="h-3 w-32" />
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <div>
                <Skeleton className="h-3 w-8 mb-2" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>

              <div>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>

              <div>
                <Skeleton className="h-3 w-12 mb-2" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Combined skeleton that shows both desktop and mobile
export function UserManagementSkeleton() {
  return (
    <>
      {/* Desktop Table Skeleton */}
      <EnhancedUserTableSkeleton />

      {/* Mobile Card Skeleton */}
      <EnhancedUserCardSkeleton />
    </>
  )
}

// Search and filter skeleton
export function SearchFilterSkeleton() {
  return (
    <div className="mb-6 p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="md:w-48">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Complete page skeleton
export function UserManagementPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Search and Filter */}
      <SearchFilterSkeleton />

      {/* Admin Notice Skeleton (for admin pages) */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Skeleton className="h-4 w-full" />
      </div>

      {/* User Management Content */}
      <UserManagementSkeleton />
    </div>
  )
}

// Enhanced table skeleton with more realistic structure
export function EnhancedUserTableSkeleton() {
  return (
    <div className="hidden md:block overflow-x-auto rounded-xl border border-white/30 bg-white/20 backdrop-blur-md shadow-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-white/20 backdrop-blur-sm">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
              Name
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
              Email
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
              Role
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
              Category
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, index) => index).map((index) => (
            <tr key={index} className="border-t border-white/10">
              <td className="px-4 py-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-44" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-8 w-24 rounded-lg" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-8 w-28 rounded-lg" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-6 w-16 rounded-full" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Enhanced mobile card skeleton
export function EnhancedUserCardSkeleton() {
  return (
    <div className="md:hidden space-y-4">
      {Array.from({ length: 4 }, (_, index) => index).map((index) => (
        <div
          key={index}
          className="group rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-xl"
        >
          {/* Card Header */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-5 w-36 mb-2" />
                  <Skeleton className="h-4 w-52" />
                </div>
              </div>
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            {/* Last Login Info */}
            <div className="mb-4">
              <Skeleton className="h-3 w-40" />
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <div>
                <Skeleton className="h-3 w-10 mb-2" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>

              <div>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>

              <div>
                <Skeleton className="h-3 w-12 mb-2" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function UserManagementCompactSkeleton({
  showAdminNotice = false,
}: {
  showAdminNotice?: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-56 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>

      {showAdminNotice && (
        <div className="p-3 bg-blue-50/40 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800 rounded-lg">
          <Skeleton className="h-4 w-full" />
        </div>
      )}

      <div className="rounded-xl border border-white/30 bg-white/20 backdrop-blur-md shadow-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/30 bg-white/20 backdrop-blur-md shadow-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-white/20 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, idx) => (
              <tr key={idx} className="border-t border-white/20">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-36" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-52" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
