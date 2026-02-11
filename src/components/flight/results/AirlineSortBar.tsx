'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useRef } from 'react'

import { AirlineLogo } from '@/components/flight/shared/AirlineLogo'
import { formatPrice } from '@/lib/flight/utils/price-formatter'
import type { AirlineFilterOption, FlightFilters } from '@/types/flight/ui/filter.types'

interface AirlineSortBarProps {
  airlines: AirlineFilterOption[]
  filters: FlightFilters
  onFiltersChange: (filters: FlightFilters) => void
  currency?: string
}

export function AirlineSortBar({ airlines, filters, onFiltersChange, currency = 'BDT' }: AirlineSortBarProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const sorted = useMemo(() => {
    // Show airlines in price order like a "sort bar" feel
    return [...airlines].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
  }, [airlines])

  const activeSingle = filters.airlines.length === 1 ? filters.airlines[0] : null

  const scrollBy = (dx: number) => {
    scrollerRef.current?.scrollBy({ left: dx, behavior: 'smooth' })
  }

  const setAirline = (code: string | null) => {
    if (!code) {
      onFiltersChange({ ...filters, airlines: [] })
      return
    }
    if (activeSingle === code) {
      onFiltersChange({ ...filters, airlines: [] })
      return
    }
    onFiltersChange({ ...filters, airlines: [code] })
  }

  if (!sorted || sorted.length === 0) return null

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => scrollBy(-260)}
          className="h-9 w-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors flex items-center justify-center flex-shrink-0"
          aria-label="Scroll airlines left"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Scroll area */}
        <div
          ref={scrollerRef}
          className="flex-1 overflow-x-auto whitespace-nowrap scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]"
        >
          <div className="flex items-stretch gap-2 pr-2">
            {/* All */}
            <button
              type="button"
              onClick={() => setAirline(null)}
              className={[
                'h-9 px-3 rounded-lg border text-left flex items-center gap-2 flex-shrink-0',
                filters.airlines.length === 0
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-900',
              ].join(' ')}
            >
              <div className="text-xs font-semibold">All</div>
            </button>

            {sorted.map((a) => {
              const isActive = activeSingle === a.code
              const priceText = a.price != null ? formatPrice(a.price, currency) : ''
              const countText = a.count != null ? `(${a.count})` : ''

              return (
                <button
                  key={a.code}
                  type="button"
                  onClick={() => setAirline(a.code)}
                  className={[
                    'h-9 px-3 rounded-lg border flex items-center gap-2 flex-shrink-0 min-w-[140px] max-w-[220px]',
                    isActive
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950 hover:bg-gray-50 dark:hover:bg-neutral-900',
                  ].join(' ')}
                  title={a.label}
                >
                  <AirlineLogo airlineId={a.code} size={18} className="rounded-sm" />
                  <div className="min-w-0 flex flex-col items-start leading-tight">
                    <div className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">
                      {a.code} {countText}
                    </div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                      {priceText}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => scrollBy(260)}
          className="h-9 w-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors flex items-center justify-center flex-shrink-0"
          aria-label="Scroll airlines right"
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Hide scrollbar in WebKit */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

