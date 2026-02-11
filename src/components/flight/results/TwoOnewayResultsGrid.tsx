'use client'

import { useState, useCallback } from 'react'

import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'
import type { TripType } from '@/types/flight/ui/search-form.types'

import { FlightCard } from './FlightCard'
import { ResultsSortBar, type ResultsSortKey } from './ResultsSortBar'
import { SelectedFlightsBar } from './SelectedFlightsBar'

// Themed modal (matches booking-order cancel confirmation)
function FareUnavailableModal({
  open,
  title,
  message,
  onClose,
}: { open: boolean; title: string; message: string; onClose: () => void }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fare-unavailable-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-neutral-950 p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="fare-unavailable-modal-title" className="mb-3 text-base font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

interface TwoOnewayResultsGridProps {
  obOffers: FlightOffer[]
  ibOffers: FlightOffer[]
  tripType: TripType
  obSortKey?: ResultsSortKey
  ibSortKey?: ResultsSortKey
  onObSortChange?: (key: ResultsSortKey) => void
  onIbSortChange?: (key: ResultsSortKey) => void
  onFlightSelect?: (offerId: string) => void
  onBookNow?: (outboundId: string, returnId: string, traceId: string) => void
  traceId?: string
}

function ResultsColumn({
  title,
  offers,
  tripType,
  selectedOfferId,
  onRadioSelect,
  sortKey,
  onSortChange,
  onFareChange,
}: {
  title: string
  offers: FlightOffer[]
  tripType: TripType
  selectedOfferId: string | null
  onRadioSelect: (offerId: string) => void
  sortKey?: ResultsSortKey
  onSortChange?: (key: ResultsSortKey) => void
  onFareChange?: (offerId: string, fare: string) => void
}) {
  return (
    <section className="min-w-0">
      <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-2 3xl:mb-3">
        <h3 className="text-sm sm:text-base lg:text-sm 3xl:text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="text-xs lg:text-[11px] 3xl:text-xs text-gray-600 dark:text-gray-400">
          {offers.length} option{offers.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Sort bar for this column */}
      {onSortChange && (
        <div className="mb-2 sm:mb-3 lg:mb-2 3xl:mb-3">
          <ResultsSortBar value={sortKey || 'none'} onChange={onSortChange} />
        </div>
      )}

      <div className="space-y-1 sm:space-y-1.5 lg:space-y-1 3xl:space-y-1.5">
        {offers.map((offer) => (
          <FlightCard
            key={offer.id}
            offer={offer}
            tripType={tripType}
            isSelected={selectedOfferId === offer.id}
            onRadioSelect={onRadioSelect}
            {...(onFareChange && { onFareSelectionChange: onFareChange })}
            {...(selectedOfferId === offer.id && offer.upSellOptions?.[0] && { 
              initialSelectedFare: offer.upSellOptions[0].brandName 
            })}
          />
        ))}
      </div>
    </section>
  )
}

export function TwoOnewayResultsGrid({
  obOffers,
  ibOffers,
  tripType,
  obSortKey,
  ibSortKey,
  onObSortChange,
  onIbSortChange,
  onBookNow,
  traceId,
}: TwoOnewayResultsGridProps) {
  // Selection state for outbound and return flights
  const [selectedOutboundId, setSelectedOutboundId] = useState<string | null>(null)
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null)
  const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  })
  
  // Track selected fares for each flight
  const [selectedOutboundFare, setSelectedOutboundFare] = useState<Record<string, string>>({})
  const [selectedReturnFare, setSelectedReturnFare] = useState<Record<string, string>>({})

  // Get the selected offer objects
  const selectedOutbound = obOffers.find(o => o.id === selectedOutboundId) || null
  const selectedReturn = ibOffers.find(o => o.id === selectedReturnId) || null

  const handleOutboundSelect = useCallback((offerId: string) => {
    setSelectedOutboundId(prev => prev === offerId ? null : offerId)
  }, [])

  const handleReturnSelect = useCallback((offerId: string) => {
    setSelectedReturnId(prev => prev === offerId ? null : offerId)
  }, [])

  const handleOutboundFareChange = useCallback((offerId: string, fare: string) => {
    setSelectedOutboundFare(prev => ({ ...prev, [offerId]: fare }))
  }, [])

  const handleReturnFareChange = useCallback((offerId: string, fare: string) => {
    setSelectedReturnFare(prev => ({ ...prev, [offerId]: fare }))
  }, [])

  const handleClearOutbound = useCallback(() => {
    setSelectedOutboundId(null)
  }, [])

  const handleClearReturn = useCallback(() => {
    setSelectedReturnId(null)
  }, [])

  const handleBookNow = useCallback(async () => {
    if (!selectedOutboundId || !selectedReturnId || !traceId) {
      return
    }

    // Get the selected offer objects
    const selectedOutbound = obOffers.find(o => o.id === selectedOutboundId)
    const selectedReturn = ibOffers.find(o => o.id === selectedReturnId)

    if (!selectedOutbound || !selectedReturn) {
      setAlertModal({
        open: true,
        title: 'Select flights',
        message: 'Please select both outbound and return flights',
      })
      return
    }

    // Find the selected upsell options to get the correct offerIds
    const outboundSelectedFare = selectedOutboundFare[selectedOutboundId] || selectedOutbound?.upSellOptions?.[0]?.brandName || 'Basic'
    const returnSelectedFare = selectedReturnFare[selectedReturnId] || selectedReturn?.upSellOptions?.[0]?.brandName || 'Basic'
    
    const outboundUpSellOption = selectedOutbound?.upSellOptions?.find(
      (option) => option.brandName.toLowerCase() === outboundSelectedFare.toLowerCase()
    )
    const returnUpSellOption = selectedReturn?.upSellOptions?.find(
      (option) => option.brandName.toLowerCase() === returnSelectedFare.toLowerCase()
    )
    
    // Use the upsell option's id (which contains the offerId) if available, otherwise fall back to main offerId
    const outboundOfferId = outboundUpSellOption?.id || selectedOutboundId
    const returnOfferId = returnUpSellOption?.id || selectedReturnId

    // Show loading state
    const button = document.activeElement as HTMLButtonElement
    if (button?.tagName === 'BUTTON') {
      button.disabled = true
      button.textContent = 'Checking...'
    }

    try {
      // Client-side validation: Check if both selected offers are available
      const validationResponse = await fetch('/api/flight/offerprice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          traceId,
          offerId: [outboundOfferId, returnOfferId],
        }),
      })

      const validationResult = await validationResponse.json() as { success: boolean; error?: { errorMessage?: string } }

      if (validationResult.success) {
        // Both offers are available, proceed to booking
        onBookNow?.(outboundOfferId, returnOfferId, traceId)
      } else {
        setAlertModal({
          open: true,
          title: 'Fare unavailable',
          message: validationResult.error?.errorMessage || 'One or more selected flights are not available',
        })
        if (button?.tagName === 'BUTTON') {
          button.disabled = false
          button.textContent = 'Book Now'
        }
      }
    } catch (error) {
      console.error('Error validating offers:', error)
      setAlertModal({
        open: true,
        title: 'Error',
        message: 'Failed to validate flight availability. Please try again.',
      })
      if (button?.tagName === 'BUTTON') {
        button.disabled = false
        button.textContent = 'Book Now'
      }
    }
  }, [selectedOutboundId, selectedReturnId, traceId, onBookNow, obOffers, ibOffers])

  const closeAlertModal = useCallback(() => {
    setAlertModal((prev) => ({ ...prev, open: false }))
  }, [])

  const handleBookNowClick = useCallback(() => {
    void handleBookNow()
  }, [handleBookNow])

  // Determine column titles based on trip type
  const obTitle = tripType === 'multicity' ? 'Trip 1' : 'Outbound'
  const ibTitle = tripType === 'multicity' ? 'Trip 2' : 'Return'

  return (
    <>
      {/* Two columns on mobile too (match two-oneway UX) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-3 3xl:gap-4 pb-24 lg:pb-20">
        <ResultsColumn
          title={obTitle}
          offers={obOffers}
          tripType={tripType}
          selectedOfferId={selectedOutboundId}
          onRadioSelect={handleOutboundSelect}
          onFareChange={handleOutboundFareChange}
          {...(onObSortChange && {
            sortKey: obSortKey ?? 'none',
            onSortChange: onObSortChange,
          })}
        />
        <ResultsColumn
          title={ibTitle}
          offers={ibOffers}
          tripType={tripType}
          selectedOfferId={selectedReturnId}
          onRadioSelect={handleReturnSelect}
          onFareChange={handleReturnFareChange}
          {...(onIbSortChange && {
            sortKey: ibSortKey ?? 'none',
            onSortChange: onIbSortChange,
          })}
        />
      </div>

      {/* Bottom Selection Bar */}
      <SelectedFlightsBar
        selectedOutbound={selectedOutbound}
        selectedReturn={selectedReturn}
        {...(selectedOutbound && (() => {
          const fare = selectedOutboundFare[selectedOutboundId ?? ''] ?? selectedOutbound.upSellOptions?.[0]?.brandName
          return typeof fare === 'string' ? { selectedOutboundFare: fare } : {}
        })())}
        {...(selectedReturn && (() => {
          const fare = selectedReturnFare[selectedReturnId ?? ''] ?? selectedReturn.upSellOptions?.[0]?.brandName
          return typeof fare === 'string' ? { selectedReturnFare: fare } : {}
        })())}
        onClearOutbound={handleClearOutbound}
        onClearReturn={handleClearReturn}
        onBookNow={handleBookNowClick}
      />

      <FareUnavailableModal
        open={alertModal.open}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlertModal}
      />
    </>
  )
}
