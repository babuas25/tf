'use client'

import {
  AlertCircle,
  Check,
  Loader2,
  Plane,
  ArrowRight,
  Briefcase,
  CalendarX,
  RefreshCw,
  ChevronDown,
  FileText,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactCountryFlag from 'react-country-flag'

import { AirlineLogo } from '@/components/flight/shared/AirlineLogo'
import { CountrySelector } from '@/components/shared/CountrySelector'
import { DatePickerDOB } from '@/components/ui/date-picker-dob'
import { SimpleDropdown } from '@/components/ui/simple-dropdown'
import { COUNTRIES, PHONE_COUNTRIES } from '@/constants/countries'
import { getAirportCity } from '@/lib/flight/utils/airport-city-lookup'
import {
  getFareRulesDisplayContent,
  type FareRulesResponse,
} from '@/types/flight/domain/farerules.types'
import type { OfferPriceResponse, DetailedOffer } from '@/types/flight/domain/offerprice.types'

const RECENT_PHONES_KEY = 'tripfeels-recent-phones'
const RECENT_EMAILS_KEY = 'tripfeels-recent-emails'

const MAX_RECENT = 5

function getRecentFromStorage(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string').slice(0, MAX_RECENT)
      : []
  } catch {
    return []
  }
}

function saveRecentToStorage(key: string, value: string, current: string[]): string[] {
  const trimmed = value.trim()
  if (!trimmed) return current
  const next = [trimmed, ...current.filter((v) => v !== trimmed)].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(key, JSON.stringify(next))
  } catch {
    // ignore
  }
  return next
}

export default function OfferPricePage() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [offer, setOffer] = useState<DetailedOffer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'baggage' | 'cancellation' | 'dateChange' | 'fareRules'
  >('baggage')
  const [timeRemaining, setTimeRemaining] = useState(1000) // 16 minutes 40 seconds in seconds
  const [expandedPassenger, setExpandedPassenger] = useState<number | null>(0)
  const [isFlightSummaryExpanded, setIsFlightSummaryExpanded] = useState(true)
  const [passengerData, setPassengerData] = useState<Record<number, Record<string, string>>>({})
  const [passportRequired, setPassportRequired] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [availableSSR, setAvailableSSR] = useState<string[]>([])
  const [seatsAvailable, setSeatsAvailable] = useState(false)
  const [serviceListAvailable, setServiceListAvailable] = useState(false)
  const [hasFetched, setHasFetched] = useState(false) // Prevent multiple API calls
  const [recentPhones, setRecentPhones] = useState<string[]>([])
  const [recentEmails, setRecentEmails] = useState<string[]>([])
  const hasRestoredFromSessionStorage = useRef(false)
  const [fareRulesData, setFareRulesData] = useState<FareRulesResponse['response']>(null)
  const [fareRulesLoading, setFareRulesLoading] = useState(false)
  const [fareRulesError, setFareRulesError] = useState<string | null>(null)
  const [fareRulesFetched, setFareRulesFetched] = useState(false)
  const [responseTraceId, setResponseTraceId] = useState<string | null>(null)

  // Load recent phones/emails from localStorage on mount
  useEffect(() => {
    setRecentPhones(getRecentFromStorage(RECENT_PHONES_KEY))
    setRecentEmails(getRecentFromStorage(RECENT_EMAILS_KEY))
  }, [])

  // Get last arrival date of itinerary (age is calculated from this for all pax types)
  const getLastArrivalDate = () => {
    if (!offer?.paxSegmentList?.length) return new Date()
    const lastSegment = offer.paxSegmentList[offer.paxSegmentList.length - 1]
    if (!lastSegment) return new Date()
    return new Date(lastSegment.paxSegment.arrival.aircraftScheduledDateTime)
  }

  // Passport expiry: valid at least 3 months from last arrival, max 12 years from arrival
  const passportExpiryRange = useMemo(() => {
    const lastArrival = getLastArrivalDate()
    const min = new Date(lastArrival)
    min.setMonth(min.getMonth() + 3)
    const max = new Date(lastArrival)
    max.setFullYear(max.getFullYear() + 12)
    return { minDate: min, maxDate: max }
  }, [offer])

  // Calculate DOB range based on pax type (all ages relative to last arrival date)
  const getDobRange = (paxType: string) => {
    const lastArrivalDate = getLastArrivalDate()
    const today = new Date()

    if (paxType === 'Adult') {
      // Adult: 12+ years old at last arrival
      const maxDate = new Date(lastArrivalDate)
      maxDate.setFullYear(maxDate.getFullYear() - 12)
      return { min: '1900-01-01', max: maxDate.toISOString().split('T')[0] }
    } else if (paxType === 'Child') {
      // Child: from 2 years up to 11 years 11 months 30 days at last arrival
      // min DOB = lastArrival - 12 years + 1 day (so age at last arrival ≤ 11y 11m 30d)
      const minDate = new Date(lastArrivalDate)
      minDate.setFullYear(minDate.getFullYear() - 12)
      minDate.setDate(minDate.getDate() + 1)
      // max DOB = lastArrival - 2 years (so age at last arrival ≥ 2 years)
      const maxDate = new Date(lastArrivalDate)
      maxDate.setFullYear(maxDate.getFullYear() - 2)
      return { min: minDate.toISOString().split('T')[0], max: maxDate.toISOString().split('T')[0] }
    } else if (paxType === 'Infant') {
      // Infant: below 2 years at last arrival (DOB must be less than 2 years from last arrival)
      // min DOB = lastArrival - 2 years + 1 day (so age at last arrival < 2 years)
      const minDate = new Date(lastArrivalDate)
      minDate.setFullYear(minDate.getFullYear() - 2)
      minDate.setDate(minDate.getDate() + 1)
      // max DOB = today (dates ≥ 2 years from last arrival are disabled)
      return { min: minDate.toISOString().split('T')[0], max: today.toISOString().split('T')[0] }
    }
    return { min: '', max: '' }
  }

  // Calculate age from DOB at last arrival date (used for all pax types)
  const calculateAge = (dob: string | undefined, _paxType?: string) => {
    if (!dob) return null
    const birthDate = new Date(dob)
    const referenceDate = getLastArrivalDate()
    let age = referenceDate.getFullYear() - birthDate.getFullYear()
    const m = referenceDate.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && referenceDate.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Get all passengers as flat list
  const getAllPassengers = () => {
    if (!offer) return []
    const passengers: { index: number; paxType: string; paxNumber: number }[] = []
    let globalIndex = 0
    offer.fareDetailList.forEach((fareDetail) => {
      for (let i = 0; i < fareDetail.fareDetail.paxCount; i++) {
        passengers.push({
          index: globalIndex,
          paxType: fareDetail.fareDetail.paxType,
          paxNumber: globalIndex + 1,
        })
        globalIndex++
      }
    })
    return passengers
  }

  // Adult passengers only (for infant "Associated adult passenger" dropdown)
  const adultPassengers = getAllPassengers().filter((p) => p.paxType === 'Adult')

  // Initialize passenger data with default nationality and paxType
  const initializePassenger = (index: number, paxType: string) => {
    if (!passengerData[index] || !passengerData[index].paxType) {
      setPassengerData((prev) => ({
        ...prev,
        [index]: { ...prev[index], nationality: prev[index]?.nationality || 'BD', paxType },
      }))
    }
  }

  const traceId = searchParams.get('traceId')
  // Get all offerId parameters for two-oneway flights
  const offerIds = searchParams.getAll('offerId')
  const offerId = offerIds[0] // Keep first one for backward compatibility with one-way

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const fetchOfferPrice = useCallback(async () => {
    if (!traceId || !offerIds || offerIds.length === 0) {
      setError('Missing required parameters')
      setLoading(false)
      return
    }

    // Prevent multiple API calls
    if (hasFetched) {
      console.log('⏭️ Already fetched, skipping')
      return
    }

    setLoading(true)
    setError(null)
    setHasFetched(true) // Mark as fetched

    // Check for stored OfferPrice response from flight selection
    try {
      const storedResponse = sessionStorage.getItem('offerPriceResponse')
      const storedTimestamp = sessionStorage.getItem('offerPriceTimestamp')

      if (storedResponse && storedTimestamp) {
        const timestamp = parseInt(storedTimestamp)
        const now = Date.now()
        // Use stored response if it's less than 5 minutes old
        if (now - timestamp < 5 * 60 * 1000) {
          console.log('📋 Using stored OfferPrice response')
          const data = JSON.parse(storedResponse) as OfferPriceResponse

          if (
            data.success &&
            data.response &&
            data.response.offersGroup &&
            data.response.offersGroup.length > 0
          ) {
            const offerGroup = data.response.offersGroup[0]
            if (offerGroup) {
              setOffer(offerGroup.offer)
              setResponseTraceId(data.response.traceId ?? traceId ?? null)
              setPassportRequired(data.response.passportRequired || false)
              setAvailableSSR(data.response.availableSSR || [])
              setSeatsAvailable(data.response.seatsAvailable || false)
              setServiceListAvailable(data.response.serviceListAvailable || false)
              setLoading(false)
              // Clear stored response to prevent reuse
              sessionStorage.removeItem('offerPriceResponse')
              sessionStorage.removeItem('offerPriceTimestamp')
              return
            }
          }
        } else {
          // Clear expired stored response
          sessionStorage.removeItem('offerPriceResponse')
          sessionStorage.removeItem('offerPriceTimestamp')
        }
      }
    } catch (error) {
      console.warn('Failed to use stored OfferPrice response:', error)
      // Continue with API call
    }

    const requestBody = {
      traceId,
      offerId: offerIds, // Pass all offer IDs for two-oneway flights
    }

    console.log('🔄 Fetching offer price with:', requestBody)

    try {
      const response = await fetch('/api/flight/offerprice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = (await response.json()) as OfferPriceResponse

      console.log('📡 Offer price response:', data)

      if (
        data.success &&
        data.response &&
        data.response.offersGroup &&
        data.response.offersGroup.length > 0
      ) {
        const offerGroup = data.response.offersGroup[0]
        if (offerGroup) {
          setOffer(offerGroup.offer)
          setResponseTraceId(data.response.traceId ?? traceId ?? null)
          setPassportRequired(data.response.passportRequired || false)
          setAvailableSSR(data.response.availableSSR || [])
          setSeatsAvailable(data.response.seatsAvailable || false)
          setServiceListAvailable(data.response.serviceListAvailable || false)
        }
      } else {
        setError(data.error?.errorMessage || 'Failed to fetch offer details')
      }
    } catch (err) {
      console.error('Error fetching offer price:', err)
      setError('Failed to fetch offer details')
      setHasFetched(false) // Reset on error to allow retry
    } finally {
      setLoading(false)
    }
  }, [traceId, offerIds, hasFetched])

  const fetchFareRules = useCallback(async () => {
    const effectiveTraceId = responseTraceId ?? traceId ?? null
    if (!effectiveTraceId || !offer?.offerId || fareRulesLoading) return
    setFareRulesLoading(true)
    setFareRulesError(null)
    setFareRulesFetched(true)
    try {
      const response = await fetch('/api/flight/farerules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traceId: effectiveTraceId,
          offerId: offer.offerId,
        }),
      })
      let data: FareRulesResponse
      try {
        data = (await response.json()) as FareRulesResponse
      } catch (parseErr) {
        console.error('FareRules response parse error:', parseErr)
        setFareRulesError(`Invalid response (${response.status}). Please try again.`)
        return
      }
      if (data.success && data.response) {
        setFareRulesData(data.response)
      } else {
        const msg =
          data.error?.errorMessage ??
          data.error?.errorCode ??
          (response.ok ? 'No fare rules data' : `Request failed (${response.status})`)
        setFareRulesError(msg)
      }
    } catch (err) {
      console.error('FareRules fetch error:', err)
      setFareRulesError('Failed to fetch fare rules. Please try again.')
    } finally {
      setFareRulesLoading(false)
    }
  }, [responseTraceId, traceId, offer?.offerId, fareRulesLoading])

  useEffect(() => {
    if (activeTab === 'fareRules' && offer && !fareRulesFetched && !fareRulesLoading) {
      void fetchFareRules()
    }
  }, [activeTab, offer, fareRulesFetched, fareRulesLoading, fetchFareRules])

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      // Properly encode the entire callback URL with query parameters
      const offerIdParams = offerIds.map((id) => `offerId=${encodeURIComponent(id)}`).join('&')
      const callbackUrl = `/offer-price?traceId=${encodeURIComponent(traceId ?? '')}&${offerIdParams}`
      void router.push(`/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }

    // Fetch offer price when authenticated and parameters are available, but only once
    if (status === 'authenticated' && traceId && offerIds && offerIds.length > 0 && !hasFetched) {
      void fetchOfferPrice()
    }
  }, [status, traceId, offerIds.length, hasFetched, loading])

  // Initialize all passengers with their paxType when offer loads; restore from sessionStorage when returning from SSR
  useEffect(() => {
    if (!offer) return
    const passengers = getAllPassengers()
    if (passengers.length === 0) return

    if (!hasRestoredFromSessionStorage.current && typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('passengerData')
      const storedTraceId = sessionStorage.getItem('traceId')
      const storedOfferId = sessionStorage.getItem('offerId')
      const sameBooking =
        storedTraceId === traceId &&
        (storedOfferId === offerIds?.[0] ||
          (offerIds?.length && offerIds.includes(storedOfferId ?? '')))
      if (storedData && sameBooking) {
        try {
          const parsed = JSON.parse(storedData) as Record<number, Record<string, string>>
          const merged: Record<number, Record<string, string>> = {}
          passengers.forEach((p) => {
            merged[p.index] = {
              ...parsed[p.index],
              paxType: p.paxType,
              nationality: parsed[p.index]?.nationality || 'BD',
            }
          })
          setPassengerData(merged)
          hasRestoredFromSessionStorage.current = true
          return
        } catch {
          // fall through to default init
        }
      }
      hasRestoredFromSessionStorage.current = true
    }

    const adults = passengers.filter((p) => p.paxType === 'Adult')
    const infants = passengers.filter((p) => p.paxType === 'Infant')
    const initialData: Record<number, Record<string, string>> = {}
    passengers.forEach((passenger) => {
      const base: Record<string, string> = {
        ...passengerData[passenger.index],
        nationality: passengerData[passenger.index]?.nationality || 'BD',
        paxType: passenger.paxType,
      }
      // Default associated adult for infants: first infant -> first adult, etc.
      if (passenger.paxType === 'Infant' && adults.length > 0) {
        const infantPosition = infants.findIndex((p) => p.index === passenger.index)
        const defaultAdultIndex = adults[Math.min(infantPosition, adults.length - 1)]?.index
        if (defaultAdultIndex !== undefined && base.associatedAdultIndex === undefined) {
          base.associatedAdultIndex = String(defaultAdultIndex)
        }
      }
      initialData[passenger.index] = base
    })
    setPassengerData(initialData)
  }, [offer])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading offer details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Error</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600 dark:text-gray-400">No offer details available</p>
      </div>
    )
  }

  // Group segments by journey (outbound/return)
  const outboundSegments = offer.paxSegmentList.filter((s) => !s.paxSegment.returnJourney)
  const returnSegments = offer.paxSegmentList.filter((s) => s.paxSegment.returnJourney)

  // Helper function to render flight segment
  const renderFlightSegment = (segments: typeof outboundSegments, title: string) => {
    if (segments.length === 0) return null

    return (
      <div className="mb-3 last:mb-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 sm:mb-4">
          {title}
        </h3>
        {/* Airline Info Header - More compact on small screens */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
          <AirlineLogo
            airlineId={segments[0]?.paxSegment.marketingCarrierInfo.carrierDesigCode || ''}
            size={48}
            className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14"
          />
          <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {segments[0]?.paxSegment.marketingCarrierInfo.carrierName}
              </span>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span>
                  {segments[0]?.paxSegment.marketingCarrierInfo.carrierDesigCode}{' '}
                  {segments[0]?.paxSegment.flightNumber}
                </span>
                <span className="hidden sm:inline">
                  {segments[0]?.paxSegment.iatA_AircraftType.iatA_AircraftTypeCode}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {segments[0]?.paxSegment.cabinType}-{segments[0]?.paxSegment.rbd}
            </div>
          </div>
        </div>

        {/* Flight Card Layout - Horizontal Design for both Mobile and Desktop */}
        <div className="space-y-3 sm:space-y-0">
          {/* Horizontal Layout - Three Column Design */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
            {/* Left Column - Departure */}
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">
                FROM {segments[0]?.paxSegment.departure.iatA_LocationCode}
              </div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {new Date(
                  segments[0]?.paxSegment.departure.aircraftScheduledDateTime || '',
                ).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1">
                {getAirportCity(segments[0]?.paxSegment.departure.iatA_LocationCode)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(
                  segments[0]?.paxSegment.departure.aircraftScheduledDateTime || '',
                ).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </div>

            {/* Middle Column - Flight Info */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {Math.floor(parseInt(segments[0]?.paxSegment.duration || '0') / 60)}h{' '}
                {parseInt(segments[0]?.paxSegment.duration || '0') % 60}m
              </div>
              <div className="flex items-center w-full gap-2">
                <div className="flex-1 h-px border-t border-dashed border-gray-300 dark:border-gray-600"></div>
                <Plane className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 h-px border-t border-dashed border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                {segments.length === 1
                  ? 'Non-Stop'
                  : `${segments.length - 1} Stop${segments.length > 2 ? 's' : ''}`}
              </div>
              {segments.length > 1 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">Layover</div>
              )}
            </div>

            {/* Right Column - Arrival */}
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">
                TO {segments[segments.length - 1]?.paxSegment.arrival.iatA_LocationCode}
              </div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {new Date(
                  segments[segments.length - 1]?.paxSegment.arrival.aircraftScheduledDateTime || '',
                ).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1">
                {getAirportCity(
                  segments[segments.length - 1]?.paxSegment.arrival.iatA_LocationCode,
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(
                  segments[segments.length - 1]?.paxSegment.arrival.aircraftScheduledDateTime || '',
                ).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-white dark:bg-black pt-14 overflow-y-auto overflow-x-hidden z-40 sm:relative sm:inset-auto sm:w-full sm:h-auto sm:pt-24 sm:min-h-[calc(100vh-3.5rem)] sm:z-auto">
      <datalist id="recent-phones">
        {recentPhones.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <datalist id="recent-emails">
        {recentEmails.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>

      <div className="w-full sm:max-w-4xl sm:mx-auto px-0 sm:px-4 py-0 sm:py-6 space-y-0 sm:space-y-4">
        {/* Progress Stepper */}
        <div className="mb-0 sm:mb-6 px-3 sm:px-0 py-3 bg-white sm:bg-transparent border-b border-gray-200/80 dark:border-white/10 sm:border-0">
          <div className="flex items-center justify-between w-full max-w-none xs:max-w-2xl mx-auto">
            {/* Step 1 - Active */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold mb-1 sm:mb-2 text-xs sm:text-base">
                1
              </div>
              <span className="text-[9px] xs:text-[10px] sm:text-xs font-medium text-primary truncate">
                Itinerary
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 mx-1 xs:mx-2 sm:mx-4 mt-[-14px] xs:mt-[-16px] sm:mt-[-24px]" />

            {/* Step 2 */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-10 sm:h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-semibold mb-1 sm:mb-2 text-xs sm:text-base">
                2
              </div>
              <span className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                SSR
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 mx-1 xs:mx-2 sm:mx-4 mt-[-14px] xs:mt-[-16px] sm:mt-[-24px]" />

            {/* Step 3 */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-10 sm:h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-semibold mb-1 sm:mb-2 text-xs sm:text-base">
                3
              </div>
              <span className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden xs:inline truncate">
                Review
              </span>
              <span className="text-[9px] text-gray-500 dark:text-gray-400 xs:hidden truncate">
                Rev
              </span>
            </div>
          </div>
        </div>

        {/* Mobile-First Single Column Layout */}
        <div className="space-y-3 sm:space-y-4">
          {/* 1. Itinerary Card - Expandable (matches FlightSearchInterface search button container) */}
          <div className="bg-white dark:bg-neutral-950 border-0 sm:border sm:rounded-lg shadow-none sm:shadow-sm overflow-hidden">
            {/* Header - Always visible */}
            <button
              onClick={() => setIsFlightSummaryExpanded(!isFlightSummaryExpanded)}
              className="w-full px-3 py-3 sm:p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Itinerary
              </h2>
              <ChevronDown
                className={`w-5 h-5 text-primary transition-transform ${isFlightSummaryExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Content - Collapsible */}
            {isFlightSummaryExpanded && (
              <div className="p-3 sm:p-6">
                {/* Outbound Journey */}
                {renderFlightSegment(outboundSegments, 'Outbound Journey')}

                {/* Return Journey */}
                {returnSegments.length > 0 && renderFlightSegment(returnSegments, 'Return Journey')}
              </div>
            )}
          </div>

          {/* 3. Traveller Details Card (matches FlightSearchInterface search button container) */}
          <div className="bg-white dark:bg-neutral-950 border-0 border-t border-gray-200/80 dark:border-white/10 sm:border sm:rounded-lg shadow-none sm:shadow-sm overflow-hidden">
            <div className="p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Traveller Details
              </h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getAllPassengers().map((passenger) => {
                const isExpanded = expandedPassenger === passenger.index
                const paxData = passengerData[passenger.index] || {}
                const isFilled =
                  paxData.firstName && paxData.lastName && paxData.dob && paxData.gender
                const dobRange = getDobRange(passenger.paxType)
                const age = calculateAge(paxData.dob, passenger.paxType)

                // Initialize with default nationality and paxType when expanding
                if (isExpanded && (!paxData.nationality || !paxData.paxType)) {
                  initializePassenger(passenger.index, passenger.paxType)
                }

                return (
                  <div key={passenger.index} className="bg-white dark:bg-neutral-950">
                    {/* Passenger Header - Always visible */}
                    <button
                      onClick={() => setExpandedPassenger(isExpanded ? null : passenger.index)}
                      className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Passenger {passenger.paxNumber} {passenger.paxType}
                        </span>
                        {passenger.paxType === 'Child' && age !== null && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Age: {age}
                          </span>
                        )}
                        {isFilled && (
                          <span className="text-green-600 dark:text-green-400 text-xs">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
                          Select Traveller From List
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 sm:w-5 sm:h-5 text-primary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>

                    {/* Passenger Form - Collapsible */}
                    {isExpanded && (
                      <div className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-4 sm:space-y-4">
                          <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Given Name/First Name <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="FIRST NAME"
                                  className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent uppercase text-sm"
                                  value={paxData.firstName || ''}
                                  onChange={(e) => {
                                    const value = e.target.value
                                      .replace(/[^a-zA-Z\s]/g, '')
                                      .toUpperCase()
                                    setPassengerData({
                                      ...passengerData,
                                      [passenger.index]: { ...paxData, firstName: value },
                                    })
                                  }}
                                />
                                {paxData.firstName && (
                                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform pointer-events-none" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                If your passport contains only a last name, please leave the "First
                                Name" input box empty.
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Surname/Last Name <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="LAST NAME"
                                  className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent uppercase text-sm"
                                  value={paxData.lastName || ''}
                                  onChange={(e) => {
                                    const value = e.target.value
                                      .replace(/[^a-zA-Z\s]/g, '')
                                      .toUpperCase()
                                    setPassengerData({
                                      ...passengerData,
                                      [passenger.index]: { ...paxData, lastName: value },
                                    })
                                  }}
                                />
                                {paxData.lastName && (
                                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform pointer-events-none" />
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date of Birth <span className="text-red-500">*</span>
                              </label>
                              <DatePickerDOB
                                value={paxData.dob || undefined}
                                onChange={(date) =>
                                  setPassengerData({
                                    ...passengerData,
                                    [passenger.index]: { ...paxData, dob: date || '' },
                                  })
                                }
                                placeholder="Select date"
                                {...(dobRange.min && { minDate: new Date(dobRange.min) })}
                                {...(dobRange.max && { maxDate: new Date(dobRange.max) })}
                                {...(dobRange.max && { defaultMonth: new Date(dobRange.max) })}
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {passenger.paxType === 'Adult' && '12+ years at last arrival'}
                                {passenger.paxType === 'Child' &&
                                  '2 years up to 11 years 11 months 30 days at last arrival'}
                                {passenger.paxType === 'Infant' && 'Under 2 years at last arrival'}
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Gender <span className="text-red-500">*</span>
                              </label>
                              <div className="flex gap-4 py-2">
                                <label className="flex items-center cursor-pointer gap-2">
                                  <input
                                    type="radio"
                                    name={`gender-${passenger.index}`}
                                    value="Male"
                                    checked={paxData.gender === 'Male'}
                                    onChange={(e) =>
                                      setPassengerData({
                                        ...passengerData,
                                        [passenger.index]: { ...paxData, gender: e.target.value },
                                      })
                                    }
                                    className="peer sr-only"
                                  />
                                  <span
                                    className="flex h-4 w-4 shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-500 transition-colors peer-checked:border-primary peer-checked:bg-primary"
                                    aria-hidden
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Male
                                  </span>
                                </label>
                                <label className="flex items-center cursor-pointer gap-2">
                                  <input
                                    type="radio"
                                    name={`gender-${passenger.index}`}
                                    value="Female"
                                    checked={paxData.gender === 'Female'}
                                    onChange={(e) =>
                                      setPassengerData({
                                        ...passengerData,
                                        [passenger.index]: { ...paxData, gender: e.target.value },
                                      })
                                    }
                                    className="peer sr-only"
                                  />
                                  <span
                                    className="flex h-4 w-4 shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-500 transition-colors peer-checked:border-primary peer-checked:bg-primary"
                                    aria-hidden
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Female
                                  </span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nationality <span className="text-red-500">*</span>
                              </label>
                              <CountrySelector
                                value={paxData.nationality || 'BD'}
                                onChange={(value) =>
                                  setPassengerData({
                                    ...passengerData,
                                    [passenger.index]: { ...paxData, nationality: value },
                                  })
                                }
                                countries={COUNTRIES}
                                placeholder="Select nationality"
                                type="nationality"
                              />
                            </div>
                          </div>

                          {/* Associated adult passenger - Infants only */}
                          {passenger.paxType === 'Infant' && adultPassengers.length > 0 && (
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Associated adult passenger <span className="text-red-500">*</span>
                              </label>
                              <SimpleDropdown
                                id={`associated-adult-${passenger.index}`}
                                value={paxData.associatedAdultIndex ?? ''}
                                onChange={(value) =>
                                  setPassengerData({
                                    ...passengerData,
                                    [passenger.index]: { ...paxData, associatedAdultIndex: value },
                                  })
                                }
                                placeholder="Select adult passenger"
                                options={[
                                  { value: '', label: 'Select adult passenger' },
                                  ...adultPassengers.map((adult) => {
                                    const ad = passengerData[adult.index] || {}
                                    const label =
                                      [ad.firstName, ad.lastName]
                                        .filter(Boolean)
                                        .join(' ')
                                        .trim() || `Passenger ${adult.paxNumber}`
                                    return { value: String(adult.index), label }
                                  }),
                                ]}
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                One adult can only be associated with one infant. Select the adult
                                who will accompany this infant.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Passport Information */}
                        {passportRequired && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              Passport Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Passport Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="PASSPORT NUMBER"
                                    className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent uppercase text-sm"
                                    value={paxData.passportNumber || ''}
                                    onChange={(e) =>
                                      setPassengerData({
                                        ...passengerData,
                                        [passenger.index]: {
                                          ...paxData,
                                          passportNumber: e.target.value.toUpperCase(),
                                        },
                                      })
                                    }
                                  />
                                  {paxData.passportNumber && (
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform pointer-events-none" />
                                  )}
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Passport Expiry Date <span className="text-red-500">*</span>
                                </label>
                                <DatePickerDOB
                                  value={paxData.passportExpiry || undefined}
                                  onChange={(date) =>
                                    setPassengerData({
                                      ...passengerData,
                                      [passenger.index]: { ...paxData, passportExpiry: date || '' },
                                    })
                                  }
                                  placeholder="Select date"
                                  minDate={passportExpiryRange.minDate}
                                  maxDate={passportExpiryRange.maxDate}
                                  defaultMonth={passportExpiryRange.minDate}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Passport must be valid at least 3 months from last arrival. Select
                                  between 3 months and 12 years after last segment arrival.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Contact Information - Only for first passenger */}
                        {passenger.index === 0 && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              Contact Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                  {paxData.phone ? (
                                    // Show display with dropdown arrow when phone is filled
                                    <div className="w-32 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {PHONE_COUNTRIES.find(
                                          (c) => c.phoneCode === (paxData.phoneCode || '+880'),
                                        ) && (
                                          <ReactCountryFlag
                                            countryCode={
                                              PHONE_COUNTRIES.find(
                                                (c) =>
                                                  c.phoneCode === (paxData.phoneCode || '+880'),
                                              )?.code || 'BD'
                                            }
                                            svg
                                            style={{ width: '1.25rem', height: '1.25rem' }}
                                          />
                                        )}
                                        <span className="text-sm">
                                          {paxData.phoneCode || '+880'}
                                        </span>
                                      </div>
                                      <ChevronDown className="w-4 h-4 text-gray-400 transition-transform" />
                                    </div>
                                  ) : (
                                    <CountrySelector
                                      value={paxData.phoneCode || '+880'}
                                      onChange={(value) =>
                                        setPassengerData({
                                          ...passengerData,
                                          [passenger.index]: { ...paxData, phoneCode: value },
                                        })
                                      }
                                      countries={PHONE_COUNTRIES}
                                      placeholder="Code"
                                      type="phone"
                                      className="w-32"
                                    />
                                  )}
                                  <div className="flex-1 relative">
                                    <input
                                      type="tel"
                                      placeholder="01XXXXXXXXX"
                                      className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                      value={paxData.phone || ''}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '')
                                        setPassengerData({
                                          ...passengerData,
                                          [passenger.index]: { ...paxData, phone: value },
                                        })
                                      }}
                                      onBlur={(e) => {
                                        const v = e.target.value.trim()
                                        if (v)
                                          setRecentPhones((prev) =>
                                            saveRecentToStorage(RECENT_PHONES_KEY, v, prev),
                                          )
                                      }}
                                    />
                                    {paxData.phone && (
                                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform pointer-events-none" />
                                    )}
                                    {paxData.phone && paxData.phone.length < 10 && (
                                      <p className="text-xs text-red-500 mt-1">
                                        Phone number must be at least 10 digits
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="email"
                                    placeholder="example@email.com"
                                    className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                    value={paxData.email || ''}
                                    onChange={(e) => {
                                      const value = e.target.value.trim()
                                      setPassengerData({
                                        ...passengerData,
                                        [passenger.index]: { ...paxData, email: value },
                                      })
                                    }}
                                    onBlur={(e) => {
                                      const v = e.target.value.trim()
                                      if (v)
                                        setRecentEmails((prev) =>
                                          saveRecentToStorage(RECENT_EMAILS_KEY, v, prev),
                                        )
                                    }}
                                  />
                                  {paxData.email && (
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform pointer-events-none" />
                                  )}
                                  {paxData.email &&
                                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paxData.email) && (
                                      <p className="text-xs text-red-500 mt-1">
                                        Please enter a valid email address
                                      </p>
                                    )}
                                </div>
                              </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer has-[:checked]:[&_.offer-price-check-icon]:opacity-100">
                              <input type="checkbox" className="sr-only peer" />
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 peer-checked:border-primary peer-checked:bg-primary transition-colors relative">
                                <Check
                                  className="offer-price-check-icon h-3 w-3 text-white opacity-0 absolute pointer-events-none"
                                  strokeWidth={3}
                                />
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Add an optional phone number
                              </span>
                            </label>
                          </div>
                        )}

                        {/* Save Traveller */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <label className="flex items-center gap-3 cursor-pointer has-[:checked]:[&_.offer-price-check-icon]:opacity-100">
                            <input type="checkbox" className="sr-only peer" />
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 peer-checked:border-primary peer-checked:bg-primary transition-colors relative">
                              <Check
                                className="offer-price-check-icon h-3 w-3 text-white opacity-0 absolute pointer-events-none"
                                strokeWidth={3}
                              />
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Save this to my Traveller list
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2. Policy Section - Separate Card (matches FlightSearchInterface search button container) */}
          <div className="bg-white dark:bg-neutral-950 border-0 border-t border-gray-200/80 dark:border-white/10 sm:border sm:rounded-lg shadow-none sm:shadow-sm overflow-hidden">
            <div className="p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Policy</h3>
            </div>

            <div className="p-3 sm:p-6">
              {/* Tabs */}
              <div className="flex gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('baggage')}
                  className={`pb-3 px-2 sm:px-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'baggage'
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Baggage</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('cancellation')}
                  className={`pb-3 px-2 sm:px-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'cancellation'
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <CalendarX className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Cancellation</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('dateChange')}
                  className={`pb-3 px-2 sm:px-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'dateChange'
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Date Change</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('fareRules')}
                  className={`pb-3 px-2 sm:px-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'fareRules'
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Fare Rules</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'baggage' && (
                <div className="space-y-3">
                  {offer.baggageAllowanceList.map((baggage, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          Sector
                        </span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {baggage.baggageAllowance.departure}
                        </span>
                        <Plane className="w-3 h-3 text-gray-400" />
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {baggage.baggageAllowance.arrival}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Checkin
                          </span>
                          <span className="text-xs sm:text-sm text-gray-900 dark:text-white ml-2">
                            {baggage.baggageAllowance.checkIn[0]?.allowance || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Cabin
                          </span>
                          <span className="text-xs sm:text-sm text-gray-900 dark:text-white ml-2">
                            {baggage.baggageAllowance.cabin[0]?.allowance || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'cancellation' && (
                <div className="space-y-4">
                  {offer.penalty.refundPenaltyList.map((penalty, idx) => (
                    <div key={idx}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {penalty.refundPenalty.departure}
                        </span>
                        <Plane className="w-3 h-3 text-gray-400" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {penalty.refundPenalty.arrival}
                        </span>
                      </div>
                      {penalty.refundPenalty.penaltyInfoList.map((info, infoIdx) => (
                        <div
                          key={infoIdx}
                          className="ml-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                        >
                          <p className="font-medium mb-1">{info.penaltyInfo.type}</p>
                          {info.penaltyInfo.textInfoList.map((text, textIdx) => (
                            <p key={textIdx}>
                              {text.textInfo.paxType}: {text.textInfo.info.join(', ')}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'dateChange' && (
                <div className="space-y-4">
                  {offer.penalty.exchangePenaltyList.map((penalty, idx) => (
                    <div key={idx}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {penalty.exchangePenalty.departure}
                        </span>
                        <Plane className="w-3 h-3 text-gray-400" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {penalty.exchangePenalty.arrival}
                        </span>
                      </div>
                      {penalty.exchangePenalty.penaltyInfoList.map((info, infoIdx) => (
                        <div
                          key={infoIdx}
                          className="ml-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                        >
                          <p className="font-medium mb-1">{info.penaltyInfo.type}</p>
                          {info.penaltyInfo.textInfoList.map((text, textIdx) => (
                            <p key={textIdx}>
                              {text.textInfo.paxType}: {text.textInfo.info.join(', ')}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'fareRules' && (
                <div className="space-y-4">
                  {fareRulesLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                  {fareRulesError && !fareRulesLoading && (
                    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
                        <p className="text-sm text-red-700 dark:text-red-300">{fareRulesError}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFareRulesError(null)
                          setFareRulesFetched(false)
                        }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                  {!fareRulesLoading &&
                    !fareRulesError &&
                    fareRulesData &&
                    (() => {
                      const { items } = getFareRulesDisplayContent(fareRulesData)
                      if (items.length === 0) {
                        return (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            No fare rules information available for this offer.
                          </p>
                        )
                      }
                      return (
                        <div className="space-y-4">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-4"
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No fare rules information available for this offer.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. Select SSR Button - Centered, Full Width */}
          <button
            onClick={() => {
              // Validate all passengers data
              const errors: string[] = []
              const passengers = getAllPassengers()

              passengers.forEach((pax) => {
                const paxData = passengerData[pax.index]
                const passengerLabel = `Passenger ${pax.paxNumber} (${pax.paxType})`

                if (!paxData?.firstName || paxData.firstName.trim() === '') {
                  errors.push(`${passengerLabel}: First name is required`)
                }
                if (!paxData?.lastName || paxData.lastName.trim() === '') {
                  errors.push(`${passengerLabel}: Last name is required`)
                }
                if (!paxData?.dob) {
                  errors.push(`${passengerLabel}: Date of birth is required`)
                } else {
                  // Validate DOB is within allowed range for pax type
                  const dobRange = getDobRange(pax.paxType)
                  const dob = new Date(paxData.dob)
                  if (dobRange.min && dobRange.max) {
                    const minDate = new Date(dobRange.min)
                    const maxDate = new Date(dobRange.max)
                    if (dob < minDate || dob > maxDate) {
                      if (pax.paxType === 'Adult') {
                        errors.push(`${passengerLabel}: Must be 12+ years old at last arrival`)
                      } else if (pax.paxType === 'Child') {
                        errors.push(
                          `${passengerLabel}: Must be 2 years up to 11 years 11 months 30 days at last arrival`,
                        )
                      } else if (pax.paxType === 'Infant') {
                        errors.push(`${passengerLabel}: Must be under 2 years old at last arrival`)
                      }
                    }
                  }
                }
                if (!paxData?.gender) {
                  errors.push(`${passengerLabel}: Gender is required`)
                }
                if (!paxData?.nationality) {
                  errors.push(`${passengerLabel}: Nationality is required`)
                }
                // Infants: require associated adult and that adult has name
                if (pax.paxType === 'Infant') {
                  const assocIndex = paxData?.associatedAdultIndex
                  if (assocIndex === undefined || assocIndex === '') {
                    errors.push(`${passengerLabel}: Associated adult passenger is required`)
                  } else {
                    const adultData = passengerData[Number(assocIndex)]
                    if (!adultData?.firstName?.trim() || !adultData?.lastName?.trim()) {
                      errors.push(
                        `${passengerLabel}: Please complete the associated adult's name first (Passenger ${Number(assocIndex) + 1})`,
                      )
                    }
                  }
                }

                if (passportRequired) {
                  if (!paxData?.passportNumber || paxData.passportNumber.trim() === '') {
                    errors.push(`${passengerLabel}: Passport number is required`)
                  }
                  if (!paxData?.passportExpiry) {
                    errors.push(`${passengerLabel}: Passport expiry date is required`)
                  }
                }

                // Validate contact info for first passenger
                if (pax.index === 0) {
                  if (!paxData?.phone || paxData.phone.trim() === '') {
                    errors.push(`${passengerLabel}: Phone number is required`)
                  }
                  if (!paxData?.email || paxData.email.trim() === '') {
                    errors.push(`${passengerLabel}: Email is required`)
                  }
                }
              })

              if (errors.length > 0) {
                setValidationErrors(errors)
                // Scroll to errors
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                setValidationErrors([])
                // All validation passed - store data and proceed
                console.log('✅ All passengers data validated:', passengerData)

                // Store all data in sessionStorage for SSR page
                sessionStorage.setItem('passengerData', JSON.stringify(passengerData))
                sessionStorage.setItem('offerId', offerId || '')
                sessionStorage.setItem('traceId', traceId || '')
                sessionStorage.setItem('availableSSR', JSON.stringify(availableSSR))
                sessionStorage.setItem('seatsAvailable', JSON.stringify(seatsAvailable))
                sessionStorage.setItem('serviceListAvailable', JSON.stringify(serviceListAvailable))
                sessionStorage.setItem('passportRequired', JSON.stringify(passportRequired))

                // Store offer details for Review & Book page
                if (offer) {
                  sessionStorage.setItem(
                    'offerDetails',
                    JSON.stringify({
                      currency: offer.price.totalPayable.curreny,
                      totalPrice: offer.price.totalPayable.total,
                      paxSegmentList: offer.paxSegmentList,
                      fareDetailList: offer.fareDetailList,
                    }),
                  )
                }

                // Navigate to SSR page
                router.push(`/ssr?traceId=${traceId}&offerId=${offerId}`)
              }
            }}
            className="w-full px-3 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-base"
          >
            Select SSR
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* 5. Page Expiry Timer Card (matches FlightSearchInterface search button container) */}
          <div className="bg-white dark:bg-neutral-950 border-0 border-t border-gray-200/80 dark:border-white/10 sm:border sm:rounded-lg shadow-none sm:shadow-sm p-3 sm:p-6">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">This page will expires in</span>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-primary text-center mb-2">
              {formatTime(timeRemaining)}
            </div>
            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000"
                style={{ width: `${(timeRemaining / 1000) * 100}%` }}
              />
            </div>
          </div>

          {/* 6. Fare Summary Card (matches FlightSearchInterface search button container) */}
          <div className="bg-white dark:bg-neutral-950 border-0 border-t border-gray-200/80 dark:border-white/10 sm:border sm:rounded-lg shadow-none sm:shadow-sm p-3 sm:p-6">
            <div className="flex items-center gap-2 text-primary mb-4">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Fare Summary
              </h3>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {/* Passenger */}
              <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Passenger
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  Adult
                </span>
              </div>

              {/* Base Fare */}
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Base Fare
                </span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                  BDT {offer.fareDetailList[0]?.fareDetail.baseFare.toLocaleString() || 0}
                </span>
              </div>

              {/* Taxes */}
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Taxes</span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                  BDT {offer.fareDetailList[0]?.fareDetail.tax.toLocaleString() || 0}
                </span>
              </div>

              {/* Other Charge */}
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Other Charge
                </span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                  BDT {offer.fareDetailList[0]?.fareDetail.otherFee || 0}
                </span>
              </div>

              {/* Discount */}
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Discount
                </span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                  BDT {offer.fareDetailList[0]?.fareDetail.discount.toLocaleString() || 0}
                </span>
              </div>

              {/* Pax Count */}
              <div className="flex justify-between pb-2 sm:pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Pax count
                </span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                  {offer.fareDetailList[0]?.fareDetail.paxCount || 1}
                </span>
              </div>

              {/* Total AIT & VAT */}
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Total AIT & VAT
                </span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                  BDT {offer.price.totalVAT.total.toLocaleString()}
                </span>
              </div>

              {/* Total Discount */}
              <div className="flex justify-between pb-2 sm:pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Total Discount
                </span>
                <span className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                  -BDT {offer.price.discount.total.toLocaleString()}
                </span>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between pt-2">
                <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  Grand Total
                </span>
                <span className="text-sm sm:text-base font-bold text-primary">
                  BDT {offer.price.totalPayable.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 7. Service Fee Card (matches FlightSearchInterface search button container) */}
          <div className="bg-white dark:bg-neutral-950 border-0 border-t border-gray-200/80 dark:border-white/10 sm:border sm:rounded-lg shadow-none sm:shadow-sm p-3 sm:p-6">
            <div className="flex items-center gap-2 text-primary mb-4">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Service Fee
              </h3>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Void Fee
                </span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white">BDT 250</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Refund Fee
                </span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white">BDT 250</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Exchange Fee
                </span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white">BDT 250</span>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-0 border-t border-red-200 dark:border-red-800 sm:border sm:rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                    Please complete the following:
                  </h4>
                  <ul className="list-disc list-inside text-xs sm:text-sm text-red-700 dark:text-red-400 space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
