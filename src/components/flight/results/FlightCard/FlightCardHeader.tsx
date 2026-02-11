'use client'

import { Plane } from 'lucide-react'

import { AirlineLogo } from '@/components/flight/shared/AirlineLogo'
import { formatPrice } from '@/lib/flight/utils/price-formatter'
import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'

interface FlightCardHeaderProps {
  offer: FlightOffer
  /** Show price in header (for two-oneway on medium-large screens without sidebar) */
  showPrice?: boolean
  /** Show radio button for selection (for two-oneway) */
  showRadio?: boolean
  /** Whether this card is selected */
  isSelected?: boolean
  /** Callback when radio is clicked */
  onRadioClick?: () => void
  /** When true, do not show "Operated by" (e.g. domestic Bangladesh routes) */
  hideOperatingCarrier?: boolean
}

export function FlightCardHeader({ offer, showPrice = false, showRadio = false, isSelected = false, onRadioClick, hideOperatingCarrier = false }: FlightCardHeaderProps) {
  if (!offer.segments?.length) return null

  // Collect all flight numbers from all segments
  const allFlightNumbers: string[] = []
  offer.segments.forEach(segmentGroup => {
    segmentGroup.segments.forEach(segment => {
      const flightNum = `${segment.airline.code}${segment.flightNumber}`
      if (!allFlightNumbers.includes(flightNum)) {
        allFlightNumbers.push(flightNum)
      }
    })
  })

  // Collect aircraft types per segment (keep duplicates, in order)
  const aircraftTypes: string[] = []
  offer.segments.forEach(segmentGroup => {
    segmentGroup.segments.forEach(segment => {
      const aircraft = segment.aircraft?.trim()
      if (aircraft) aircraftTypes.push(aircraft)
    })
  })
  // Collect all unique operating carriers across all segments (hidden for domestic Bangladesh)
  const uniqueOperatingCarriers = new Map<string, { code: string; name: string }>()
  if (!hideOperatingCarrier) {
    offer.segments.forEach(segmentGroup => {
      segmentGroup.segments.forEach(segment => {
        if (segment.operatingAirline && !uniqueOperatingCarriers.has(segment.operatingAirline.code)) {
          uniqueOperatingCarriers.set(segment.operatingAirline.code, segment.operatingAirline)
        }
      })
    })
  }

  const shouldShowOperatingCarriers = !hideOperatingCarrier && uniqueOperatingCarriers.size > 0
  const operatingCarriers = Array.from(uniqueOperatingCarriers.values())
  const operatingCarrierNames = operatingCarriers.map(c => c.name)

  const pricing = offer.pricing

  // Conditional classes for compact (two-oneway with showPrice) vs regular layout
  const logoClass = showPrice
    ? "w-7 h-7 lg:w-8 lg:h-8 3xl:w-9 3xl:h-9 flex-shrink-0"
    : "sm:w-9 sm:h-9 flex-shrink-0"

  const titleClass = showPrice
    ? "text-[9px] lg:text-[10px] 3xl:text-xs font-semibold text-gray-900 dark:text-white leading-tight truncate"
    : "text-[10px] sm:text-xs font-semibold text-gray-900 dark:text-white leading-tight truncate"

  const operatedByLabelClass = showPrice
    ? "text-[7px] lg:text-[7px] 3xl:text-[8px] text-gray-500 dark:text-gray-300 leading-tight"
    : "text-[7px] sm:text-[8px] text-gray-500 dark:text-gray-300 leading-tight"

  const operatedByTextClass = showPrice
    ? "flex items-center gap-1 lg:gap-1.5 text-[7px] lg:text-[8px] 3xl:text-[9px] text-gray-500 dark:text-gray-300 leading-tight overflow-hidden"
    : "flex items-center gap-1.5 text-[8px] sm:text-[9px] text-gray-500 dark:text-gray-300 leading-tight overflow-hidden"

  const operatedByLogoContainerClass = showPrice
    ? "flex items-center gap-0.5 lg:gap-1 flex-shrink-0"
    : "flex items-center gap-1 flex-shrink-0"

  const operatedByLogoClass = showPrice
    ? "w-2.5 h-2.5 lg:w-3 lg:h-3 flex-shrink-0"
    : "w-3 h-3 flex-shrink-0"

  const operatedByMoreClass = showPrice
    ? "text-[7px] lg:text-[8px] 3xl:text-[9px] text-gray-500 dark:text-gray-300"
    : "text-[8px] sm:text-[9px] text-gray-500 dark:text-gray-300"

  const flightNumberClass = showPrice
    ? "text-[7px] lg:text-[8px] 3xl:text-[10px] text-gray-500 dark:text-gray-300 leading-snug whitespace-normal break-words"
    : "text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-300 leading-snug whitespace-normal break-words"

  const aircraftTextClass = showPrice
    ? "mt-0.5 flex items-center gap-0.5 lg:gap-1 text-[9px] lg:text-[10px] 3xl:text-xs text-gray-600 dark:text-gray-300 justify-end"
    : "mt-0.5 flex items-center gap-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 justify-end"

  const planeIconClass = showPrice
    ? "w-2.5 h-2.5 lg:w-3 lg:h-3 3xl:w-3.5 3xl:h-3.5 flex-shrink-0"
    : "w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"

  const flightInfoMaxWidthClass = showPrice
    ? `flex flex-col items-end text-right flex-shrink-0 max-w-[40%] lg:max-w-[35%] 3xl:max-w-[50%] ${showPrice ? 'hidden 3xl:flex' : ''}`
    : "flex flex-col items-end text-right flex-shrink-0 max-w-[55%] sm:max-w-[60%]"

  return (
    <div className="px-2 sm:px-4 py-1.5 sm:py-2 border-b border-gray-200/80 dark:border-white/10 w-full overflow-hidden">
      <div className="flex items-start justify-between gap-2 lg:gap-3 w-full">
        {/* Left: Radio Button (for two-oneway) + Airline Name + Operated By */}
        <div className="flex items-start gap-1.5 sm:gap-2 min-w-0 flex-shrink">
          {/* Radio Button for two-oneway selection */}
          {showRadio && (
            <button
              onClick={onRadioClick}
              className="flex-shrink-0 mt-1 w-4 h-4 lg:w-5 lg:h-5 rounded-full border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              style={{
                borderColor: isSelected ? 'hsl(var(--primary))' : 'rgb(156 163 175)',
                backgroundColor: isSelected ? 'hsl(var(--primary))' : 'transparent',
              }}
              aria-label={isSelected ? 'Selected' : 'Select this flight'}
            >
              {isSelected && (
                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-white" />
              )}
            </button>
          )}
          <AirlineLogo airlineId={offer.validatingCarrier.code} size={32} className={logoClass} />
          <div className="min-w-0">
            <h3 className={titleClass}>
              {offer.validatingCarrier.name}
            </h3>

            {shouldShowOperatingCarriers && (
              <div className="mt-0.5">
                <div className={operatedByLabelClass}>Operated by:</div>
                <div className={operatedByTextClass}>
                  <div className={operatedByLogoContainerClass}>
                    {operatingCarriers.slice(0, 3).map((carrier) => (
                      <AirlineLogo key={carrier.code} airlineId={carrier.code} size={12} className={operatedByLogoClass} />
                    ))}
                    {operatingCarriers.length > 3 && (
                      <span className={operatedByMoreClass}>
                        +{operatingCarriers.length - 3}
                      </span>
                    )}
                  </div>
                  <span className="truncate">{operatingCarrierNames.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center/Right: Flight Numbers + Aircraft (hidden on lg-3xl when price shown) */}
        <div className={flightInfoMaxWidthClass}>
          <div className={flightNumberClass}>
            {allFlightNumbers.join(', ')}
          </div>

          <div className={aircraftTextClass}>
            <Plane className={planeIconClass} />
            {aircraftTypes.length ? (
              <div className="flex flex-wrap justify-end gap-x-0.5 lg:gap-x-1 gap-y-0.5 leading-tight">
                {aircraftTypes.map((aircraft, idx) => (
                  <span key={`${aircraft}-${idx}`} className="whitespace-nowrap">
                    {aircraft}
                    {idx < aircraftTypes.length - 1 && <span className="mx-0.5 text-gray-400">•</span>}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-300">N/A</span>
            )}
          </div>
        </div>

        {/* Right: Price (shown on lg-3xl when showPrice is true, hidden on 3xl+ where sidebar shows) */}
        {showPrice && (
          <div className="hidden lg:flex 3xl:hidden flex-col items-end text-right flex-shrink-0">
            <div className="text-base lg:text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {formatPrice(pricing.gross || pricing.total, pricing.currency)}
            </div>
            <div className="text-[8px] lg:text-[9px] text-gray-500 dark:text-gray-300">
              Total Price
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
