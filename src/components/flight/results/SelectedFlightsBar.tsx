'use client'

import { Plane, X, ChevronUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { AirlineLogo } from '@/components/flight/shared/AirlineLogo'
import { formatFlightTime } from '@/lib/flight/utils/date-formatter'
import { formatPrice } from '@/lib/flight/utils/price-formatter'
import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'

interface SelectedFlightsBarProps {
  selectedOutbound: FlightOffer | null
  selectedReturn: FlightOffer | null
  /** Selected fare brand name for outbound (for correct total when offer has upSellOptions) */
  selectedOutboundFare?: string
  /** Selected fare brand name for return (for correct total when offer has upSellOptions) */
  selectedReturnFare?: string
  onClearOutbound?: () => void
  onClearReturn?: () => void
  onBookNow?: () => void
}

function FlightSummary({ 
  offer, 
  type, 
  onClear 
}: { 
  offer: FlightOffer
  type: 'outbound' | 'return'
  onClear?: (() => void) | undefined
}) {
  const segment = offer.segments[0]
  if (!segment) return null

  const departure = segment.departure
  const arrival = segment.arrival

  return (
    <div className="flex items-center gap-2 lg:gap-3 bg-gray-800/50 dark:bg-gray-700/50 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2">
      {/* Airline Logo */}
      <div className="flex-shrink-0">
        <AirlineLogo airlineId={offer.validatingCarrier.code} size={18} className="w-4 h-4 lg:w-5 lg:h-5" />
      </div>

      {/* Route Info */}
      <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm text-white min-w-0">
        <span className="font-semibold">{departure.airport}</span>
        <span className="text-[10px] lg:text-xs text-gray-400">{formatFlightTime(departure.dateTime)}</span>
        <Plane className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-gray-400 flex-shrink-0" />
        <span className="font-semibold">{arrival.airport}</span>
        <span className="text-[10px] lg:text-xs text-gray-400">{formatFlightTime(arrival.dateTime)}</span>
      </div>

      {/* Clear Button */}
      {onClear && (
        <button
          onClick={onClear}
          className="flex-shrink-0 p-0.5 lg:p-1 hover:bg-white/10 rounded transition-colors"
          aria-label={`Clear ${type} selection`}
        >
          <X className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400 hover:text-white" />
        </button>
      )}
    </div>
  )
}

export function SelectedFlightsBar({
  selectedOutbound,
  selectedReturn,
  selectedOutboundFare,
  selectedReturnFare,
  onClearOutbound,
  onClearReturn,
  onBookNow,
}: SelectedFlightsBarProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Don't show if nothing is selected
  if (!selectedOutbound && !selectedReturn) {
    return null
  }

  // Resolve price from selected fare option when user picked a specific upsell (e.g. Economy O)
  const outboundOption = selectedOutboundFare && selectedOutbound?.upSellOptions?.length
    ? selectedOutbound.upSellOptions.find(
        (o) => o.brandName.toLowerCase() === selectedOutboundFare.toLowerCase()
      )
    : undefined
  const returnOption = selectedReturnFare && selectedReturn?.upSellOptions?.length
    ? selectedReturn.upSellOptions.find(
        (o) => o.brandName.toLowerCase() === selectedReturnFare.toLowerCase()
      )
    : undefined

  const outboundPrice =
    outboundOption?.pricing.gross ?? outboundOption?.pricing.total ??
    selectedOutbound?.pricing.gross ?? selectedOutbound?.pricing.total ?? 0
  const returnPrice =
    returnOption?.pricing.gross ?? returnOption?.pricing.total ??
    selectedReturn?.pricing.gross ?? selectedReturn?.pricing.total ?? 0
  const totalPrice = outboundPrice + returnPrice
  const currency = selectedOutbound?.pricing.currency || selectedReturn?.pricing.currency || 'BDT'

  const bothSelected = selectedOutbound && selectedReturn

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 dark:bg-gray-950 border-t border-gray-700 shadow-2xl">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-950 border border-gray-700 border-b-0 rounded-t-lg px-4 py-1 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
      >
        {isExpanded ? (
          <>
            <span>Hide</span>
            <ChevronDown className="w-3 h-3" />
          </>
        ) : (
          <>
            <span>Show Selection</span>
            <ChevronUp className="w-3 h-3" />
          </>
        )}
      </button>

      {isExpanded && (
        <div className="container mx-auto px-2 sm:px-4 py-2 lg:py-3">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-4">
            {/* Selected Flights */}
            <div className="flex flex-col sm:flex-row items-center gap-2 lg:gap-4 flex-1 w-full lg:w-auto">
              {/* Outbound */}
              {selectedOutbound ? (
                <FlightSummary 
                  offer={selectedOutbound} 
                  type="outbound" 
                  onClear={onClearOutbound}
                />
              ) : (
                <div className="flex items-center gap-2 bg-gray-800/30 rounded-lg px-3 py-2 text-xs lg:text-sm text-gray-500">
                  <Plane className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Select outbound flight</span>
                </div>
              )}

              {/* Arrow between */}
              <div className="hidden sm:flex items-center text-gray-500">
                <Plane className="w-4 h-4 rotate-90 sm:rotate-0" />
              </div>

              {/* Return */}
              {selectedReturn ? (
                <FlightSummary 
                  offer={selectedReturn} 
                  type="return" 
                  onClear={onClearReturn}
                />
              ) : (
                <div className="flex items-center gap-2 bg-gray-800/30 rounded-lg px-3 py-2 text-xs lg:text-sm text-gray-500">
                  <Plane className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Select return flight</span>
                </div>
              )}
            </div>

            {/* Total Price & Actions */}
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Total Price */}
              <div className="text-right">
                <div className="text-[10px] lg:text-xs text-gray-400 uppercase">Total Price</div>
                <div className="text-lg lg:text-xl font-bold text-white">
                  {formatPrice(totalPrice, currency)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onBookNow}
                  disabled={!bothSelected}
                  className={`px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg text-xs lg:text-sm font-semibold transition-colors ${
                    bothSelected
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
