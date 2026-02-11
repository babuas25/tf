'use client'

import {
  AlertCircle,
  Loader2,
  Plane,
  ArrowLeft,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Briefcase,
  UtensilsCrossed,
  Armchair,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import ReactCountryFlag from 'react-country-flag'

import { AirlineLogo } from '@/components/flight/shared/AirlineLogo'
import { CountrySelector } from '@/components/shared/CountrySelector'
import { PHONE_COUNTRIES } from '@/constants/countries'

// Common SSR codes from docs; actual valid codes should come from offer-specific availableSSR.
const FALLBACK_SSR_CODES = ['WCHR', 'VIP', 'VVIP', 'CIP', 'MAAS', 'FQTV']

interface PassengerData {
  firstName: string
  lastName: string
  gender: string
  dob: string
  nationality: string
  paxType: string
  passportNumber?: string
  passportExpiry?: string
  [key: string]: string | undefined
}

interface OfferDetails {
  currency: string
  totalPrice: number
  paxSegmentList: Array<{
    paxSegment: {
      departure: {
        iatA_LocationCode: string
        aircraftScheduledDateTime: string
      }
      arrival: {
        iatA_LocationCode: string
        aircraftScheduledDateTime: string
      }
      operatingCarrierInfo: {
        carrierDesigCode: string
        carrierName: string
        operatingCarrierFlightNumberText: string
      }
      marketingCarrierInfo: {
        carrierDesigCode: string
        carrierName: string
        marketingCarrierFlightNumberText: string
      }
    }
  }>
  fareDetailList: Array<{
    fareDetail: {
      paxType: string
      paxCount: number
      baseFare: number
      tax: number
      otherFee: number
      discount: number
      vat: number
      total: number
      currency: string
    }
  }>
}

interface SSRSelection {
  code: string
  remark: string
  ffNumber?: string
}

interface OrderSellResponse {
  success: boolean
  requestedOn?: string
  respondedOn?: string
  response?: {
    offerChangeInfo?: Record<string, unknown>
    offersGroup?: Array<{
      offer?: {
        totalPrice?: number
      }
    }>
    pnr?: string
    orderReference?: string
    orderStatus?: string
    [key: string]: unknown
  }
  error?: {
    errorMessage?: string
  }
  message?: string
}

const ORDER_RESPONSE_STORAGE_KEY = 'orderCreateResponse'
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

export default function ReviewBookPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Contact information
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+880')
  const [recentPhones, setRecentPhones] = useState<string[]>([])
  const [recentEmails, setRecentEmails] = useState<string[]>([])

  // Data from sessionStorage
  const [passengerData, setPassengerData] = useState<Record<number, PassengerData>>({})
  const [offerDetails, setOfferDetails] = useState<OfferDetails | null>(null)
  const [availableSSR, setAvailableSSR] = useState<string[]>([])
  const [selectedSSR, setSelectedSSR] = useState<Record<number, SSRSelection[]>>({})
  const [selectedSeats, setSelectedSeats] = useState<Record<number, string>>({})
  const [selectedMeals, setSelectedMeals] = useState<Record<number, string[]>>({})
  const [selectedBaggage, setSelectedBaggage] = useState<Record<number, string[]>>({})
  const [passportRequired, setPassportRequired] = useState(false)

  // UI state
  const [expandedSections, setExpandedSections] = useState({
    passengers: true,
    flights: true,
    addons: false,
    contact: true,
  })
  const [priceChanged, setPriceChanged] = useState(false)
  const [newPrice, setNewPrice] = useState<number | null>(null)

  const traceId = searchParams.get('traceId')
  const offerId = searchParams.get('offerId')

  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = `/review-book?traceId=${traceId ?? ''}&offerId=${offerId ?? ''}`
      void router.push(`/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }

    if (status === 'authenticated') {
      // Load data from sessionStorage
      const storedPassengerData = sessionStorage.getItem('passengerData')
      const storedOfferDetails = sessionStorage.getItem('offerDetails')
      const storedSelectedSSR = sessionStorage.getItem('selectedSSR')
      const storedAvailableSSR = sessionStorage.getItem('availableSSR')
      const storedSelectedSeats = sessionStorage.getItem('selectedSeats')
      const storedSelectedMeals = sessionStorage.getItem('selectedMeals')
      const storedSelectedBaggage = sessionStorage.getItem('selectedBaggage')
      const storedPassportRequired = sessionStorage.getItem('passportRequired')

      if (storedPassengerData) {
        setPassengerData(JSON.parse(storedPassengerData) as Record<number, PassengerData>)
      }
      if (storedOfferDetails) {
        setOfferDetails(JSON.parse(storedOfferDetails) as OfferDetails)
      }
      if (storedSelectedSSR) {
        setSelectedSSR(JSON.parse(storedSelectedSSR) as Record<number, SSRSelection[]>)
      }
      if (storedAvailableSSR) {
        setAvailableSSR(JSON.parse(storedAvailableSSR) as string[])
      }
      if (storedSelectedSeats) {
        setSelectedSeats(JSON.parse(storedSelectedSeats) as Record<number, string>)
      }
      if (storedSelectedMeals) {
        setSelectedMeals(JSON.parse(storedSelectedMeals) as Record<number, string[]>)
      }
      if (storedSelectedBaggage) {
        setSelectedBaggage(JSON.parse(storedSelectedBaggage) as Record<number, string[]>)
      }
      if (storedPassportRequired) {
        setPassportRequired(JSON.parse(storedPassportRequired) as boolean)
      }

      // Pre-fill contact information from offer-price page
      if (storedPassengerData) {
        const parsedPassengerData = JSON.parse(storedPassengerData) as Record<number, PassengerData>
        // Get contact info from the first passenger (index 0)
        const firstPassengerData = parsedPassengerData[0]
        if (firstPassengerData) {
          if (firstPassengerData.email && !contactEmail) {
            setContactEmail(firstPassengerData.email)
          }
          if (firstPassengerData.phone && !contactPhone) {
            setContactPhone(firstPassengerData.phone)
          }
          if (firstPassengerData.phoneCode && countryCode === '+880') {
            setCountryCode(firstPassengerData.phoneCode)
          }
        }
      }

      setLoading(false)
    }
  }, [status, traceId, offerId, router, contactEmail, contactPhone, countryCode])

  // Load recent phones/emails from localStorage for auto-suggest
  useEffect(() => {
    setRecentPhones(getRecentFromStorage(RECENT_PHONES_KEY))
    setRecentEmails(getRecentFromStorage(RECENT_EMAILS_KEY))
  }, [])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr)
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
  }

  // Build paxList for API
  const buildPaxList = () => {
    const dynamicValidSSR = new Set(
      availableSSR.map((code) => (typeof code === 'string' ? code.trim().toUpperCase() : '')),
    )
    const fallbackValidSSR = new Set(FALLBACK_SSR_CODES)

    const passengers = Object.entries(passengerData).map(([index, data]) => {
      const passengerIndex = Number(index)
      const ssrList = selectedSSR[passengerIndex] || []
      const seatId = selectedSeats[passengerIndex]
      const mealIds = selectedMeals[passengerIndex] || []
      const baggageIds = selectedBaggage[passengerIndex] || []

      // Find associated adult for infants (use selection from offer-price page)
      let associatePax: { givenName: string; surname: string } | undefined
      if (data.paxType === 'Infant') {
        const assocIndex =
          data.associatedAdultIndex != null && data.associatedAdultIndex !== ''
            ? Number(data.associatedAdultIndex)
            : undefined
        const adultData =
          assocIndex !== undefined && !Number.isNaN(assocIndex)
            ? passengerData[assocIndex]
            : undefined
        if (adultData?.firstName && adultData?.lastName) {
          associatePax = {
            givenName: adultData.firstName,
            surname: adultData.lastName,
          }
        } else {
          // Fallback: first adult
          const adults = Object.entries(passengerData).filter(([, p]) => p.paxType === 'Adult')
          const adult = adults[0]?.[1]
          if (adult?.firstName && adult?.lastName) {
            associatePax = {
              givenName: adult.firstName,
              surname: adult.lastName,
            }
          }
        }
      }

      const paxEntry: Record<string, unknown> = {
        ptc: data.paxType,
        individual: {
          givenName: data.firstName,
          surname: data.lastName,
          gender: data.gender,
          birthdate: data.dob,
          nationality: data.nationality,
          ...(passportRequired &&
            data.passportNumber && {
              identityDoc: {
                identityDocType: 'Passport',
                identityDocID: data.passportNumber,
                expiryDate: data.passportExpiry || '',
              },
            }),
          ...(associatePax && { associatePax }),
        },
      }

      // Add SSRs - Filter only valid SSR codes
      if (ssrList.length > 0) {
        // Debug: Log all SSR codes being processed
        console.log('Processing SSR codes for passenger:', data.firstName, ssrList)

        const validSSRs = ssrList.filter((ssr) => {
          const normalizedCode = ssr.code.trim().toUpperCase()
          const isValidFormat = /^[A-Z0-9]{3,5}$/.test(normalizedCode)
          const isKnownByOffer =
            dynamicValidSSR.size > 0 ? dynamicValidSSR.has(normalizedCode) : true
          const isKnownFallback = fallbackValidSSR.has(normalizedCode)
          const isValidCode = isValidFormat && (isKnownByOffer || isKnownFallback)

          if (!isValidCode) {
            console.warn('SSR code filtered out from sellSSR payload:', ssr.code, {
              normalizedCode,
              isValidFormat,
              isKnownByOffer,
              isKnownFallback,
            })
          }

          return isValidCode
        })

        if (validSSRs.length > 0) {
          paxEntry.sellSSR = validSSRs
            .map((ssr) => {
              const normalizedCode = ssr.code.trim().toUpperCase()

              if (normalizedCode === 'FQTV' && ssr.ffNumber) {
                // Validate account number - only numeric characters allowed
                const numericAccountNumber = ssr.ffNumber.replace(/\D/g, '')
                if (!numericAccountNumber) {
                  console.warn('FQTV account number invalid (no numeric characters):', ssr.ffNumber)
                  return null // Skip this SSR if no valid numeric account number
                }

                return {
                  ssrRemark: null,
                  ssrCode: normalizedCode,
                  loyaltyProgramAccount: {
                    airlineDesigCode:
                      offerDetails?.paxSegmentList[0]?.paxSegment?.operatingCarrierInfo
                        ?.carrierDesigCode || '',
                    accountNumber: numericAccountNumber,
                  },
                }
              }
              return {
                ssrRemark: ssr.remark || null,
                ssrCode: normalizedCode,
              }
            })
            .filter(Boolean) // Remove any null entries
        }
      }

      // Add addons
      const travelerAddOnService: Record<string, Array<{ serviceId: string }>> = {}
      if (baggageIds.length > 0) {
        travelerAddOnService.travelerAddOnServiceBaggage = baggageIds.map((id) => ({
          serviceId: id,
        }))
      }
      if (mealIds.length > 0) {
        travelerAddOnService.travelerAddOnServiceMeal = mealIds.map((id) => ({ serviceId: id }))
      }
      if (seatId) {
        travelerAddOnService.travelerAddOnServiceSeat = [{ serviceId: seatId }]
      }
      if (Object.keys(travelerAddOnService).length > 0) {
        paxEntry.travelerAddOnService = travelerAddOnService
      }

      return paxEntry
    })

    return passengers
  }

  const handleOrderSell = async () => {
    if (!contactEmail || !contactPhone) {
      setBookingError('Please provide contact email and phone number')
      return
    }

    if (!traceId || !offerId) {
      setBookingError('Missing booking information')
      return
    }

    setBookingLoading(true)
    setBookingError(null)
    setPriceChanged(false)

    try {
      const requestBody = {
        traceId,
        offerId: [offerId],
        request: {
          contactInfo: {
            phone: {
              phoneNumber: contactPhone,
              countryDialingCode: countryCode.replace('+', ''),
            },
            emailAddress: contactEmail,
          },
          paxList: buildPaxList(),
        },
      }

      const response = await fetch('/api/flight/ordersell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = (await response.json()) as OrderSellResponse

      if (data.success && data.response) {
        // Check for price changes
        if (
          data.response.offerChangeInfo ||
          data.response.offersGroup?.[0]?.offer?.totalPrice !== offerDetails?.totalPrice
        ) {
          const newTotalPrice = data.response.offersGroup?.[0]?.offer?.totalPrice
          if (newTotalPrice && newTotalPrice !== offerDetails?.totalPrice) {
            setPriceChanged(true)
            setNewPrice(newTotalPrice)
            setBookingLoading(false)
            return
          }
        }

        // No price change, proceed to OrderCreate
        await handleOrderCreate(requestBody)
      } else {
        setBookingError(data.error?.errorMessage ?? data.message ?? 'Failed to validate booking')
        setBookingLoading(false)
      }
    } catch (err) {
      console.error('OrderSell error:', err)
      setBookingError('Failed to process booking. Please try again.')
      setBookingLoading(false)
    }
  }

  const handleOrderCreate = async (requestBody?: Record<string, unknown>) => {
    if (!requestBody) {
      requestBody = {
        traceId,
        offerId: [offerId],
        request: {
          contactInfo: {
            phone: {
              phoneNumber: contactPhone,
              countryDialingCode: countryCode.replace('+', ''),
            },
            emailAddress: contactEmail,
          },
          paxList: buildPaxList(),
        },
      }
    }

    try {
      const response = await fetch('/api/flight/ordercreate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = (await response.json()) as OrderSellResponse
      console.log('OrderCreate API response:', data)

      if (data.success && data.response) {
        const createdRef = data.response.orderReference ?? ''
        // Save full OrderCreate response for the ticket page
        try {
          sessionStorage.setItem(ORDER_RESPONSE_STORAGE_KEY, JSON.stringify(data))
          // Store creation time (OrderCreate only) for booking-order page "Created on"
          if (createdRef && data.respondedOn) {
            sessionStorage.setItem(`orderCreateTime_${createdRef}`, String(data.respondedOn))
          }
          // Save booking to Firestore for Booking History table (send full response + top-level respondedOn)
          const savePayload = {
            orderResponse: {
              ...data,
              response: data.response,
              respondedOn: data.respondedOn ?? new Date().toISOString(),
            },
            createdBy: session?.user?.email || 'Guest',
          }
          let bookingSaved = false

          const saveRes = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(savePayload),
          })
          if (saveRes.ok) {
            bookingSaved = true
          } else {
            const errText = await saveRes.text()
            console.warn('Primary booking save failed:', saveRes.status, errText)
          }

          // Fallback sync with minimal payload if primary save failed.
          if (!bookingSaved && createdRef) {
            const fallbackRes = await fetch('/api/bookings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderReference: createdRef }),
            })
            if (fallbackRes.ok) {
              bookingSaved = true
            } else {
              const fallbackErrText = await fallbackRes.text()
              console.warn(
                'Fallback booking save failed:',
                fallbackRes.status,
                fallbackErrText,
              )
            }
          }
        } catch (saveErr) {
          console.warn('Booking save step failed before redirect:', saveErr)
        }
        // Clear other sessionStorage
        sessionStorage.removeItem('passengerData')
        sessionStorage.removeItem('offerDetails')
        sessionStorage.removeItem('selectedSSR')
        sessionStorage.removeItem('selectedSeats')
        sessionStorage.removeItem('selectedMeals')
        sessionStorage.removeItem('selectedBaggage')
        sessionStorage.removeItem('availableSSR')
        sessionStorage.removeItem('seatsAvailable')
        sessionStorage.removeItem('serviceListAvailable')
        sessionStorage.removeItem('passportRequired')
        // Redirect to booking-order with success flag for popup + confetti
        if (createdRef) {
          console.log('Redirecting to booking-order with orderRef:', createdRef)
          // Immediate redirect without waiting for loading state
          window.location.href = `/booking-order?orderRef=${encodeURIComponent(createdRef)}&success=1`
          return // Exit early to prevent loading state from resetting
        } else {
          console.error('No orderReference found in response:', data.response)
          setBookingError('Order created but no reference number received')
        }
      } else {
        console.error('OrderCreate failed:', data)
        setBookingError(data.error?.errorMessage ?? data.message ?? 'Failed to create booking')
      }
    } catch (err) {
      console.error('OrderCreate error:', err)
      setBookingError('Failed to create booking. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleAcceptPriceChange = () => {
    setPriceChanged(false)
    void handleOrderCreate()
  }

  const handleBack = () => {
    router.push(`/ssr?traceId=${traceId}&offerId=${offerId}`)
  }

  const passengers = Object.entries(passengerData).map(([index, data]) => ({
    index: Number(index),
    ...data,
  }))

  // Calculate total addons count
  const totalAddons =
    Object.values(selectedSSR).reduce((sum, arr) => sum + arr.length, 0) +
    Object.values(selectedSeats).filter(Boolean).length +
    Object.values(selectedMeals).reduce((sum, arr) => sum + arr.length, 0) +
    Object.values(selectedBaggage).reduce((sum, arr) => sum + arr.length, 0)

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading booking details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <datalist id="review-book-recent-phones">
        {recentPhones.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <datalist id="review-book-recent-emails">
        {recentEmails.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>
      <div className="max-w-5xl mx-auto">
        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 - Completed */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Flight Itinerary
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-green-500 mx-4 mt-[-24px]" />

            {/* Step 2 - Completed */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">SSR</span>
            </div>
            <div className="flex-1 h-0.5 bg-primary mx-4 mt-[-24px]" />

            {/* Step 3 - Active */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold mb-2">
                3
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Review & Book
              </span>
            </div>
          </div>
        </div>

        {/* Price Change Alert */}
        {priceChanged && newPrice && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Price has changed
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  The fare has been updated from{' '}
                  <span className="font-semibold">
                    {offerDetails?.currency} {offerDetails?.totalPrice?.toLocaleString()}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold">
                    {offerDetails?.currency} {newPrice?.toLocaleString()}
                  </span>
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAcceptPriceChange}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    Accept & Continue
                  </button>
                  <button
                    onClick={() => setPriceChanged(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Error Alert */}
        {bookingError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">Booking Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{bookingError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Flight Details Section (matches FlightSearchInterface search button container) */}
            <div className="bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection('flights')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Plane className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Flight Details</h3>
                </div>
                {expandedSections.flights ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {expandedSections.flights && offerDetails?.paxSegmentList && (
                <div className="px-6 pb-4 space-y-4">
                  {offerDetails.paxSegmentList.map((seg, idx) => {
                    const depInfo = formatDateTime(
                      seg.paxSegment.departure.aircraftScheduledDateTime,
                    )
                    const arrInfo = formatDateTime(seg.paxSegment.arrival.aircraftScheduledDateTime)

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg"
                      >
                        <AirlineLogo
                          airlineId={seg.paxSegment.marketingCarrierInfo.carrierDesigCode}
                          size={48}
                          className="w-12 h-12"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {depInfo.time}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {seg.paxSegment.departure.iatA_LocationCode}
                              </p>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                              <Plane className="w-4 h-4 text-primary rotate-90" />
                              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {arrInfo.time}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {seg.paxSegment.arrival.iatA_LocationCode}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {seg.paxSegment.marketingCarrierInfo.carrierName}{' '}
                            {seg.paxSegment.marketingCarrierInfo.marketingCarrierFlightNumberText} •{' '}
                            {depInfo.date}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Passengers Section (matches FlightSearchInterface search button container) */}
            <div className="bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection('passengers')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Passengers ({passengers.length})
                  </h3>
                </div>
                {expandedSections.passengers ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {expandedSections.passengers && (
                <div className="px-6 pb-4 space-y-3">
                  {passengers.map((passenger, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {passenger.firstName} {passenger.lastName}
                          </span>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                            {passenger.paxType}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {passenger.gender}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{passenger.dob}</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          Nationality: {passenger.nationality}
                        </div>
                        {passportRequired && passenger.passportNumber && (
                          <>
                            <div className="text-gray-600 dark:text-gray-400">
                              Passport: {passenger.passportNumber}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Expiry: {passenger.passportExpiry}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add-ons Section (matches FlightSearchInterface search button container) */}
            {totalAddons > 0 && (
              <div className="bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleSection('addons')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Add-ons ({totalAddons})
                    </h3>
                  </div>
                  {expandedSections.addons ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {expandedSections.addons && (
                  <div className="px-6 pb-4 space-y-4">
                    {passengers.map((passenger) => {
                      const ssrList = selectedSSR[passenger.index] || []
                      const seatId = selectedSeats[passenger.index]
                      const mealIds = selectedMeals[passenger.index] || []
                      const baggageIds = selectedBaggage[passenger.index] || []
                      const hasAddons =
                        ssrList.length > 0 || seatId || mealIds.length > 0 || baggageIds.length > 0

                      if (!hasAddons) return null

                      return (
                        <div
                          key={passenger.index}
                          className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg"
                        >
                          <p className="font-medium text-gray-900 dark:text-white mb-2">
                            {passenger.firstName} {passenger.lastName}
                          </p>
                          <div className="space-y-1 text-sm">
                            {ssrList.map((ssr, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                              >
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>
                                  SSR: {ssr.code} {ssr.ffNumber ? `(FF: ${ssr.ffNumber})` : ''}
                                </span>
                              </div>
                            ))}
                            {seatId && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Armchair className="w-4 h-4 text-blue-500" />
                                <span>Seat Selected</span>
                              </div>
                            )}
                            {mealIds.length > 0 && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                                <span>{mealIds.length} Meal(s)</span>
                              </div>
                            )}
                            {baggageIds.length > 0 && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Briefcase className="w-4 h-4 text-purple-500" />
                                <span>{baggageIds.length} Extra Baggage</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Contact Information Section (matches FlightSearchInterface search button container) */}
            <div className="bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection('contact')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Contact Information
                  </h3>
                  {(!contactEmail || !contactPhone) && (
                    <span className="text-xs text-red-500">*Required</span>
                  )}
                </div>
                {expandedSections.contact ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {expandedSections.contact && (
                <div className="px-6 pb-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        onBlur={(e) => {
                          const v = e.target.value.trim()
                          if (v)
                            setRecentEmails((prev) =>
                              saveRecentToStorage(RECENT_EMAILS_KEY, v, prev),
                            )
                        }}
                        placeholder="example@email.com"
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary h-10"
                        style={{
                          WebkitAppearance: 'none',
                          MozAppearance: 'textfield',
                          appearance: 'none',
                        }}
                        required
                      />
                      {contactEmail && (
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform pointer-events-none" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number *
                    </label>
                    <div className="flex gap-2">
                      {contactPhone ? (
                        // Show static display when phone is filled
                        <div className="w-32 px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm flex items-center justify-between h-10">
                          <div className="flex items-center gap-2">
                            {PHONE_COUNTRIES.find((c) => c.phoneCode === countryCode) && (
                              <ReactCountryFlag
                                countryCode={
                                  PHONE_COUNTRIES.find((c) => c.phoneCode === countryCode)?.code ||
                                  'BD'
                                }
                                svg
                                style={{ width: '1.25rem', height: '1.25rem' }}
                              />
                            )}
                            <span className="text-sm">{countryCode}</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400 transition-transform" />
                        </div>
                      ) : (
                        <CountrySelector
                          value={countryCode}
                          onChange={(value) => setCountryCode(value)}
                          countries={PHONE_COUNTRIES}
                          placeholder="Code"
                          type="phone"
                          className="w-32"
                        />
                      )}
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ''))}
                          onBlur={(e) => {
                            const v = e.target.value.trim()
                            if (v)
                              setRecentPhones((prev) =>
                                saveRecentToStorage(RECENT_PHONES_KEY, v, prev),
                              )
                          }}
                          placeholder="01XXXXXXXXX"
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary h-10"
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'textfield',
                            appearance: 'none',
                          }}
                          required
                        />
                        {contactPhone && (
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform pointer-events-none" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Fare Summary (matches FlightSearchInterface search button container) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Fare Summary
              </h3>

              {offerDetails?.fareDetailList && (
                <div className="space-y-3 mb-4">
                  {offerDetails.fareDetailList.map((fare, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>
                          {fare.fareDetail.paxType} x {fare.fareDetail.paxCount}
                        </span>
                        <span>
                          {fare.fareDetail.currency} {fare.fareDetail.baseFare.toLocaleString()}
                        </span>
                      </div>
                      {fare.fareDetail.tax > 0 && (
                        <div className="flex justify-between text-gray-500 dark:text-gray-500 text-xs pl-2">
                          <span>+ Tax</span>
                          <span>
                            {fare.fareDetail.currency} {fare.fareDetail.tax.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-primary">
                    {offerDetails?.currency} {offerDetails?.totalPrice?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => void handleOrderSell()}
                  disabled={bookingLoading || !contactEmail || !contactPhone}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm Booking
                    </>
                  )}
                </button>

                <button
                  onClick={handleBack}
                  disabled={bookingLoading}
                  className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to SSR
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                By clicking "Confirm Booking", you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
