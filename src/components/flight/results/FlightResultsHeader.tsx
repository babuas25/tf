'use client'

import { Edit } from 'lucide-react'

interface FlightResultsHeaderProps {
  count: number
  traceId?: string | null
  onModifySearch?: () => void
}

export function FlightResultsHeader({ count, onModifySearch }: FlightResultsHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4">
      {/* Left: Results Count */}
      <div className="min-w-0 pl-2">
        <div className="text-left text-[11px] sm:text-xs font-normal text-gray-600 dark:text-gray-200">
          {count} {count === 1 ? 'Flight' : 'Flights'} Found
        </div>
      </div>

      {/* Right: Modify Button */}
      {onModifySearch && (
        <button
          onClick={onModifySearch}
          className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded shadow-sm transition-colors flex-shrink-0"
        >
          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Modify Search</span>
        </button>
      )}
    </div>
  )
}
