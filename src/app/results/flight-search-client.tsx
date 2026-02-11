'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { AirportOption } from '@/components/flight/airport-selection/AirportSelection'
import { ExpandableSearchForm } from '@/components/flight/modify-search/ExpandableSearchForm'
import { FlightResultsContainer } from '@/components/flight/results/FlightResultsContainer'
import type { TravelerData } from '@/components/flight/traveler-selection'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import type { MulticitySegment, SearchFormData } from '@/types/flight/ui/search-form.types'


type TripType = 'oneway' | 'roundtrip' | 'multicity'
type FareType = 'regular' | 'student' | 'seaman'

function getFutureDateString(daysFromToday: number = 7): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  date.setHours(0, 0, 0, 0)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function parseAirportOption(value: unknown): AirportOption | null {
  if (!isRecord(value)) return null
  const iata = isNonEmptyString(value.iata) ? value.iata : null
  if (!iata) return null

  return {
    id: isNonEmptyString(value.id) ? value.id : iata,
    iata,
    city: isNonEmptyString(value.city) ? value.city : iata,
    country: isNonEmptyString(value.country) ? value.country : '',
    name: isNonEmptyString(value.name) ? value.name : '',
  }
}

function parseMulticitySegment(value: unknown): MulticitySegment | null {
  if (!isRecord(value)) return null

  const departureDate = isNonEmptyString(value.departureDate) ? value.departureDate : ''
  if (!departureDate) return null

  return {
    ...(isNonEmptyString(value.id) && { id: value.id }),
    from: parseAirportOption(value.from),
    to: parseAirportOption(value.to),
    departureDate,
  }
}

interface SearchData {
  tripType: TripType
  from: AirportOption | null
  to: AirportOption | null
  departureDate: string
  returnDate?: string
  segments?: MulticitySegment[]
  travelerData: TravelerData
  preferredAirline: string
  fareType: FareType
}

export function FlightSearchPageClient() {
  const router = useRouter()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [urlParamsParsed, setUrlParamsParsed] = useState(false)
  const searchParams = useSearchParams()
  const hasParsedUrlParamsRef = useRef(false)
  
  // Parse search data from URL params or use defaults
  const [currentSearch, setCurrentSearch] = useState<SearchData>({
    tripType: 'oneway',
    from: {
      id: 'DAC',
      city: 'Dhaka',
      country: 'Bangladesh',
      iata: 'DAC',
      name: 'Hazrat Shahjalal International Airport',
    },
    to: {
      id: 'CGP',
      city: 'Chittagong',
      country: 'Bangladesh',
      iata: 'CGP',
      name: 'Shah Amanat International',
    },
    departureDate: getFutureDateString(7), // 7 days from today
    travelerData: {
      adults: 1,
      children: 0,
      infants: 0,
      travelClass: 'Economy',
      childrenAges: [],
    },
    preferredAirline: '',
    fareType: 'regular',
  })

  useEffect(() => {
    setMounted(true)

    // NOTE: `useSearchParams()` can change identity across renders.
    // We only want to apply URL params once on initial mount so that
    // user selections in the search form are not overwritten by defaults.
    if (hasParsedUrlParamsRef.current) return
    hasParsedUrlParamsRef.current = true

    // Parse URL parameters if available
    const urlTripType = searchParams.get('tripType') as TripType
    const urlFromIata = searchParams.get('from')
    const urlToIata = searchParams.get('to')
    const urlDepartureDate = searchParams.get('departureDate')
    const urlReturnDate = searchParams.get('returnDate')
    const urlAdults = searchParams.get('adults')
    const urlChildren = searchParams.get('children')
    const urlInfants = searchParams.get('infants')
    const urlTravelClass = searchParams.get('travelClass')
    const urlPreferredAirline = searchParams.get('preferredAirline')
    const urlFareType = searchParams.get('fareType') as FareType
    const urlSegments = searchParams.get('segments')

    if (urlTripType || urlDepartureDate || urlReturnDate || urlAdults || urlFromIata || urlToIata) {
      setCurrentSearch(prev => {
        const baseUpdate: Partial<SearchData> = {
          tripType: urlTripType || prev.tripType,
          departureDate: urlDepartureDate || prev.departureDate,
          preferredAirline: urlPreferredAirline || prev.preferredAirline,
          fareType: urlFareType || prev.fareType,
          from: prev.from,
          to: prev.to,
          travelerData: {
            adults: urlAdults ? parseInt(urlAdults) : prev.travelerData.adults,
            children: urlChildren ? parseInt(urlChildren) : prev.travelerData.children,
            infants: urlInfants ? parseInt(urlInfants) : prev.travelerData.infants,
            travelClass: (urlTravelClass as 'Economy' | 'Business' | 'First Class') || prev.travelerData.travelClass,
            childrenAges: prev.travelerData.childrenAges || [],
          },
        }

        // Add returnDate only if it exists
        if (urlReturnDate) {
          baseUpdate.returnDate = urlReturnDate
        }

        // For multicity, segments take precedence over individual from/to parameters
        if (urlTripType === 'multicity' && urlSegments) {
          try {
            const parsed = JSON.parse(urlSegments) as unknown
            if (!Array.isArray(parsed)) return { ...prev, ...baseUpdate }

            const parsedSegments: MulticitySegment[] = parsed
              .map(parseMulticitySegment)
              .filter((s): s is MulticitySegment => s !== null)

            const first = parsedSegments[0]
            return {
              ...prev,
              ...baseUpdate,
              segments: parsedSegments,
              // Keep header/UI consistent by deriving a "primary" route/date from first segment
              ...(first?.from && { from: first.from }),
              ...(first?.to && { to: first.to }),
              ...(first?.departureDate && { departureDate: first.departureDate }),
            }
          } catch {
            return { ...prev, ...baseUpdate }
          }
        } else {
          // For non-multicity (oneway, roundtrip, or undefined), use individual from/to parameters
          return {
            ...prev,
            ...baseUpdate,
            from: urlFromIata ? { id: urlFromIata, iata: urlFromIata, city: urlFromIata, country: '', name: '' } : prev.from,
            to: urlToIata ? { id: urlToIata, iata: urlToIata, city: urlToIata, country: '', name: '' } : prev.to,
          }
        }
      })
    }
    // Mark as parsed - React will batch state updates so this happens after setCurrentSearch
    setUrlParamsParsed(true)
  }, [searchParams])

  const wrapper = useMemo(() => {
    if (!mounted)
      return { className: 'min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950', style: {} as React.CSSProperties }
    return {
      className: 'min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950',
      style: {},
    }
  }, [mounted])

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  const handleModifySearch = (newSearchData: SearchData) => {
    setCurrentSearch(newSearchData)
    console.log('New search data:', newSearchData)
    // Here you would typically trigger a new search or update the URL
  }

  const handleBookNow = (outboundId: string, returnId: string, traceId: string) => {
    console.log('Book Now clicked with:', { outboundId, returnId, traceId })
    
    // Navigate to offer-price page with both offer IDs for two-oneway booking
    // This follows the same pattern as one-way flights but with multiple offerIds
    router.push(`/offer-price?traceId=${encodeURIComponent(traceId)}&offerId=${encodeURIComponent(outboundId)}&offerId=${encodeURIComponent(returnId)}`)
  }

  const toggleSearchForm = () => {
    setIsSearchExpanded(!isSearchExpanded)
  }

  return (
    <AuthSessionProvider>
      <div className={wrapper.className} style={wrapper.style}>
        <Header
          showNavigation={false}
          showUserActions={true}
          onMobileMenuToggle={toggleMobileSidebar}
          className={`${isMobileSidebarOpen ? 'hidden md:block' : ''}`}
        />

        {/* Main content with sidebar */}
        <div className="flex pt-14 relative z-10 w-full max-w-full overflow-x-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <div className="fixed top-14 bottom-0 left-0 z-30">
              <Sidebar onCollapseChange={setIsSidebarCollapsed} className="h-full" />
            </div>
          </div>
          {/* Sidebar spacer to keep layout aligned with fixed sidebar */}
          <div className={`hidden md:block ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}></div>

          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden" onClick={closeMobileSidebar}>
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

              {/* Sidebar */}
              <div className="relative h-full w-64">
                <Sidebar isMobile={true} onClose={closeMobileSidebar} className="h-full" />
              </div>
            </div>
          )}

          <main className="flex-1 flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-950 min-w-0 overflow-x-hidden">
            <div className="flex-1 overflow-x-hidden overflow-y-auto">
              <div className="w-full max-w-full">
                {/* Expandable Search Form - Updated */}
                <div className="w-full overflow-visible relative z-20">
                  <ExpandableSearchForm
                    isExpanded={isSearchExpanded}
                    onToggle={toggleSearchForm}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
                    onSearch={(data: any) => handleModifySearch(data)}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
                    initialData={currentSearch as any}
                  />
                </div>

                {/* Flight Results Area */}
                <div className="bg-transparent">
                  {urlParamsParsed && (
                    <FlightResultsContainer 
                      searchData={currentSearch as SearchFormData}
                      onFlightSelect={(offerId: string) => {
                        console.log('Selected flight ID:', offerId)
                        // TODO: Navigate to booking page or show booking modal
                      }}
                      onBookNow={handleBookNow}
                    />
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer at bottom of content */}
            <Footer />
          </main>
        </div>
      </div>
    </AuthSessionProvider>
  )
}