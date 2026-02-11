'use client'

import { Plane } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'

// Themed modal (matches booking-order cancel confirmation)
function FareUnavailableModal({
  open,
  message,
  onClose,
}: {
  open: boolean
  message: string
  onClose: () => void
}) {
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
        <h2
          id="fare-unavailable-modal-title"
          className="mb-3 text-base font-bold text-gray-900 dark:text-white"
        >
          Fare unavailable
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
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

import { isDomesticBangladeshOffer } from '@/lib/flight/utils/domestic-route'
import {
  getFareRulesDisplayContent,
  type FareRulesResponse,
} from '@/types/flight/domain/farerules.types'
import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'
import type { TransformedMiniRule, MiniRuleResponse } from '@/types/flight/domain/minirule.types'
import { transformMiniRuleResponse } from '@/types/flight/domain/minirule.types'
import type { TripType } from '@/types/flight/ui/search-form.types'

import { BaggageInfo } from './BaggageInfo'
import { FlightCardBody } from './FlightCardBody'
import { FlightCardFooter } from './FlightCardFooter'
import { FlightCardHeader } from './FlightCardHeader'
import { FlightCardSidebar } from './FlightCardSidebar'
import { FlightSegment } from './FlightSegment'
import { MiniRuleInfo } from './MiniRuleInfo'
import { NoticeInfo } from './NoticeInfo'
import { PriceBreakdown } from './PriceBreakdown'
import { TwoOnewayMobileCard } from './TwoOnewayMobileCard'

interface FlightCardProps {
  offer: FlightOffer
  tripType: TripType
  onSelect?: (offerId: string) => void
  /** For two-oneway: whether this card is selected via radio */
  isSelected?: boolean
  /** For two-oneway: callback when radio is clicked */
  onRadioSelect?: (offerId: string) => void
  /** For two-oneway: callback when fare selection changes */
  onFareSelectionChange?: (offerId: string, selectedFare: string) => void
  /** For two-oneway: currently selected fare */
  initialSelectedFare?: string
}

export function FlightCard({
  offer,
  tripType,
  onSelect,
  isSelected = false,
  onRadioSelect,
  onFareSelectionChange,
  initialSelectedFare,
}: FlightCardProps) {
  const router = useRouter()

  // Initialize with initialSelectedFare for two-oneway, or first available upsell option, or default to 'Basic'
  const defaultFare = initialSelectedFare || offer.upSellOptions?.[0]?.brandName || 'Basic'
  const [selectedFare, setSelectedFare] = useState(defaultFare)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [fareUnavailableModal, setFareUnavailableModal] = useState<{
    open: boolean
    message: string
  }>({ open: false, message: '' })

  // Mini rule state
  const [miniRule, setMiniRule] = useState<TransformedMiniRule | null>(null)
  const [miniRuleLoading, setMiniRuleLoading] = useState(false)
  const [miniRuleError, setMiniRuleError] = useState<string | null>(null)
  const [miniRuleFetched, setMiniRuleFetched] = useState(false)

  // Fare rules state
  const [fareRulesData, setFareRulesData] = useState<FareRulesResponse['response']>(null)
  const [fareRulesLoading, setFareRulesLoading] = useState(false)
  const [fareRulesError, setFareRulesError] = useState<string | null>(null)
  const [fareRulesFetched, setFareRulesFetched] = useState(false)

  // Add state to prevent duplicate API calls
  const [isSelecting, setIsSelecting] = useState(false)

  // Check if this is a two-oneway offer (compact layout for 2-column grid)
  const isTwoOneway = !!offer.twoOnewayIndex
  const hideOperatingCarrier = isDomesticBangladeshOffer(offer)

  const handleSelect = async () => {
    // Prevent duplicate calls if already processing
    if (isSelecting) {
      console.log('⚠️ Select call prevented - already processing')
      return
    }

    setIsSelecting(true)
    console.log('Selected flight:', offer.id, 'Fare:', selectedFare)

    // Find the selected upsell option to get the correct offerId
    const selectedUpSellOption = offer.upSellOptions?.find(
      (option) => option.brandName.toLowerCase() === selectedFare.toLowerCase(),
    )

    // Use the upsell option's id (which contains the offerId) if available, otherwise fall back to main offerId
    const offerIdToUse = selectedUpSellOption?.id || offer.id

    // Show loading state
    const button = document.activeElement as HTMLButtonElement
    if (button?.tagName === 'BUTTON') {
      button.disabled = true
      button.textContent = 'Checking...'
    }

    try {
      // Client-side validation: Check if the selected offer is available
      console.log('🔍 Validating offer:', {
        traceId: offer.traceId,
        offerId: offerIdToUse,
        selectedFare,
        selectedUpSellOption,
        originalOfferId: offer.id,
      })

      const validationResponse = await fetch('/api/flight/offerprice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          traceId: offer.traceId,
          offerId: [offerIdToUse],
        }),
      })

      const validationResult = (await validationResponse.json()) as {
        success: boolean
        error?: { errorMessage?: string }
      }

      console.log('📡 API Response:', validationResult)

      if (validationResult.success) {
        // Store the OfferPrice response to avoid duplicate API call on offer-price page
        try {
          sessionStorage.setItem('offerPriceResponse', JSON.stringify(validationResult))
          sessionStorage.setItem('offerPriceTimestamp', Date.now().toString())
        } catch (error) {
          console.warn('Failed to store OfferPrice response:', error)
        }

        // Offer is available, proceed to redirect
        console.log(
          '✅ Offer available, redirecting to:',
          `/offer-price?traceId=${encodeURIComponent(offer.traceId)}&offerId=${encodeURIComponent(offerIdToUse)}`,
        )
        router.push(
          `/offer-price?traceId=${encodeURIComponent(offer.traceId)}&offerId=${encodeURIComponent(offerIdToUse)}`,
        )

        // Also call the optional onSelect callback if provided
        onSelect?.(offerIdToUse)
      } else {
        // Show themed modal instead of native alert
        console.log('Offer validation: fare unavailable', validationResult)
        setFareUnavailableModal({
          open: true,
          message: validationResult.error?.errorMessage || 'Selected fare option is not available',
        })
        if (button?.tagName === 'BUTTON') {
          button.disabled = false
          button.textContent = 'Select'
        }
      }
    } catch (error) {
      console.error('Error validating offer:', error)
      setFareUnavailableModal({
        open: true,
        message: 'Failed to validate fare availability. Please try again.',
      })
      if (button?.tagName === 'BUTTON') {
        button.disabled = false
        button.textContent = 'Select'
      }
    } finally {
      setIsSelecting(false)
    }
  }

  const closeFareUnavailableModal = useCallback(() => {
    setFareUnavailableModal((prev) => ({ ...prev, open: false }))
  }, [])

  const handleRadioClick = () => {
    onRadioSelect?.(offer.id)
  }

  const handleFareChange = (fare: string) => {
    console.log('Fare changed to:', fare)
    setSelectedFare(fare)
    // For two-oneway flights, notify parent of fare selection change
    onFareSelectionChange?.(offer.id, fare)
  }

  // Use baggage from selected fare option when available (matches sidebar selection)
  const selectedUpSellOption = offer.upSellOptions?.find(
    (option) => option.brandName.toLowerCase() === selectedFare.toLowerCase(),
  )
  const baggageToShow = selectedUpSellOption?.baggage ?? offer.baggage

  // Fetch mini rule data from API
  const fetchMiniRule = useCallback(async () => {
    if (miniRuleFetched || miniRuleLoading) return

    setMiniRuleLoading(true)
    setMiniRuleError(null)

    try {
      const response = await fetch('/api/flight/minirule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          traceId: offer.traceId,
          offerId: offer.id,
        }),
      })

      const data = (await response.json()) as MiniRuleResponse

      if (data.success && data.response?.penalty) {
        const transformed = transformMiniRuleResponse(data)
        setMiniRule(transformed)
      } else {
        setMiniRuleError(data.error?.errorMessage || 'Failed to fetch policy information')
      }
    } catch (error) {
      console.error('Error fetching mini rule:', error)
      setMiniRuleError('Failed to fetch policy information')
    } finally {
      setMiniRuleLoading(false)
      setMiniRuleFetched(true)
    }
  }, [offer.traceId, offer.id, miniRuleFetched, miniRuleLoading])

  const fetchFareRules = useCallback(async () => {
    if (fareRulesFetched || fareRulesLoading) return
    setFareRulesLoading(true)
    setFareRulesError(null)
    setFareRulesFetched(true)
    try {
      const response = await fetch('/api/flight/farerules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traceId: offer.traceId, offerId: offer.id }),
      })
      const data = (await response.json()) as FareRulesResponse
      if (data.success && data.response) {
        setFareRulesData(data.response)
      } else {
        setFareRulesError(data.error?.errorMessage || 'Failed to fetch fare rules')
      }
    } catch (err) {
      console.error('Error fetching fare rules:', err)
      setFareRulesError('Failed to fetch fare rules')
    } finally {
      setFareRulesLoading(false)
    }
  }, [offer.traceId, offer.id, fareRulesFetched, fareRulesLoading])

  const toggleSection = useCallback(
    (section: string) => {
      if ((section === 'cancellation' || section === 'date-change') && !miniRuleFetched) {
        void fetchMiniRule()
      }
      if (section === 'fare-rules' && !fareRulesFetched) {
        void fetchFareRules()
      }
      setExpandedSection(expandedSection === section ? null : section)
    },
    [expandedSection, miniRuleFetched, fetchMiniRule, fareRulesFetched, fetchFareRules],
  )

  const handleSelectClick = useCallback(() => {
    void handleSelect()
  }, [handleSelect])

  // Card border class - match search container (bg + border); highlight when selected for two-oneway
  const cardBorderClass =
    isTwoOneway && isSelected
      ? 'bg-white dark:bg-neutral-950 border-2 border-primary rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden w-full max-w-full ring-2 ring-primary/20'
      : 'bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden w-full max-w-full'

  return (
    <div className={cardBorderClass}>
      {/* Two-oneway: custom mobile layout (<lg) */}
      {isTwoOneway && (
        <div className="lg:hidden">
          <TwoOnewayMobileCard
            offer={offer}
            isSelected={isSelected}
            onRadioClick={handleRadioClick}
          />
        </div>
      )}

      {/* Main layout (regular trips on all sizes, and two-oneway on lg+) */}
      <div
        className={[
          'h-full',
          isTwoOneway ? 'hidden lg:flex flex-col 3xl:flex-row' : 'flex flex-col lg:flex-row',
        ].join(' ')}
      >
        {/* Left Column: Header, Body, Footer */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header: Airline Info + Price (price shown on lg-3xl for two-oneway only) */}
          <FlightCardHeader
            offer={offer}
            showPrice={isTwoOneway}
            showRadio={isTwoOneway}
            isSelected={isSelected}
            onRadioClick={handleRadioClick}
            hideOperatingCarrier={hideOperatingCarrier}
          />

          {/* Body: Route Summary with Times */}
          <FlightCardBody offer={offer} tripType={tripType} />

          {/* Mobile: Sidebar appears here (between Body and Footer) - hidden on lg+ */}
          <div className="lg:hidden">
            <FlightCardSidebar
              offer={offer}
              selectedFare={selectedFare}
              onFareChange={handleFareChange}
              showSelectButton={false}
            />
          </div>

          {/* Footer */}
          <div className="mt-auto">
            <FlightCardFooter
              offer={offer}
              onShowFlightDetails={() => toggleSection('flight-details')}
              onShowFareSummary={() => toggleSection('fare-summary')}
              onShowBaggage={() => toggleSection('baggage')}
              onShowCancellation={() => toggleSection('cancellation')}
              onShowDateChange={() => toggleSection('date-change')}
              onShowFareRules={() => toggleSection('fare-rules')}
              onShowNotice={() => toggleSection('notice')}
              onSelectFare={handleSelectClick}
              showSelectButton={false}
              isTwoOneway={isTwoOneway}
            />
          </div>

          {/* Mobile: Select Button appears after Footer - hidden on lg+ and hidden for two-oneway */}
          {!isTwoOneway && (
            <div className="lg:hidden">
              <button
                onClick={handleSelectClick}
                disabled={isSelecting}
                className="w-full px-4 h-[52px] bg-primary/90 hover:bg-primary active:bg-primary text-white text-sm sm:text-base font-semibold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSelecting ? 'Checking...' : 'Select'}
              </button>
            </div>
          )}
        </div>

        {/* Desktop: Right Sidebar - Full Height with Select Button */}
        {/* For regular trips: show on lg+ (1024px+); for two-oneway: show on 3xl+ (1500px+) */}
        {/* Two-oneway: no Select button in sidebar (selection is by radio toggle) */}
        <div className={isTwoOneway ? 'hidden 3xl:flex' : 'hidden lg:flex'}>
          <FlightCardSidebar
            offer={offer}
            selectedFare={selectedFare}
            onFareChange={handleFareChange}
            showSelectButton={!isTwoOneway}
            onSelect={handleSelectClick}
          />
        </div>
      </div>

      {/* Expandable Content Based on Active Tab */}
      {expandedSection === 'flight-details' && (
        <div className="p-4 bg-primary/5 dark:bg-primary/10 border-t border-primary/40">
          <div className="space-y-4">
            {offer.segments.map((segmentGroup, groupIndex) => {
              const title =
                tripType === 'multicity'
                  ? `Trip ${groupIndex + 1}`
                  : segmentGroup.isReturn
                    ? 'Return'
                    : 'Outbound'

              return (
                <div key={groupIndex} className="space-y-2">
                  {/* Route Summary Header */}
                  <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 pb-1.5">
                    <Plane className="w-3.5 h-3.5" />
                    <span className="font-semibold">
                      {tripType === 'multicity'
                        ? title
                        : `${title} ${segmentGroup.departure.airport} ✈ ${segmentGroup.arrival.airport}`}
                    </span>
                  </div>

                  {/* Flight Segments */}
                  <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800 rounded-lg overflow-hidden">
                    {segmentGroup.segments.map((segment, segIndex) => (
                      <FlightSegment
                        key={segIndex}
                        segment={segment}
                        showLayover={segIndex < segmentGroup.segments.length - 1}
                        isFirst={segIndex === 0}
                        isLast={segIndex === segmentGroup.segments.length - 1}
                        hideOperatingCarrier={hideOperatingCarrier}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {expandedSection === 'fare-summary' && (
        <div className="p-6 bg-primary/5 dark:bg-primary/10 border-t border-primary/40">
          <PriceBreakdown pricing={offer.pricing} />
        </div>
      )}

      {expandedSection === 'baggage' && (
        <div className="p-6 bg-primary/5 dark:bg-primary/10 border-t border-primary/40">
          <BaggageInfo baggage={baggageToShow} />
        </div>
      )}

      {expandedSection === 'fare-rules' && (
        <div className="p-6 bg-primary/5 dark:bg-primary/10 border-t border-primary/40">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fare Rules</h3>
          {fareRulesLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {fareRulesError && !fareRulesLoading && (
            <p className="text-sm text-red-600 dark:text-red-400">{fareRulesError}</p>
          )}
          {!fareRulesLoading &&
            !fareRulesError &&
            fareRulesData &&
            (() => {
              const { items } = getFareRulesDisplayContent(fareRulesData)
              if (items.length === 0) {
                return (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No fare rules available.
                  </p>
                )
              }
              return (
                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-4"
                    >
                      {item.title && (
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          {item.title}
                        </h4>
                      )}
                      <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-sans">
                        {item.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )
            })()}
          {!fareRulesLoading && !fareRulesError && !fareRulesData && fareRulesFetched && (
            <p className="text-sm text-gray-600 dark:text-gray-400">No fare rules available.</p>
          )}
        </div>
      )}

      {expandedSection === 'notice' && (
        <div className="p-6 bg-primary/5 dark:bg-primary/10 border-t border-primary/40">
          <NoticeInfo />
        </div>
      )}

      {expandedSection === 'cancellation' && (
        <div className="p-6 bg-primary/5 dark:bg-primary/10 border-t border-primary/40">
          <MiniRuleInfo
            miniRule={miniRule}
            loading={miniRuleLoading}
            error={miniRuleError}
            type="cancellation"
          />
        </div>
      )}

      {expandedSection === 'date-change' && (
        <div className="p-6 bg-primary/5 dark:bg-primary/10 border-t border-primary/40">
          <MiniRuleInfo
            miniRule={miniRule}
            loading={miniRuleLoading}
            error={miniRuleError}
            type="dateChange"
          />
        </div>
      )}

      <FareUnavailableModal
        open={fareUnavailableModal.open}
        message={fareUnavailableModal.message}
        onClose={closeFareUnavailableModal}
      />
    </div>
  )
}
