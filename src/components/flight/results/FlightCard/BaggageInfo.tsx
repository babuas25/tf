'use client'

import { Briefcase, Package } from 'lucide-react'

import type { BaggageInfo as BaggageInfoType } from '@/types/flight/domain/flight-offer.types'

interface BaggageInfoProps {
  baggage: BaggageInfoType
}

function hasAllowance(value: string | undefined): boolean {
  const v = (value ?? '').trim()
  return v !== '' && v !== 'N/A'
}

function AllowanceRow({ label, value }: { label: string; value: string }) {
  const isNA = !hasAllowance(value)
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-[11px] text-gray-600 dark:text-gray-400">{label}</div>
      <div className={`text-[11px] font-semibold ${isNA ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
        {value || 'N/A'}
      </div>
    </div>
  )
}

export function BaggageInfo({ baggage }: BaggageInfoProps) {
  if (!baggage?.segments?.length) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          No baggage information available for this offer.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {baggage.segments.map((segment, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/40 p-3"
        >
          {/* Route */}
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Route: <span className="text-gray-900 dark:text-white">{segment.route}</span>
          </div>

          {(() => {
            const checkInRows = [
              { label: 'Adult', value: segment.checkIn.adults },
              { label: 'Child', value: segment.checkIn.children },
              { label: 'Infant', value: segment.checkIn.infants },
            ].filter((r) => hasAllowance(r.value))

            const cabinRows = [
              { label: 'Adult', value: segment.cabin.adults },
              { label: 'Child', value: segment.cabin.children },
              { label: 'Infant', value: segment.cabin.infants },
            ].filter((r) => hasAllowance(r.value))

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Check-in */}
            <div className="rounded-md bg-blue-50/70 dark:bg-blue-900/10 p-2.5">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  Check-in
                </div>
              </div>
              <div className="space-y-1">
                {checkInRows.length === 0 ? (
                  <div className="text-[11px] text-gray-500 dark:text-gray-500">Not available</div>
                ) : (
                  checkInRows.map((r) => (
                    <AllowanceRow key={r.label} label={r.label} value={r.value} />
                  ))
                )}
              </div>
            </div>

            {/* Cabin */}
            <div className="rounded-md bg-green-50/70 dark:bg-green-900/10 p-2.5">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  Cabin
                </div>
              </div>
              <div className="space-y-1">
                {cabinRows.length === 0 ? (
                  <div className="text-[11px] text-gray-500 dark:text-gray-500">Not available</div>
                ) : (
                  cabinRows.map((r) => (
                    <AllowanceRow key={r.label} label={r.label} value={r.value} />
                  ))
                )}
              </div>
            </div>
              </div>
            )
          })()}
        </div>
      ))}

      <div className="text-[11px] text-gray-600 dark:text-gray-400">
        Note: baggage rules may vary by airline and fare brand.
      </div>
    </div>
  )
}
