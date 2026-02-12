'use client'

import { AlertCircle, Loader2, ArrowRight, ArrowLeft, CheckCircle2, Briefcase, UtensilsCrossed, Armchair, Accessibility, Award, ChevronDown } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'

// SSR Code descriptions
const SSR_CODES: Record<string, { name: string; description: string; icon: React.ReactNode }> = {
  WCHR: { name: 'Wheelchair', description: 'Wheelchair assistance required', icon: <Accessibility className="w-5 h-5" /> },
  FQTV: { name: 'Frequent Flyer', description: 'Add your frequent flyer number', icon: <Award className="w-5 h-5" /> },
  VIP: { name: 'VIP Service', description: 'VIP treatment and priority services', icon: <Award className="w-5 h-5" /> },
  CIP: { name: 'CIP Service', description: 'Commercially Important Person service', icon: <Award className="w-5 h-5" /> },
  VVIP: { name: 'VVIP Service', description: 'Very Very Important Person service', icon: <Award className="w-5 h-5" /> },
  MAAS: { name: 'Meet & Assist', description: 'Airport meet and assist service', icon: <Award className="w-5 h-5" /> },
}

const TRAVELLER_SYNC_STATE_KEY = 'tripfeels-traveller-sync-state'

interface TravellerSyncState {
  traceId: string
  offerId: string
  travellerIdsByPassenger: Record<string, string>
}

interface PassengerData {
  firstName: string
  lastName: string
  paxType: string
  [key: string]: string
}

interface SeatService {
  serviceId: string
  amount: number
  currency: string
  seatAvailability: string
  seatType: string
  seatNumber: string
  seatFeatures: string[]
}

interface MealService {
  serviceId: string
  amount: number
  currency: string
  description: string
  mealName: string
}

interface BaggageService {
  serviceId: string
  amount: number
  currency: string
  description: string
}

interface SeatAvailabilityResponse {
  success: boolean
  response?: {
    seatOffers?: Array<Record<string, unknown>>
  }
}

interface ServiceListResponse {
  success: boolean
  response?: {
    addonOffers?: Array<Record<string, unknown>>
  }
}

export default function SSRPage() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSyncingTravellers, setIsSyncingTravellers] = useState(false)
  
  // Data from sessionStorage
  const [passengerData, setPassengerData] = useState<Record<number, PassengerData>>({})
  const [availableSSR, setAvailableSSR] = useState<string[]>([])
  const [seatsAvailable, setSeatsAvailable] = useState(false)
  const [serviceListAvailable, setServiceListAvailable] = useState(false)
  
  // Selected SSRs per passenger
  const [selectedSSR, setSelectedSSR] = useState<Record<number, { code: string; remark: string; ffNumber?: string }[]>>({})
  
  // Seat, meal, baggage data
  const [seatData, setSeatData] = useState<SeatService[]>([])
  const [mealData, setMealData] = useState<MealService[]>([])
  const [baggageData, setBaggageData] = useState<BaggageService[]>([])
  
  // Selected addons per passenger
  const [selectedSeats, setSelectedSeats] = useState<Record<number, string>>({})
  const [selectedMeals, setSelectedMeals] = useState<Record<number, string[]>>({})
  const [selectedBaggage, setSelectedBaggage] = useState<Record<number, string[]>>({})
  
  const [expandedPassenger, setExpandedPassenger] = useState<number | null>(0)
  
  const traceId = searchParams.get('traceId')
  const offerId = searchParams.get('offerId')

  const readTravellerSyncState = (): TravellerSyncState | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = sessionStorage.getItem(TRAVELLER_SYNC_STATE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as unknown
      if (!parsed || typeof parsed !== 'object') return null
      const obj = parsed as Record<string, unknown>
      const syncedTraceId = typeof obj.traceId === 'string' ? obj.traceId : ''
      const syncedOfferId = typeof obj.offerId === 'string' ? obj.offerId : ''
      const ids =
        obj.travellerIdsByPassenger && typeof obj.travellerIdsByPassenger === 'object'
          ? (obj.travellerIdsByPassenger as Record<string, unknown>)
          : {}

      const travellerIdsByPassenger: Record<string, string> = {}
      Object.entries(ids).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          travellerIdsByPassenger[key] = value
        }
      })

      return {
        traceId: syncedTraceId,
        offerId: syncedOfferId,
        travellerIdsByPassenger,
      }
    } catch {
      return null
    }
  }

  const syncTravellerSsrData = async () => {
    const syncState = readTravellerSyncState()
    if (!syncState) return
    if (syncState.traceId !== (traceId || '') || syncState.offerId !== (offerId || '')) return

    const entries = Object.entries(syncState.travellerIdsByPassenger)
    for (const [passengerIndex, travellerId] of entries) {
      const selectedForPassenger = selectedSSR[Number(passengerIndex)] || []
      const ssrCodes = selectedForPassenger.map((item) => ({
        code: item.code,
        ...(item.remark ? { remark: item.remark } : {}),
      }))
      const fqtv = selectedForPassenger.find((item) => item.code === 'FQTV' && item.ffNumber?.trim())

      const payload: Record<string, unknown> = {
        ssrCodes,
      }
      if (fqtv?.ffNumber) {
        payload.loyaltyAirlineCode = 'FQTV'
        payload.loyaltyAccountNumber = fqtv.ffNumber.trim()
      }

      const response = await fetch(`/api/travellers/${travellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(err?.error || 'Failed to sync SSR data into travellers')
      }
    }
  }

  // Fetch seat availability
  const fetchSeatAvailability = useCallback(async () => {
    if (!seatsAvailable || !traceId || !offerId) return
    
    try {
      const response = await fetch('/api/flight/seatavailability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traceId, offerId: [offerId] }),
      })
      const data = (await response.json()) as SeatAvailabilityResponse
      if (data.success && data.response?.seatOffers) {
        // Extract seat services from response
        const seats: SeatService[] = []
        data.response.seatOffers.forEach((offer: Record<string, unknown>) => {
          const journeyLegs = offer.journeyLegs as Array<Record<string, unknown>>
          journeyLegs?.forEach((leg) => {
            const decks = leg.decks as Array<Record<string, unknown>>
            decks?.forEach((deck) => {
              const compartments = deck.compartments as Array<Record<string, unknown>>
              compartments?.forEach((comp) => {
                const rowWiseSeats = comp.rowWiseSeats as Array<Record<string, unknown>>
                rowWiseSeats?.forEach((row) => {
                  const seatServices = row.seatServices as SeatService[]
                  seatServices?.forEach((seat) => {
                    if (seat.seatAvailability === 'Available') {
                      seats.push(seat)
                    }
                  })
                })
              })
            })
          })
        })
        setSeatData(seats)
      }
    } catch (err) {
      console.error('Error fetching seat availability:', err)
    }
  }, [seatsAvailable, traceId, offerId])

  // Fetch service list (meals & baggage)
  const fetchServiceList = useCallback(async () => {
    if (!serviceListAvailable || !traceId || !offerId) return
    
    try {
      const response = await fetch('/api/flight/servicelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traceId, offerId: [offerId] }),
      })
      const data = (await response.json()) as ServiceListResponse
      if (data.success && data.response?.addonOffers) {
        const meals: MealService[] = []
        const baggage: BaggageService[] = []
        
        data.response.addonOffers.forEach((offer: Record<string, unknown>) => {
          const mealAddOns = offer.mealAddOns as Array<Record<string, unknown>>
          mealAddOns?.forEach((mealAddon) => {
            const mealServices = mealAddon.mealServices as MealService[]
            mealServices?.forEach((meal) => meals.push(meal))
          })
          
          const baggageAddOns = offer.baggageAddOns as Array<Record<string, unknown>>
          baggageAddOns?.forEach((bagAddon) => {
            const baggageServices = bagAddon.baggageServices as BaggageService[]
            baggageServices?.forEach((bag) => baggage.push(bag))
          })
        })
        
        setMealData(meals)
        setBaggageData(baggage)
      }
    } catch (err) {
      console.error('Error fetching service list:', err)
    }
  }, [serviceListAvailable, traceId, offerId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = `/ssr?traceId=${traceId ?? ''}&offerId=${offerId ?? ''}`
      void router.push(`/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }

    if (status === 'authenticated') {
      // Load data from sessionStorage
      const storedPassengerData = sessionStorage.getItem('passengerData')
      const storedAvailableSSR = sessionStorage.getItem('availableSSR')
      const storedSeatsAvailable = sessionStorage.getItem('seatsAvailable')
      const storedServiceListAvailable = sessionStorage.getItem('serviceListAvailable')
      
      if (storedPassengerData) {
        setPassengerData(JSON.parse(storedPassengerData) as Record<number, PassengerData>)
      }
      if (storedAvailableSSR) {
        setAvailableSSR(JSON.parse(storedAvailableSSR) as string[])
      }
      if (storedSeatsAvailable) {
        setSeatsAvailable(JSON.parse(storedSeatsAvailable) as boolean)
      }
      if (storedServiceListAvailable) {
        setServiceListAvailable(JSON.parse(storedServiceListAvailable) as boolean)
      }

      // Restore SSR selections when returning from Review & Book (Back to SSR)
      const storedSelectedSSR = sessionStorage.getItem('selectedSSR')
      const storedSelectedSeats = sessionStorage.getItem('selectedSeats')
      const storedSelectedMeals = sessionStorage.getItem('selectedMeals')
      const storedSelectedBaggage = sessionStorage.getItem('selectedBaggage')
      if (storedSelectedSSR) {
        try {
          setSelectedSSR(JSON.parse(storedSelectedSSR) as Record<number, { code: string; remark: string; ffNumber?: string }[]>)
        } catch {
          // ignore
        }
      }
      if (storedSelectedSeats) {
        try {
          setSelectedSeats(JSON.parse(storedSelectedSeats) as Record<number, string>)
        } catch {
          // ignore
        }
      }
      if (storedSelectedMeals) {
        try {
          setSelectedMeals(JSON.parse(storedSelectedMeals) as Record<number, string[]>)
        } catch {
          // ignore
        }
      }
      if (storedSelectedBaggage) {
        try {
          setSelectedBaggage(JSON.parse(storedSelectedBaggage) as Record<number, string[]>)
        } catch {
          // ignore
        }
      }
      
      setLoading(false)
    }
  }, [status, traceId, offerId, router])

  useEffect(() => {
    if (!loading) {
      void fetchSeatAvailability()
      void fetchServiceList()
    }
  }, [loading, fetchSeatAvailability, fetchServiceList])

  const toggleSSR = (passengerIndex: number, ssrCode: string) => {
    setSelectedSSR(prev => {
      const current = prev[passengerIndex] || []
      const exists = current.find(s => s.code === ssrCode)
      
      if (exists) {
        return { ...prev, [passengerIndex]: current.filter(s => s.code !== ssrCode) }
      } else {
        return { ...prev, [passengerIndex]: [...current, { code: ssrCode, remark: '' }] }
      }
    })
  }

  const updateSSRRemark = (passengerIndex: number, ssrCode: string, remark: string) => {
    setSelectedSSR(prev => {
      const current = prev[passengerIndex] || []
      return {
        ...prev,
        [passengerIndex]: current.map(s => s.code === ssrCode ? { ...s, remark } : s)
      }
    })
  }

  const updateFFNumber = (passengerIndex: number, ffNumber: string) => {
    setSelectedSSR(prev => {
      const current = prev[passengerIndex] || []
      return {
        ...prev,
        [passengerIndex]: current.map(s => s.code === 'FQTV' ? { ...s, ffNumber } : s)
      }
    })
  }

  const handleContinue = async () => {
    // Store SSR selections in sessionStorage
    sessionStorage.setItem('selectedSSR', JSON.stringify(selectedSSR))
    sessionStorage.setItem('selectedSeats', JSON.stringify(selectedSeats))
    sessionStorage.setItem('selectedMeals', JSON.stringify(selectedMeals))
    sessionStorage.setItem('selectedBaggage', JSON.stringify(selectedBaggage))

    try {
      setSyncError(null)
      setIsSyncingTravellers(true)
      await syncTravellerSsrData()
      // Navigate to Review & Book page
      router.push(`/review-book?traceId=${traceId}&offerId=${offerId}`)
    } catch (syncError) {
      console.error('Failed to sync traveller SSR data:', syncError)
      setSyncError('Failed to save SSR data into Travellers Management. Please try again.')
    } finally {
      setIsSyncingTravellers(false)
    }
  }

  const handleBack = () => {
    router.push(`/offer-price?traceId=${traceId}&offerId=${offerId}`)
  }

  const passengers = Object.entries(passengerData).map(([index, data]) => ({
    index: Number(index),
    ...data
  }))

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading SSR options...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Error</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button onClick={handleBack} className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto">
        {/* Progress Stepper */}
        <div className="mb-5 sm:mb-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 - Completed */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Flight Itinerary</span>
            </div>
            <div className="flex-1 h-0.5 bg-primary mx-4 mt-[-24px]" />
            
            {/* Step 2 - Active */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold mb-2">
                2
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">SSR</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 mx-4 mt-[-24px]" />
            
            {/* Step 3 */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-semibold mb-2">
                3
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Review & Book</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Special Service Requests (SSR)</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select optional services for your journey. These services are subject to availability.
            </p>
          </div>

          {/* Available SSR Info */}
          {availableSSR.length > 0 && (
            <div className="p-3 bg-blue-50/80 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    <strong>Available SSR for this flight:</strong> {availableSSR.map(code => SSR_CODES[code]?.name || code).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Passenger-wise SSR Selection */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {passengers.map((passenger) => {
              const isExpanded = expandedPassenger === passenger.index
              const passengerSSR = selectedSSR[passenger.index] || []
              
              return (
                <div key={passenger.index} className="bg-white dark:bg-neutral-950">
                  {/* Passenger Header */}
                  <button
                    onClick={() => setExpandedPassenger(isExpanded ? null : passenger.index)}
                    className="w-full px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-wrap text-left">
                      <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
                        {passenger.firstName} {passenger.lastName}
                      </span>
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-full">
                        {passenger.paxType}
                      </span>
                      {passengerSSR.length > 0 && (
                        <span className="text-[11px] font-medium text-green-600 dark:text-green-400">
                          {passengerSSR.length} SSR selected
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-5 h-5 text-primary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* SSR Options */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-4 pt-1.5 space-y-3">
                      {/* SSR Selection */}
                      {availableSSR.length > 0 && (
                        <div className="rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-3">
                          <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-700 dark:text-gray-300 mb-3">Special Services</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableSSR.map((code) => {
                              const ssr = SSR_CODES[code]
                              const isSelected = passengerSSR.some(s => s.code === code)
                              const selectedItem = passengerSSR.find(s => s.code === code)
                              
                              return (
                                <div
                                  key={code}
                                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'border-primary/70 bg-primary/5'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 bg-white/70 dark:bg-black/20'
                                  }`}
                                  onClick={() => toggleSSR(passenger.index, code)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                      {ssr?.icon || <Award className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                                          {ssr?.name || code}
                                        </h5>
                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {ssr?.description || 'Special service request'}
                                      </p>
                                      
                                      {/* FQTV - Frequent Flyer Number Input */}
                                      {isSelected && code === 'FQTV' && (
                                        <input
                                          type="text"
                                          placeholder="Enter Frequent Flyer Number"
                                          className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                          value={selectedItem?.ffNumber || ''}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => updateFFNumber(passenger.index, e.target.value)}
                                        />
                                      )}
                                      
                                      {/* Remark Input */}
                                      {isSelected && code !== 'FQTV' && (
                                        <input
                                          type="text"
                                          placeholder="Add remark (optional)"
                                          className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                          value={selectedItem?.remark || ''}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => updateSSRRemark(passenger.index, code, e.target.value)}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Seat Selection */}
                      {seatsAvailable && seatData.length > 0 && (
                        <div className="rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-3">
                          <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Armchair className="w-4 h-4" /> Seat Selection
                          </h4>
                          <select
                            className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-black/20 text-sm font-medium text-gray-900 dark:text-white"
                            value={selectedSeats[passenger.index] || ''}
                            onChange={(e) => setSelectedSeats({ ...selectedSeats, [passenger.index]: e.target.value })}
                          >
                            <option value="">No seat preference</option>
                            {seatData.map((seat) => (
                              <option key={seat.serviceId} value={seat.serviceId}>
                                {seat.seatNumber} - {seat.seatType} ({seat.currency} {seat.amount})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Meal Selection */}
                      {serviceListAvailable && mealData.length > 0 && (
                        <div className="rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-3">
                          <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <UtensilsCrossed className="w-4 h-4" /> Meal Options
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {mealData.map((meal) => (
                              <label key={meal.serviceId} className="flex items-center gap-3 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 bg-white/70 dark:bg-black/20">
                                <input
                                  type="checkbox"
                                  checked={(selectedMeals[passenger.index] || []).includes(meal.serviceId)}
                                  onChange={(e) => {
                                    const current = selectedMeals[passenger.index] || []
                                    if (e.target.checked) {
                                      setSelectedMeals({ ...selectedMeals, [passenger.index]: [...current, meal.serviceId] })
                                    } else {
                                      setSelectedMeals({ ...selectedMeals, [passenger.index]: current.filter(id => id !== meal.serviceId) })
                                    }
                                  }}
                                  className="accent-primary"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{meal.mealName}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{meal.description}</p>
                                </div>
                                <span className="text-sm font-semibold text-primary">{meal.currency} {meal.amount}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Baggage Selection */}
                      {serviceListAvailable && baggageData.length > 0 && (
                        <div className="rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-3">
                          <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Extra Baggage
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {baggageData.map((bag) => (
                              <label key={bag.serviceId} className="flex items-center gap-3 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 bg-white/70 dark:bg-black/20">
                                <input
                                  type="checkbox"
                                  checked={(selectedBaggage[passenger.index] || []).includes(bag.serviceId)}
                                  onChange={(e) => {
                                    const current = selectedBaggage[passenger.index] || []
                                    if (e.target.checked) {
                                      setSelectedBaggage({ ...selectedBaggage, [passenger.index]: [...current, bag.serviceId] })
                                    } else {
                                      setSelectedBaggage({ ...selectedBaggage, [passenger.index]: current.filter(id => id !== bag.serviceId) })
                                    }
                                  }}
                                  className="accent-primary"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{bag.description}</p>
                                </div>
                                <span className="text-sm font-semibold text-primary">{bag.currency} {bag.amount}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No additional services message */}
                      {availableSSR.length === 0 && !seatsAvailable && !serviceListAvailable && (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                          No additional services available for this flight.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        {syncError && (
          <div className="mt-4 mb-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            {syncError}
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleBack}
            className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={() => {
              void handleContinue()
            }}
            disabled={isSyncingTravellers}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncingTravellers ? 'Saving Travellers...' : 'Review & Book'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
