'use client'

import { Plane, Utensils, Luggage, Gem } from 'lucide-react'

import { SimpleDropdown } from '@/components/ui/simple-dropdown'
import { formatPrice } from '@/lib/flight/utils/price-formatter'
import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'

interface FlightCardSidebarProps {
  offer: FlightOffer
  onSelect?: () => void
  selectedFare?: string
  onFareChange?: (fare: string) => void
  showSelectButton?: boolean
}

export function FlightCardSidebar({ offer, onSelect, selectedFare = 'Basic', onFareChange, showSelectButton = true }: FlightCardSidebarProps) {
  const mainSegment = offer.segments[0]
  if (!mainSegment) return null

  // Only show fare dropdown when API provides actual upsell options (upSellBrandList).
  // When upSellBrandList is null, do not show fake Basic/Standard/Flexible options.
  const fareOptions = offer.upSellOptions?.length
    ? offer.upSellOptions.map((opt) => ({
        value: opt.brandName,
        label: opt.brandName
      }))
    : undefined

  // Find the selected upsell option
  const selectedUpSellOption = offer.upSellOptions?.find(
    (option) => option.brandName.toLowerCase() === selectedFare.toLowerCase()
  )

  // Use selected upsell option data if available, otherwise use main offer data
  const displayPricing = selectedUpSellOption?.pricing || offer.pricing
  const displayBaggage = selectedUpSellOption?.baggage || offer.baggage
  const displayFeatures = selectedUpSellOption?.features
  const firstSegment = mainSegment.segments[0]

  // Get booking class from selected upsell option or from segment
  const bookingClass = selectedUpSellOption?.bookingClass || firstSegment?.bookingClass || ''

  // Correct formula for struck-through price: totalPayable + discount + totalVAT
  // Use upsell option's totalVAT if available, otherwise fallback to main offer's totalVAT
  const totalVAT = displayPricing.totalVAT ?? offer.pricing.totalVAT ?? 0
  const originalPrice = displayPricing.total + displayPricing.breakdown.discount + totalVAT
  const baggageInfo = displayBaggage?.segments?.[0]

  // Check if meal should be shown (only if explicitly true, not null/undefined/false)
  const showMeal = displayFeatures?.meal === true

  return (
    <div className="w-full lg:w-[300px] border-t lg:border-t-0 lg:border-l border-gray-200/80 dark:border-white/10 flex flex-col self-stretch">
      {/* Top: Fare Selector - only when API provides upSellBrandList (real upsell options) */}
      {fareOptions && fareOptions.length > 0 && (
        <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-1">
          <SimpleDropdown
            id="fare-selector"
            value={selectedFare}
            options={fareOptions}
            onChange={(value) => onFareChange?.(value)}
            placeholder="Select fare"
          />
        </div>
      )}

      {/* Fare Inclusions */}
      <div className="px-4 sm:px-5 py-1 sm:py-1.5 flex flex-col">
        <div className="space-y-1">
          {/* Baggage - Only show if baggageInfo exists and adults is not null/N/A */}
          {baggageInfo && 
           baggageInfo.checkIn.adults && 
           baggageInfo.checkIn.adults !== 'N/A' && 
           baggageInfo.checkIn.adults !== null && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-tight text-gray-700 dark:text-gray-300">
              <Luggage className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary/60 flex-shrink-0" />
              <span>Adult Baggage: {baggageInfo.checkIn.adults}</span>
            </div>
          )}

          {/* Booking Class - Only show if not null/empty */}
          {bookingClass && bookingClass.trim() !== '' && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-tight text-gray-700 dark:text-gray-300">
              <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary/60 flex-shrink-0" />
              <span>Booking Class: {bookingClass}</span>
            </div>
          )}

          {/* Meal - Only show if explicitly true (not null/undefined/false) */}
          {showMeal && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-tight text-gray-700 dark:text-gray-300">
              <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary/60 flex-shrink-0" />
              <span>Meal Included</span>
            </div>
          )}

          {/* Seats Remaining - Only show if not null/undefined */}
          {offer.seatsRemaining != null && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm leading-tight text-gray-700 dark:text-gray-300">
              <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary/60 flex-shrink-0" />
              <span>{offer.seatsRemaining} seats remaining</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Pricing & Select Button - Pushed to bottom */}
      <div className={showSelectButton ? "mt-auto" : ""}>
        <div className="px-3 sm:px-4 pt-2 pb-2 sm:pb-3">
          {displayPricing.breakdown.discount > 0 && (
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-300 line-through mb-1">
              {formatPrice(originalPrice, displayPricing.currency)}
            </div>
          )}
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatPrice(displayPricing.gross || 0, displayPricing.currency)}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-300 mb-0">
            Total Price
          </div>
        </div>

        {/* Select Button - Only show if showSelectButton is true */}
        {showSelectButton && (
          <button
            onClick={onSelect}
            className="w-full px-4 h-[52px] bg-primary/90 hover:bg-primary active:bg-primary text-white text-sm sm:text-base font-semibold transition-colors flex items-center justify-center"
          >
            Select
          </button>
        )}
      </div>
    </div>
  )
}
