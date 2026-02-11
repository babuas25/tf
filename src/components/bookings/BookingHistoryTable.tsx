'use client'

import {
  Search,
  ChevronDown,
  Filter,
  ChevronUp,
  ChevronsUpDown,
  Loader2,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  CalendarDays,
  Minus,
  Plus,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useState, useMemo, useRef } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getAvailableBookingActions, type BookingUser } from '@/lib/utils/booking-permissions'
import type { RoleType } from '@/lib/utils/constants'

export type SortKey =
  | 'createDate'
  | 'status'
  | 'pnr'
  | 'name'
  | 'flyDate'
  | 'airline'
  | 'fare'
  | 'issued'
  | 'passengerType'
  | 'route'
  | 'createdBy'
  | 'referenceNo'
type SortDirection = 'asc' | 'desc'

export interface Booking {
  referenceNo: string
  createDate: string
  pnr?: string
  name: string
  issued: string
  fare: number
  route: string
  airline: string
  flyDate: string
  passengerType: string
  createdBy: string
  createdByEmail?: string
  status:
    | 'confirmed'
    | 'cancelled'
    | 'expired'
    | 'pending'
    | 'on-hold'
    | 'in-progress'
    | 'unconfirmed'
}

interface BookingHistoryTableProps {
  bookings: Booking[]
  onReferenceClick?: (referenceNo: string) => void
  /** Ref No currently loading (shows spinner, disables click) */
  refLoading?: string | null
  /** When provided, search/filter bar is controlled by parent (e.g. rendered in sticky header) */
  searchQuery?: string
  onSearchQueryChange?: (value: string) => void
  showAdvancedFilter?: boolean
  onAdvancedFilterToggle?: (value: boolean) => void
  /** Callback for booking actions */
  onBookingAction?: (action: 'view' | 'edit' | 'delete' | 'refresh', booking: Booking) => void
}

const STATUS_ORDER: Record<Booking['status'], number> = {
  'on-hold': 0,
  pending: 1,
  'in-progress': 2,
  confirmed: 3,
  unconfirmed: 4,
  expired: 5,
  cancelled: 6,
}

export function BookingHistoryTable({
  bookings,
  onReferenceClick,
  refLoading,
  searchQuery: controlledSearch,
  onSearchQueryChange,
  showAdvancedFilter: controlledAdvancedFilter,
  onAdvancedFilterToggle,
  onBookingAction,
}: BookingHistoryTableProps) {
  const { data: session } = useSession()
  const [internalSearch, setInternalSearch] = useState('')
  const [internalAdvancedFilter, setInternalAdvancedFilter] = useState(false)
  const searchQuery = controlledSearch !== undefined ? controlledSearch : internalSearch
  const setSearchQuery = onSearchQueryChange ?? setInternalSearch
  const showAdvancedFilter =
    controlledAdvancedFilter !== undefined ? controlledAdvancedFilter : internalAdvancedFilter
  const setShowAdvancedFilter = onAdvancedFilterToggle ?? setInternalAdvancedFilter
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterStatus, setFilterStatus] = useState<Booking['status'] | 'all'>('all')
  const [createdDateFrom, setCreatedDateFrom] = useState('')
  const [createdDateTo, setCreatedDateTo] = useState('')
  const [flyDateFrom, setFlyDateFrom] = useState('')
  const [flyDateTo, setFlyDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [createdByFilter, setCreatedByFilter] = useState('all')
  const createdDateFromRef = useRef<HTMLInputElement>(null)
  const createdDateToRef = useRef<HTMLInputElement>(null)
  const flyDateFromRef = useRef<HTMLInputElement>(null)
  const flyDateToRef = useRef<HTMLInputElement>(null)
  const renderFilterBarInTable = controlledSearch === undefined && onSearchQueryChange === undefined

  const currentUser: BookingUser | null = session?.user
    ? {
        id: (session.user as { id?: string }).id ?? '',
        email: (session.user as { email?: string }).email ?? '',
        role: ((session.user as { role?: string }).role ?? '') as RoleType,
      }
    : null
  const showActionColumn =
    currentUser?.role === 'SuperAdmin' ||
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Staff'

  // Filter bookings based on search query
  const queryFilteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true

      const searchSource = [
        booking.referenceNo,
        booking.pnr ?? '',
        booking.name,
        booking.createdByEmail ?? '',
        booking.createdBy ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return searchSource.includes(query)
    })
  }, [bookings, searchQuery])

  const createdByOptions = useMemo(() => {
    return Array.from(new Set(bookings.map((b) => b.createdBy).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    )
  }, [bookings])

  const advancedFilteredBookings = useMemo(() => {
    return queryFilteredBookings.filter((booking) => {
      if (filterStatus !== 'all' && booking.status !== filterStatus) {
        return false
      }

      const createdTime = new Date(booking.createDate).getTime()
      if (createdDateFrom) {
        const from = new Date(`${createdDateFrom}T00:00:00`).getTime()
        if (createdTime < from) return false
      }
      if (createdDateTo) {
        const to = new Date(`${createdDateTo}T23:59:59.999`).getTime()
        if (createdTime > to) return false
      }

      const flyTime = new Date(booking.flyDate).getTime()
      if (flyDateFrom) {
        const from = new Date(`${flyDateFrom}T00:00:00`).getTime()
        if (flyTime < from) return false
      }
      if (flyDateTo) {
        const to = new Date(`${flyDateTo}T23:59:59.999`).getTime()
        if (flyTime > to) return false
      }

      if (amountMin && booking.fare < Number(amountMin)) {
        return false
      }
      if (amountMax && booking.fare > Number(amountMax)) {
        return false
      }

      if (createdByFilter !== 'all' && booking.createdBy !== createdByFilter) {
        return false
      }

      return true
    })
  }, [
    queryFilteredBookings,
    filterStatus,
    createdDateFrom,
    createdDateTo,
    flyDateFrom,
    flyDateTo,
    amountMin,
    amountMax,
    createdByFilter,
  ])

  const clearAdvancedFilters = () => {
    setFilterStatus('all')
    setCreatedDateFrom('')
    setCreatedDateTo('')
    setFlyDateFrom('')
    setFlyDateTo('')
    setAmountMin('')
    setAmountMax('')
    setCreatedByFilter('all')
  }

  const openDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
    if (!ref.current) return
    if ('showPicker' in ref.current && typeof ref.current.showPicker === 'function') {
      ref.current.showPicker()
      return
    }
    ref.current.focus()
  }

  const adjustAmount = (
    currentValue: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    delta: number,
  ) => {
    const parsed = Number(currentValue)
    const base = Number.isFinite(parsed) ? parsed : 0
    const next = Math.max(0, base + delta)
    setValue(next === 0 ? '' : String(next))
  }

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0
    if (filterStatus !== 'all') count++
    if (createdByFilter !== 'all') count++
    if (createdDateFrom) count++
    if (createdDateTo) count++
    if (flyDateFrom) count++
    if (flyDateTo) count++
    if (amountMin) count++
    if (amountMax) count++
    return count
  }, [
    filterStatus,
    createdByFilter,
    createdDateFrom,
    createdDateTo,
    flyDateFrom,
    flyDateTo,
    amountMin,
    amountMax,
  ])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection(
        key === 'createDate' || key === 'flyDate' || key === 'issued' || key === 'fare'
          ? 'desc'
          : 'asc',
      )
    }
  }

  const sortedBookings = useMemo(() => {
    if (!sortKey) return advancedFilteredBookings
    return [...advancedFilteredBookings].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'createDate' || sortKey === 'flyDate' || sortKey === 'issued') {
        cmp = new Date(a[sortKey]).getTime() - new Date(b[sortKey]).getTime()
      } else if (sortKey === 'fare') {
        cmp = a.fare - b.fare
      } else if (sortKey === 'status') {
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      } else {
        const aVal = String(a[sortKey] ?? '')
        const bVal = String(b[sortKey] ?? '')
        cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' })
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [advancedFilteredBookings, sortKey, sortDirection])

  const getStatusBadge = (status: Booking['status']) => {
    const statusConfig = {
      'on-hold': { label: 'On Hold', color: '#F59E0B' },
      pending: { label: 'Pending', color: '#FACC15' },
      'in-progress': { label: 'In Progress', color: '#3B82F6' },
      confirmed: { label: 'Confirmed', color: '#16A34A' },
      expired: { label: 'Expired', color: '#6B7280' },
      unconfirmed: { label: 'Un-Confirmed', color: '#F97316' },
      cancelled: { label: 'Cancelled', color: '#DC2626' },
    }

    const config = statusConfig[status] || statusConfig.pending

    return (
      <Badge
        className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-white tracking-wide"
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </Badge>
    )
  }

  const formatIssuedDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = date.toLocaleDateString('en-GB', { month: 'short' })
    const year = date.getFullYear().toString().slice(-2)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' })
    return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}`
  }

  const formatFlyDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = date.toLocaleDateString('en-GB', { month: 'short' })
    const year = date.getFullYear().toString().slice(-2)
    const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' })
    return `${dayName}, ${day} ${month} ${year}`
  }

  const SortableHeader = ({
    label,
    columnKey,
    className,
  }: {
    label: string
    columnKey: SortKey
    className?: string
  }) => (
    <th
      className={cn(
        'text-left px-4 py-2.5 text-xs font-semibold tracking-tight border-b border-gray-200/80 dark:border-white/10',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => handleSort(columnKey)}
        className="flex items-center gap-1 text-gray-900 dark:text-gray-100 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
      >
        {label}
        {sortKey === columnKey ? (
          sortDirection === 'asc' ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        )}
      </button>
    </th>
  )

  return (
    <div className="w-full overflow-hidden">
      {renderFilterBarInTable && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-2 px-4 md:px-0 mb-4">
          <div className="relative flex-1 w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Ref No, PNR, Name, Email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs rounded-md border border-gray-300 dark:border-white/20 bg-white dark:bg-neutral-950 shadow-sm focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={cn(
              'h-8 gap-1.5 px-3 text-xs font-medium w-full md:w-auto',
              showAdvancedFilter
                ? 'bg-primary/10 text-primary border-primary/40 hover:bg-primary/15'
                : 'bg-white dark:bg-neutral-950 border border-gray-300 dark:border-white/20',
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Advanced Filter
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', showAdvancedFilter && 'rotate-180')}
            />
          </Button>
        </div>
      )}

      {/* Advanced Filter Panel */}
      {showAdvancedFilter && (
        <div className="mb-4 mx-4 md:mx-0 overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-b from-primary/[0.08] via-white to-white dark:from-primary/[0.12] dark:via-neutral-950 dark:to-neutral-950 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-4 py-3 border-b border-primary/20">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">Filters By</h3>
              <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {activeAdvancedFilterCount} applied
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAdvancedFilters}
              className="h-8 px-3 text-xs w-full md:w-auto border-primary/40 text-primary hover:bg-primary/10"
            >
              Clear Filters
            </Button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as Booking['status'] | 'all')}
                  className="tf-advanced-input h-8 w-full rounded-md border px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="on-hold">On Hold</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="expired">Expired</option>
                  <option value="unconfirmed">Un-Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Users (Created By)
                </label>
                <select
                  value={createdByFilter}
                  onChange={(e) => setCreatedByFilter(e.target.value)}
                  className="tf-advanced-input h-8 w-full rounded-md border px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="all">All Users</option>
                  {createdByOptions.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Created Date From
                </label>
                <div className="relative">
                  <Input
                    ref={createdDateFromRef}
                    type="date"
                    value={createdDateFrom}
                    onChange={(e) => setCreatedDateFrom(e.target.value)}
                    className="tf-advanced-input tf-advanced-date h-8 text-xs border pr-8 focus-visible:ring-primary/30 focus-visible:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => openDatePicker(createdDateFromRef)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-primary/80 hover:text-primary hover:bg-primary/10"
                    aria-label="Open created date from picker"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Created Date To
                </label>
                <div className="relative">
                  <Input
                    ref={createdDateToRef}
                    type="date"
                    value={createdDateTo}
                    onChange={(e) => setCreatedDateTo(e.target.value)}
                    className="tf-advanced-input tf-advanced-date h-8 text-xs border pr-8 focus-visible:ring-primary/30 focus-visible:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => openDatePicker(createdDateToRef)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-primary/80 hover:text-primary hover:bg-primary/10"
                    aria-label="Open created date to picker"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Fly Date From
                </label>
                <div className="relative">
                  <Input
                    ref={flyDateFromRef}
                    type="date"
                    value={flyDateFrom}
                    onChange={(e) => setFlyDateFrom(e.target.value)}
                    className="tf-advanced-input tf-advanced-date h-8 text-xs border pr-8 focus-visible:ring-primary/30 focus-visible:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => openDatePicker(flyDateFromRef)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-primary/80 hover:text-primary hover:bg-primary/10"
                    aria-label="Open fly date from picker"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Fly Date To
                </label>
                <div className="relative">
                  <Input
                    ref={flyDateToRef}
                    type="date"
                    value={flyDateTo}
                    onChange={(e) => setFlyDateTo(e.target.value)}
                    className="tf-advanced-input tf-advanced-date h-8 text-xs border pr-8 focus-visible:ring-primary/30 focus-visible:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => openDatePicker(flyDateToRef)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-primary/80 hover:text-primary hover:bg-primary/10"
                    aria-label="Open fly date to picker"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Amount Min
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    placeholder="Min amount"
                    className="tf-advanced-input tf-advanced-number h-8 text-xs border px-8 text-center focus-visible:ring-primary/30 focus-visible:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => adjustAmount(amountMin, setAmountMin, -100)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-primary/80 hover:text-primary hover:bg-primary/10"
                    aria-label="Decrease minimum amount"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustAmount(amountMin, setAmountMin, 100)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-primary/80 hover:text-primary hover:bg-primary/10"
                    aria-label="Increase minimum amount"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Amount Max
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    placeholder="Max amount"
                    className="tf-advanced-input tf-advanced-number h-8 text-xs border px-8 text-center focus-visible:ring-primary/30 focus-visible:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => adjustAmount(amountMax, setAmountMax, -100)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-primary/80 hover:text-primary hover:bg-primary/10"
                    aria-label="Decrease maximum amount"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustAmount(amountMax, setAmountMax, 100)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-primary/80 hover:text-primary hover:bg-primary/10"
                    aria-label="Increase maximum amount"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 border-t border-primary/20">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Showing {sortedBookings.length} of {bookings.length} bookings
            </p>
          </div>
        </div>
      )}

      {/* Desktop Table View - with horizontal scroll */}
      <div className="hidden md:block w-full overflow-auto bg-white dark:bg-neutral-950 rounded-lg border border-gray-200/80 dark:border-white/10 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 dark:bg-white/5">
              <tr>
                <SortableHeader label="Create Date" columnKey="createDate" />
                <SortableHeader label="Status" columnKey="status" />
                <SortableHeader label="PNR's" columnKey="pnr" />
                <SortableHeader label="Name" columnKey="name" />
                <SortableHeader label="Fly Date" columnKey="flyDate" />
                <SortableHeader label="Airline" columnKey="airline" />
                <SortableHeader label="Fare" columnKey="fare" />
                <SortableHeader label="Issued" columnKey="issued" />
                <SortableHeader label="Passenger Type" columnKey="passengerType" />
                <SortableHeader label="Route" columnKey="route" />
                <SortableHeader label="Created By" columnKey="createdBy" />
                <SortableHeader label="Ref No" columnKey="referenceNo" />
                {showActionColumn && (
                  <th className="text-left px-4 py-2.5 text-xs font-semibold tracking-tight border-b border-gray-200/80 dark:border-white/10">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={showActionColumn ? 14 : 13}
                    className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    No bookings found
                  </td>
                </tr>
              ) : (
                sortedBookings.map((booking) => (
                  <tr
                    key={booking.referenceNo}
                    className="border-b border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 text-xs leading-snug">
                      {formatIssuedDate(booking.createDate)}
                    </td>
                    <td className="px-4 py-2.5">{getStatusBadge(booking.status)}</td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 text-xs leading-snug">
                      {booking.pnr || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 text-xs font-medium leading-snug">
                      {booking.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 text-xs leading-snug">
                      {formatFlyDate(booking.flyDate)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 text-xs leading-snug">
                      {booking.airline}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 text-xs font-semibold tabular-nums leading-snug">
                      {booking.fare.toString()}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 text-xs leading-snug">
                      {formatIssuedDate(booking.issued)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 text-xs leading-snug">
                      {booking.passengerType}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 text-xs leading-snug">
                      {booking.route}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 text-xs leading-snug">
                      {booking.createdBy}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => onReferenceClick?.(booking.referenceNo)}
                        disabled={!!refLoading}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold underline text-primary hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded disabled:opacity-60 disabled:cursor-not-allowed disabled:no-underline"
                      >
                        {refLoading === booking.referenceNo ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                        ) : null}
                        {booking.referenceNo}
                      </button>
                    </td>
                    {showActionColumn && (
                      <td className="px-4 py-2.5">
                        {currentUser &&
                          (() => {
                            const actions = getAvailableBookingActions(
                              currentUser,
                              booking as unknown as {
                                referenceNo: string
                                createdBy: string
                                createdByEmail?: string
                                [key: string]: unknown
                              },
                            )
                            if (
                              !actions.canView &&
                              !actions.canUpdate &&
                              !actions.canDelete &&
                              !actions.canRefresh
                            ) {
                              return null
                            }

                            return (
                              <div className="flex items-center gap-1">
                                {actions.canView && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onBookingAction?.('view', booking)}
                                    className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                    title="View booking"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                                {actions.canRefresh && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onBookingAction?.('refresh', booking)}
                                    className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                    title="Refresh booking"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                )}
                                {actions.canUpdate && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onBookingAction?.('edit', booking)}
                                    className="h-6 w-6 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                                    title="Edit booking"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                                {actions.canDelete && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onBookingAction?.('delete', booking)}
                                    className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                    title="Delete booking"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )
                          })()}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - full width cards */}
      <div className="md:hidden w-full space-y-3">
        {sortedBookings.length === 0 ? (
          <div className="bg-white dark:bg-neutral-950 rounded-lg border border-gray-200/80 dark:border-white/10 p-8 text-center text-xs text-gray-500 dark:text-gray-400">
            No bookings found
          </div>
        ) : (
          sortedBookings.map((booking) => (
            <div
              key={booking.referenceNo}
              className="bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 rounded-lg p-4 space-y-2.5 shadow-sm"
            >
              {/* Create Date */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
                  Create Date
                </span>
                <span className="text-xs text-gray-900 dark:text-gray-100 text-right">
                  {formatIssuedDate(booking.createDate)}
                </span>
              </div>

              {/* Status */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</span>
                <div>{getStatusBadge(booking.status)}</div>
              </div>

              {/* PNR's */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
                  PNR's
                </span>
                <span className="text-xs text-gray-900 dark:text-gray-100 text-right">
                  {booking.pnr || '-'}
                </span>
              </div>

              {/* Name */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
                  Name
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100 text-right max-w-[60%]">
                  {booking.name}
                </span>
              </div>

              {/* Fly Date */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
                  Fly Date
                </span>
                <span className="text-xs text-gray-900 dark:text-gray-100 text-right">
                  {formatFlyDate(booking.flyDate)}
                </span>
              </div>

              {/* Airline */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Airline
                </span>
                <span className="text-xs text-gray-900 dark:text-gray-100">{booking.airline}</span>
              </div>

              {/* Fare */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Fare</span>
                <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                  {booking.fare.toString()}
                </span>
              </div>

              {/* Issued */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Issued</span>
                <span className="text-xs text-gray-900 dark:text-gray-100 text-right">
                  {formatIssuedDate(booking.issued)}
                </span>
              </div>

              {/* Passenger Type */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
                  Passenger Type
                </span>
                <span className="text-xs text-gray-900 dark:text-gray-100 text-right">
                  {booking.passengerType}
                </span>
              </div>

              {/* Route */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
                  Route
                </span>
                <span className="text-xs text-gray-900 dark:text-gray-100 text-right max-w-[60%]">
                  {booking.route}
                </span>
              </div>

              {/* Created By */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
                  Created By
                </span>
                <span className="text-xs text-gray-900 dark:text-gray-100 text-right">
                  {booking.createdBy}
                </span>
              </div>

              {/* Ref No */}
              <div className="flex justify-between items-center gap-2 pt-2.5 border-t border-gray-200/80 dark:border-white/10">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Ref No</span>
                <button
                  type="button"
                  onClick={() => onReferenceClick?.(booking.referenceNo)}
                  disabled={!!refLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold underline text-primary hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded disabled:opacity-60 disabled:cursor-not-allowed disabled:no-underline"
                >
                  {refLoading === booking.referenceNo ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : null}
                  {booking.referenceNo}
                </button>
              </div>

              {/* Actions */}
              {showActionColumn &&
                currentUser &&
                (() => {
                  const actions = getAvailableBookingActions(
                    currentUser,
                    booking as unknown as {
                      referenceNo: string
                      createdBy: string
                      createdByEmail?: string
                      [key: string]: unknown
                    },
                  )
                  if (
                    !actions.canView &&
                    !actions.canUpdate &&
                    !actions.canDelete &&
                    !actions.canRefresh
                  ) {
                    return null
                  }

                  return (
                    <div className="flex justify-between items-center gap-2 pt-2.5 border-t border-gray-200/80 dark:border-white/10">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Actions
                      </span>
                      <div className="flex items-center gap-1">
                        {actions.canView && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onBookingAction?.('view', booking)}
                            className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                            title="View booking"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        {actions.canRefresh && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onBookingAction?.('refresh', booking)}
                            className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                            title="Refresh booking"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        {actions.canUpdate && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onBookingAction?.('edit', booking)}
                            className="h-6 w-6 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                            title="Edit booking"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {actions.canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onBookingAction?.('delete', booking)}
                            className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                            title="Delete booking"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })()}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
