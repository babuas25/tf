'use client'

import { SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { searchFlights } from '@/lib/flight/api/flight-api'
import { transformOffersToFlightOffers, transformOffersToTwoOnewayLists, transformMulticityToTwoOneway } from '@/lib/flight/transformers/offer-transformer'
import { transformSearchToRequest } from '@/lib/flight/transformers/search-transformer'
import { applyFilters, extractFilterOptions } from '@/lib/flight/utils/filter-utils'
import { shouldDisplayAsTwoOneway } from '@/lib/flight/utils/multicity-utils'
import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'
import type { FlightFilters } from '@/types/flight/ui/filter.types'
import { defaultFilters } from '@/types/flight/ui/filter.types'
import type { SearchFormData } from '@/types/flight/ui/search-form.types'

import { AirlineSortBar } from './AirlineSortBar'
import { DateShiftNavigator } from './DateShiftNavigator'
import { FlightFilterSidebar } from './filters'
import { FlightResultsHeader } from './FlightResultsHeader'
import { FlightResultsList } from './FlightResultsList'
import { ResultsSortBar, type ResultsSortKey } from './ResultsSortBar'
import { TwoOnewayResultsGrid } from './TwoOnewayResultsGrid'

function parsePreferredAirlineCodes(input: string): string[] {
  // Accept comma/space separated values: "SQ, QR" or "SQ QR"
  const raw = input
    .split(/[\s,]+/g)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)

  // Keep unique order
  return Array.from(new Set(raw))
}

/** Stable key for search params so we can skip duplicate fetches (e.g. React Strict Mode remount). */
function getSearchRequestKey(data: SearchFormData): string {
  const tripType = data.tripType ?? ''
  const from = data.from?.iata ?? ''
  const to = data.to?.iata ?? ''
  const dep = data.departureDate ?? ''
  const ret = data.returnDate ?? ''
  const adults = data.travelerData?.adults ?? 0
  const children = data.travelerData?.children ?? 0
  const infants = data.travelerData?.infants ?? 0
  const travelClass = data.travelerData?.travelClass ?? ''
  if (data.tripType === 'multicity' && data.segments?.length) {
    const segs = data.segments
      .map((s) => `${s.from?.iata ?? ''}-${s.to?.iata ?? ''}-${s.departureDate ?? ''}`)
      .join('|')
    return `${tripType}|${segs}|${adults}-${children}-${infants}|${travelClass}`
  }
  return `${tripType}|${from}|${to}|${dep}|${ret}|${adults}-${children}-${infants}|${travelClass}`
}

interface FlightResultsContainerProps {
  searchData: SearchFormData
  onDateShift?: (days: number) => void
  onDateSelect?: (date: string) => void
  onFlightSelect?: (offerId: string) => void
  onModifySearch?: () => void
  onBookNow?: (outboundId: string, returnId: string, traceId: string) => void
}

interface CachedSearchResult {
  offers: FlightOffer[]
  twoOneway: {
    obOffers: FlightOffer[]
    ibOffers: FlightOffer[]
  } | null
  traceId: string | null
  error: string | null
}

function formatResultsDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  const dt = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(dt)
}

export function FlightResultsContainer({
  searchData,
  onDateShift,
  onDateSelect,
  onFlightSelect,
  onModifySearch,
  onBookNow,
}: FlightResultsContainerProps) {
  const [offers, setOffers] = useState<FlightOffer[]>([])
  const [twoOneway, setTwoOneway] = useState<{
    obOffers: FlightOffer[]
    ibOffers: FlightOffer[]
  } | null>(null)
  const [traceId, setTraceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter state
  const [filters, setFilters] = useState<FlightFilters>(defaultFilters)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [sortKey, setSortKey] = useState<ResultsSortKey>('none')
  // Separate sort keys for two-oneway columns
  const [obSortKey, setObSortKey] = useState<ResultsSortKey>('none')
  const [ibSortKey, setIbSortKey] = useState<ResultsSortKey>('none')
  const searchCacheRef = useRef<Map<string, CachedSearchResult>>(new Map())

  const setCachedResult = useCallback((key: string, value: CachedSearchResult) => {
    const cache = searchCacheRef.current
    cache.set(key, value)
    if (cache.size > 30) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) cache.delete(oldestKey)
    }
  }, [])

  const preferredAirlineCodes = useMemo(() => {
    return parsePreferredAirlineCodes(searchData.preferredAirline ?? '')
  }, [searchData.preferredAirline])

  const activeDate = useMemo(() => {
    if (searchData.tripType === 'multicity' && searchData.segments?.length) {
      return searchData.segments[0]?.departureDate || searchData.departureDate
    }
    return searchData.departureDate
  }, [searchData.departureDate, searchData.segments, searchData.tripType])

  const dateLabel = useMemo(() => formatResultsDate(activeDate), [activeDate])
  const showDateNavigator = searchData.tripType === 'oneway'

  const fetchFlights = useCallback(async () => {
    // Validate search data
    if (!searchData) {
      setError('No search data provided')
      setLoading(false)
      return
    }

    // Check if all required segments are present for multicity
    if (searchData.tripType === 'multicity') {
      if (!searchData.segments || searchData.segments.length === 0) {
        setError('No flight segments provided for multicity search')
        setLoading(false)
        return
      }
      
      // Check if all segments have complete data
      const incompleteSegment = searchData.segments.find(
        seg => !seg.from?.iata || !seg.to?.iata || !seg.departureDate
      )
      if (incompleteSegment) {
        setError('Please complete all flight segments')
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(null)
    setTwoOneway(null)

    try {
      const requestKey = getSearchRequestKey(searchData)
      const request = transformSearchToRequest(searchData)
      const response = await searchFlights(request)

      if (response.success && response.response) {
        let nextOffers: FlightOffer[] = []
        let nextTwoOneway: {
          obOffers: FlightOffer[]
          ibOffers: FlightOffer[]
        } | null = null

        // Check if multi-city search should be displayed as TwoOneWay (domestic + 2 segments)
        const isMulticityTwoOneway = shouldDisplayAsTwoOneway(searchData)

        if (isMulticityTwoOneway) {
          // Transform multi-city offers into two-oneway format
          const transformedOffers = transformOffersToFlightOffers(response.response)
          const { obOffers, ibOffers } = transformMulticityToTwoOneway(transformedOffers)
          nextTwoOneway = { obOffers, ibOffers }
        } else if (searchData.tripType === 'roundtrip') {
          // If API sends paired-two-oneway (specialReturnOffersGroup), render in two columns for roundtrip searches.
          const { obOffers, ibOffers } = transformOffersToTwoOnewayLists(response.response)
          const hasTwoOneway = obOffers.length > 0 || ibOffers.length > 0

          if (hasTwoOneway) {
            nextTwoOneway = { obOffers, ibOffers }
          } else {
            const transformedOffers = transformOffersToFlightOffers(response.response)
            nextOffers = transformedOffers
          }
        } else {
          const transformedOffers = transformOffersToFlightOffers(response.response)
          nextOffers = transformedOffers
        }

        setOffers(nextOffers)
        setTwoOneway(nextTwoOneway)
        setTraceId(response.response.traceId)
        setCachedResult(requestKey, {
          offers: nextOffers,
          twoOneway: nextTwoOneway,
          traceId: response.response.traceId,
          error: null,
        })
      } else {
        setError('No flights found for your search criteria')
        setCachedResult(requestKey, {
          offers: [],
          twoOneway: null,
          traceId: null,
          error: 'No flights found for your search criteria',
        })
      }
    } catch (err) {
      console.error('Flight search error:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [searchData, setCachedResult])

  // Single request per search: only one POST /api/flight/search per distinct search.
  // React (e.g. Strict Mode) may run this effect twice with the same searchData; we send the request only once.
  const lastFetchKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const key = getSearchRequestKey(searchData)
    const cachedResult = searchCacheRef.current.get(key)
    if (cachedResult) {
      setOffers(cachedResult.offers)
      setTwoOneway(cachedResult.twoOneway)
      setTraceId(cachedResult.traceId)
      setError(cachedResult.error)
      setLoading(false)
      lastFetchKeyRef.current = key
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('[FlightResults] Cache hit. Reusing existing results without API call.')
      }
      return
    }

    if (lastFetchKeyRef.current === key) {
      // Duplicate run (same search) → do not send another request.
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('[FlightResults] Skipping duplicate run (same search) – single request only')
      }
      return
    }
    lastFetchKeyRef.current = key
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[FlightResults] Sending single flight search request')
    }
    void fetchFlights()
  }, [fetchFlights, searchData])

  // Extract filter options from all offers (before filtering)
  const filterOptions = useMemo(() => {
    const allOffers = twoOneway
      ? [...twoOneway.obOffers, ...twoOneway.ibOffers]
      : offers
    return extractFilterOptions(allOffers)
  }, [offers, twoOneway])

  // Helper to get date parts in Asia/Dhaka timezone
  const getDateInDhaka = useCallback((dateTime: string) => {
    const date = new Date(dateTime)
    // Use Intl.DateTimeFormat to get date parts in Asia/Dhaka timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const parts = formatter.formatToParts(date)
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10)
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10)
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10)
    return { year, month, day }
  }, [])

  const getDatePartsFromIsoDate = useCallback((dateTime: string) => {
    const rawDate = dateTime.split('T')[0]
    const parts = rawDate?.split('-')
    if (!parts || parts.length !== 3) return null
    const year = parseInt(parts[0] || '0', 10)
    const month = parseInt(parts[1] || '0', 10)
    const day = parseInt(parts[2] || '0', 10)
    if (!year || !month || !day) return null
    return { year, month, day }
  }, [])

  const matchesSearchDate = useCallback((dateTime: string, searchYear: number, searchMonth: number, searchDay: number) => {
    if (!dateTime) return false

    const dhaka = getDateInDhaka(dateTime)
    if (dhaka.year === searchYear && dhaka.month === searchMonth && dhaka.day === searchDay) {
      return true
    }

    const raw = getDatePartsFromIsoDate(dateTime)
    if (!raw) return false
    return raw.year === searchYear && raw.month === searchMonth && raw.day === searchDay
  }, [getDateInDhaka, getDatePartsFromIsoDate])

  // Filter offers by search date first
  const dateFilteredOffers = useMemo(() => {
    if (!searchData.departureDate) return offers
    
    // Parse search date (format: YYYY-MM-DD)
    const searchDateParts = searchData.departureDate.split('-')
    if (searchDateParts.length !== 3) return offers
    
    const searchYear = parseInt(searchDateParts[0] || '0', 10)
    const searchMonth = parseInt(searchDateParts[1] || '0', 10)
    const searchDay = parseInt(searchDateParts[2] || '0', 10)
    
    const filtered = offers.filter((offer) => {
      // Get first segment's departure date
      const firstSegment = offer.segments[0]
      if (!firstSegment?.departure?.dateTime) return false

      return matchesSearchDate(firstSegment.departure.dateTime, searchYear, searchMonth, searchDay)
    })

    return filtered.length > 0 ? filtered : offers
  }, [offers, searchData.departureDate, matchesSearchDate])

  // Apply filters to offers
  const filteredOffers = useMemo(() => {
    return applyFilters(dateFilteredOffers, filters)
  }, [dateFilteredOffers, filters])

  const sortedOffers = useMemo(() => {
    const list = [...filteredOffers]

    const getDepartureMinutes = (o: FlightOffer) => {
      const iso = o.segments?.[0]?.departure?.dateTime
      if (!iso) return 0
      const d = new Date(iso)
      return d.getUTCHours() * 60 + d.getUTCMinutes()
    }

    const getGrossPrice = (o: FlightOffer) => o.pricing.gross ?? o.pricing.total

    const getTotalLayoverMinutes = (o: FlightOffer) =>
      o.segments.flatMap((sg) => sg.segments).reduce((sum, s) => sum + (s.layover?.duration ?? 0), 0)

    const cmp = (a: FlightOffer, b: FlightOffer) => {
      switch (sortKey) {
        case 'dep-early-late':
          return getDepartureMinutes(a) - getDepartureMinutes(b)
        case 'dep-late-early':
          return getDepartureMinutes(b) - getDepartureMinutes(a)
        case 'price-low-high':
          return getGrossPrice(a) - getGrossPrice(b)
        case 'price-high-low':
          return getGrossPrice(b) - getGrossPrice(a)
        case 'layover-short-long':
          return getTotalLayoverMinutes(a) - getTotalLayoverMinutes(b)
        case 'layover-long-short':
          return getTotalLayoverMinutes(b) - getTotalLayoverMinutes(a)
        default:
          return 0
      }
    }

    if (sortKey !== 'none') list.sort(cmp)
    return list
  }, [filteredOffers, sortKey])

  // Filter two-oneway offers by search date first
  const dateFilteredTwoOneway = useMemo(() => {
    if (!twoOneway) return null
    
    // For multicity, we need to check each segment's date
    // For roundtrip, check outbound date matches departureDate, return date matches returnDate
    if (searchData.tripType === 'multicity' && searchData.segments) {
      // Multicity: filter each offer by its corresponding segment date
      let filteredOb = twoOneway.obOffers
      let filteredIb = twoOneway.ibOffers
      
      // Filter OB offers by first segment date
      if (searchData.segments[0]?.departureDate) {
        const obDateParts = searchData.segments[0].departureDate.split('-')
        if (obDateParts.length === 3) {
          const obYear = parseInt(obDateParts[0] || '0', 10)
          const obMonth = parseInt(obDateParts[1] || '0', 10)
          const obDay = parseInt(obDateParts[2] || '0', 10)
          
          filteredOb = twoOneway.obOffers.filter(offer => {
            const dep = offer.segments[0]?.departure?.dateTime
            if (!dep) return false
            return matchesSearchDate(dep, obYear, obMonth, obDay)
          })
        }
      }
      
      // Filter IB offers by second segment date
      if (searchData.segments[1]?.departureDate) {
        const ibDateParts = searchData.segments[1].departureDate.split('-')
        if (ibDateParts.length === 3) {
          const ibYear = parseInt(ibDateParts[0] || '0', 10)
          const ibMonth = parseInt(ibDateParts[1] || '0', 10)
          const ibDay = parseInt(ibDateParts[2] || '0', 10)
          
          filteredIb = twoOneway.ibOffers.filter(offer => {
            const dep = offer.segments[0]?.departure?.dateTime
            if (!dep) return false
            return matchesSearchDate(dep, ibYear, ibMonth, ibDay)
          })
        }
      }
      
      const hasAny = filteredOb.length > 0 || filteredIb.length > 0
      return hasAny ? { obOffers: filteredOb, ibOffers: filteredIb } : { obOffers: twoOneway.obOffers, ibOffers: twoOneway.ibOffers }
    } else {
      // Roundtrip: filter OB by departureDate, IB by returnDate
      let filteredOb = twoOneway.obOffers
      let filteredIb = twoOneway.ibOffers
      
      if (searchData.departureDate) {
        const depDateParts = searchData.departureDate.split('-')
        if (depDateParts.length === 3) {
          const depYear = parseInt(depDateParts[0] || '0', 10)
          const depMonth = parseInt(depDateParts[1] || '0', 10)
          const depDay = parseInt(depDateParts[2] || '0', 10)
          
          filteredOb = twoOneway.obOffers.filter(offer => {
            const dep = offer.segments[0]?.departure?.dateTime
            if (!dep) return false
            return matchesSearchDate(dep, depYear, depMonth, depDay)
          })
        }
      }
      
      if (searchData.returnDate) {
        const retDateParts = searchData.returnDate.split('-')
        if (retDateParts.length === 3) {
          const retYear = parseInt(retDateParts[0] || '0', 10)
          const retMonth = parseInt(retDateParts[1] || '0', 10)
          const retDay = parseInt(retDateParts[2] || '0', 10)
          
          filteredIb = twoOneway.ibOffers.filter(offer => {
            const dep = offer.segments[0]?.departure?.dateTime
            if (!dep) return false
            return matchesSearchDate(dep, retYear, retMonth, retDay)
          })
        }
      }
      
      const hasAny = filteredOb.length > 0 || filteredIb.length > 0
      return hasAny ? { obOffers: filteredOb, ibOffers: filteredIb } : { obOffers: twoOneway.obOffers, ibOffers: twoOneway.ibOffers }
    }
  }, [twoOneway, searchData, matchesSearchDate])

  // Apply filters to two-oneway offers
  const filteredTwoOneway = useMemo(() => {
    if (!dateFilteredTwoOneway) return null
    return {
      obOffers: applyFilters(dateFilteredTwoOneway.obOffers, filters),
      ibOffers: applyFilters(dateFilteredTwoOneway.ibOffers, filters),
    }
  }, [dateFilteredTwoOneway, filters])

  const sortedTwoOneway = useMemo(() => {
    if (!filteredTwoOneway) return null

    const getDepartureMinutes = (o: FlightOffer) => {
      const iso = o.segments?.[0]?.departure?.dateTime
      if (!iso) return 0
      const d = new Date(iso)
      return d.getUTCHours() * 60 + d.getUTCMinutes()
    }

    const getGrossPrice = (o: FlightOffer) => o.pricing.gross ?? o.pricing.total

    const getTotalLayoverMinutes = (o: FlightOffer) =>
      o.segments.flatMap((sg) => sg.segments).reduce((sum, s) => sum + (s.layover?.duration ?? 0), 0)

    const createCmp = (sort: ResultsSortKey) => (a: FlightOffer, b: FlightOffer) => {
      switch (sort) {
        case 'dep-early-late':
          return getDepartureMinutes(a) - getDepartureMinutes(b)
        case 'dep-late-early':
          return getDepartureMinutes(b) - getDepartureMinutes(a)
        case 'price-low-high':
          return getGrossPrice(a) - getGrossPrice(b)
        case 'price-high-low':
          return getGrossPrice(b) - getGrossPrice(a)
        case 'layover-short-long':
          return getTotalLayoverMinutes(a) - getTotalLayoverMinutes(b)
        case 'layover-long-short':
          return getTotalLayoverMinutes(b) - getTotalLayoverMinutes(a)
        default:
          return 0
      }
    }

    const ob = [...filteredTwoOneway.obOffers]
    const ib = [...filteredTwoOneway.ibOffers]
    
    if (obSortKey !== 'none') {
      ob.sort(createCmp(obSortKey))
    }
    if (ibSortKey !== 'none') {
      ib.sort(createCmp(ibSortKey))
    }
    
    return { obOffers: ob, ibOffers: ib }
  }, [filteredTwoOneway, obSortKey, ibSortKey])

  // Reset filters when offers are loaded (filterOptions changes with valid data)
  useEffect(() => {
    // Only reset when we have actual offers loaded
    const hasOffers = offers.length > 0 || (twoOneway && (twoOneway.obOffers.length > 0 || twoOneway.ibOffers.length > 0))
    if (hasOffers) {
      const availableAirlineCodes = new Set(filterOptions.airlines.map((a) => a.code))
      const initialPreferredAirlines = preferredAirlineCodes.filter((code) => availableAirlineCodes.has(code))

      setFilters({
        ...defaultFilters,
        ...(initialPreferredAirlines.length > 0 && { airlines: initialPreferredAirlines }),
        priceRange: filterOptions.priceRange,
        durationRange: filterOptions.durationRange,
      })
    }
  }, [filterOptions, offers.length, twoOneway, preferredAirlineCodes])
  
  // Also reset to default when starting a new search
  useEffect(() => {
    setFilters({
      ...defaultFilters,
      ...(preferredAirlineCodes.length > 0 && { airlines: preferredAirlineCodes }),
    })
  }, [searchData, preferredAirlineCodes])

  // Calculate counts
  const totalCount = twoOneway
    ? twoOneway.obOffers.length + twoOneway.ibOffers.length
    : offers.length
  
  const filteredCount = filteredTwoOneway
    ? filteredTwoOneway.obOffers.length + filteredTwoOneway.ibOffers.length
    : filteredOffers.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
            Searching for flights...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-2 sm:px-4 py-2">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
            Search Error
          </h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  if (!twoOneway && offers.length === 0) {
    return (
      <div className="px-2 sm:px-4 py-2">
        <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-white/10 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No flights found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search criteria or dates
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      {/* Filter Sidebar */}
      <FlightFilterSidebar
        filters={filters}
        onFiltersChange={setFilters}
        priceRange={filterOptions.priceRange}
        durationRange={filterOptions.durationRange}
        airlines={filterOptions.airlines}
        layoverAirports={filterOptions.layoverAirports}
        allianceOptions={filterOptions.allianceOptions}
        stopsOptions={filterOptions.stopsOptions}
        isMobileOpen={isMobileFilterOpen}
        onMobileClose={() => setIsMobileFilterOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="px-2 sm:px-4 py-2 flex flex-col">
          {/* Sort controls: airline bar, then Filters (when collapsed), then sort bar */}
          <div className="flex flex-col">
            {/* Airline filter bar - first when sidebar collapsed */}
            {filterOptions.airlines.length > 0 && (
              <div className="mb-[5px]">
                <AirlineSortBar
                  airlines={filterOptions.airlines}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
            )}

            {/* Filters + Date switch row - below airline filterbar, above sortbar (when sidebar collapsed) */}
            <div className="sidebar-expanded:hidden mb-[5px]">
              <div className={showDateNavigator ? 'grid grid-cols-[auto_1fr] gap-2' : ''}>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-950 
                    border border-gray-200/80 dark:border-white/10 rounded-lg shadow-sm 
                    text-sm font-medium text-gray-700 dark:text-gray-200 
                    hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filters</span>
                  {filteredCount < totalCount && (
                    <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                      {filteredCount}
                    </span>
                  )}
                </button>

                {showDateNavigator && (
                  <DateShiftNavigator
                    dateLabel={dateLabel}
                    dateValue={activeDate}
                    disabled={loading}
                    {...(onDateShift && { onDateShift })}
                    {...(onDateSelect && { onDateSelect })}
                  />
                )}
              </div>
            </div>

            {/* Sort bar (Departure, Price, Layover) - only for non-two-oneway results */}
            {!filteredTwoOneway && (
              <ResultsSortBar value={sortKey} onChange={setSortKey} />
            )}

            {/* Results count (below sort bars, above cards) */}
            <div className="mt-[10px]">
              <FlightResultsHeader
                count={filteredCount}
                traceId={traceId}
                showDateNavigator={showDateNavigator}
                dateLabel={dateLabel}
                dateValue={activeDate}
                onPrevDate={() => onDateShift?.(-1)}
                onNextDate={() => onDateShift?.(1)}
                dateNavDisabled={loading}
                {...(onModifySearch && { onModifySearch })}
                {...(onDateSelect && { onDateSelect })}
              />
            </div>
          </div>

          {/* No results after filtering */}
          {filteredCount === 0 && totalCount > 0 && (
            <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
                No flights match your filters
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
                {totalCount} flights available. Try adjusting your filter criteria.
              </p>
              <button
                type="button"
                onClick={() => setFilters({
                  ...defaultFilters,
                  priceRange: filterOptions.priceRange,
                  durationRange: filterOptions.durationRange,
                })}
                className="text-sm font-medium text-primary hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}

          {/* Flight Cards */}
          {filteredTwoOneway ? (
            <div className="mt-0">
              <TwoOnewayResultsGrid
              obOffers={(sortedTwoOneway ?? filteredTwoOneway).obOffers}
              ibOffers={(sortedTwoOneway ?? filteredTwoOneway).ibOffers}
              tripType={searchData.tripType}
              obSortKey={obSortKey}
              ibSortKey={ibSortKey}
              onObSortChange={setObSortKey}
              onIbSortChange={setIbSortKey}
              {...(traceId && { traceId })}
              {...(onBookNow && { onBookNow })}
              {...(onFlightSelect && { onFlightSelect })}
            />
            </div>
          ) : (
            <div className="mt-0">
              <FlightResultsList
              offers={sortedOffers}
              tripType={searchData.tripType}
              {...(onFlightSelect && { onFlightSelect })}
            />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
