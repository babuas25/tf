import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'
import type {
  AirlineFilterOption,
  AirportFilterOption,
  AllianceFilterOption,
  Alliance,
  DurationRange,
  FlightFilters,
  PriceRange,
  StopFilter,
} from '@/types/flight/ui/filter.types'

// Alliance mapping for airlines
const AIRLINE_ALLIANCES: Record<string, Alliance> = {
  // Star Alliance
  'TK': 'Star Alliance', // Turkish Airlines
  'SQ': 'Star Alliance', // Singapore Airlines
  'LH': 'Star Alliance', // Lufthansa
  'UA': 'Star Alliance', // United
  'NH': 'Star Alliance', // ANA
  'AC': 'Star Alliance', // Air Canada
  'TG': 'Star Alliance', // Thai Airways
  'OS': 'Star Alliance', // Austrian
  'SK': 'Star Alliance', // SAS
  'LO': 'Star Alliance', // LOT Polish
  'ET': 'Star Alliance', // Ethiopian
  'MS': 'Star Alliance', // EgyptAir
  'AI': 'Star Alliance', // Air India

  // Oneworld
  'QR': 'Oneworld', // Qatar Airways
  'BA': 'Oneworld', // British Airways
  'CX': 'Oneworld', // Cathay Pacific
  'JL': 'Oneworld', // Japan Airlines
  'AA': 'Oneworld', // American Airlines
  'QF': 'Oneworld', // Qantas
  'MH': 'Oneworld', // Malaysia Airlines
  'UL': 'Oneworld', // SriLankan Airlines
  'AY': 'Oneworld', // Finnair
  'IB': 'Oneworld', // Iberia

  // SkyTeam
  'EK': 'SkyTeam', // Note: Emirates is not in SkyTeam but often grouped
  'KE': 'SkyTeam', // Korean Air
  'AF': 'SkyTeam', // Air France
  'KL': 'SkyTeam', // KLM
  'DL': 'SkyTeam', // Delta
  'SU': 'SkyTeam', // Aeroflot
  'MU': 'SkyTeam', // China Eastern
  'CZ': 'SkyTeam', // China Southern
  'VN': 'SkyTeam', // Vietnam Airlines
  'GA': 'SkyTeam', // Garuda Indonesia
}

export interface ExtractedFilterOptions {
  priceRange: PriceRange
  durationRange: DurationRange
  airlines: AirlineFilterOption[]
  layoverAirports: AirportFilterOption[]
  allianceOptions: AllianceFilterOption[]
  stopsOptions: { value: StopFilter; label: string; count: number }[]
}

/**
 * Extract filter options from flight offers
 */
export function extractFilterOptions(offers: FlightOffer[]): ExtractedFilterOptions {
  if (offers.length === 0) {
    return {
      priceRange: { min: 0, max: 100000 },
      durationRange: { min: 0, max: 2400 },
      airlines: [],
      layoverAirports: [],
      allianceOptions: [],
      stopsOptions: [],
    }
  }

  // Price range - use gross amount (fallback to total if not available)
  const prices = offers.map((o) => o.pricing.gross ?? o.pricing.total)
  const priceRange: PriceRange = {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices)),
  }

  // Duration range (total journey duration) - calculate from actual departure/arrival times
  const durations = offers.flatMap((o) =>
    o.segments.map((seg) => {
      // Calculate duration from departure to arrival times (more reliable)
      const departureTime = new Date(seg.departure.dateTime).getTime()
      const arrivalTime = new Date(seg.arrival.dateTime).getTime()
      const durationMinutes = Math.round((arrivalTime - departureTime) / (1000 * 60))
      return durationMinutes > 0 ? durationMinutes : seg.totalDuration
    })
  )
  const validDurations = durations.filter((d) => d > 0 && d < 10000) // Filter out invalid durations (> ~7 days)
  const durationRange: DurationRange = validDurations.length > 0
    ? {
        min: Math.floor(Math.min(...validDurations)),
        max: Math.ceil(Math.max(...validDurations)),
      }
    : { min: 0, max: 2400 } // Default fallback (40 hours)

  // Airlines
  const airlineMap = new Map<string, { name: string; count: number; minPrice: number }>()
  for (const offer of offers) {
    const code = offer.validatingCarrier.code
    const name = offer.validatingCarrier.name
    const grossPrice = offer.pricing.gross ?? offer.pricing.total
    const existing = airlineMap.get(code)
    if (existing) {
      existing.count++
      existing.minPrice = Math.min(existing.minPrice, grossPrice)
    } else {
      airlineMap.set(code, { name, count: 1, minPrice: grossPrice })
    }
  }
  const airlines: AirlineFilterOption[] = Array.from(airlineMap.entries())
    .map(([code, data]) => ({
      value: code,
      label: data.name || code,
      code,
      count: data.count,
      price: data.minPrice,
    }))
    .sort((a, b) => b.count - a.count)

  // Layover airports
  const airportMap = new Map<string, { count: number; minPrice: number }>()
  for (const offer of offers) {
    const grossPrice = offer.pricing.gross ?? offer.pricing.total
    for (const segmentGroup of offer.segments) {
      for (const segment of segmentGroup.segments) {
        if (segment.layover) {
          const code = segment.layover.airport
          const existing = airportMap.get(code)
          if (existing) {
            existing.count++
            existing.minPrice = Math.min(existing.minPrice, grossPrice)
          } else {
            airportMap.set(code, { count: 1, minPrice: grossPrice })
          }
        }
      }
    }
  }
  const layoverAirports: AirportFilterOption[] = Array.from(airportMap.entries())
    .map(([code, data]) => ({
      value: code,
      label: code,
      code,
      name: `${code} Airport`,
      count: data.count,
      price: data.minPrice,
    }))
    .sort((a, b) => (a.price || 0) - (b.price || 0))

  // Alliances
  const allianceCounts: Record<Alliance, number> = {
    'Star Alliance': 0,
    'Oneworld': 0,
    'SkyTeam': 0,
  }
  for (const offer of offers) {
    const alliance = AIRLINE_ALLIANCES[offer.validatingCarrier.code]
    if (alliance) {
      allianceCounts[alliance]++
    }
  }
  const allianceOptions: AllianceFilterOption[] = ([
    { value: 'Star Alliance' as const, label: 'Star Alliance', count: allianceCounts['Star Alliance'] },
    { value: 'Oneworld' as const, label: 'Oneworld', count: allianceCounts['Oneworld'] },
    { value: 'SkyTeam' as const, label: 'SkyTeam', count: allianceCounts['SkyTeam'] },
  ] as AllianceFilterOption[]).filter((a) => a.count > 0)

  // Stops
  const stopsCounts = { 'non-stop': 0, '1-stop': 0, '2-plus': 0 }
  for (const offer of offers) {
    // Get max stops across all segment groups
    const maxStops = Math.max(...offer.segments.map((seg) => seg.stops))
    if (maxStops === 0) {
      stopsCounts['non-stop']++
    } else if (maxStops === 1) {
      stopsCounts['1-stop']++
    } else {
      stopsCounts['2-plus']++
    }
  }
  const stopsOptions: { value: StopFilter; label: string; count: number }[] = ([
    { value: 'non-stop' as const, label: 'Non-Stop', count: stopsCounts['non-stop'] },
    { value: '1-stop' as const, label: '1 Stop', count: stopsCounts['1-stop'] },
    { value: '2-plus' as const, label: '2+ Stops', count: stopsCounts['2-plus'] },
  ] as { value: StopFilter; label: string; count: number }[]).filter((s) => s.count > 0)

  return {
    priceRange,
    durationRange,
    airlines,
    layoverAirports,
    allianceOptions,
    stopsOptions,
  }
}

/**
 * Check if a range filter should be applied (is valid and not at default values)
 */
function isRangeFilterActive(min: number, max: number): boolean {
  // Skip if using default/invalid values
  if (max === Infinity || max === 0) return false
  if (!isFinite(min) || !isFinite(max)) return false
  if (min > max) return false
  return true
}

/**
 * Apply filters to flight offers
 */
export function applyFilters(offers: FlightOffer[], filters: FlightFilters): FlightOffer[] {
  return offers.filter((offer) => {
    // Stops filter
    if (filters.stops.length > 0) {
      const maxStops = Math.max(...offer.segments.map((seg) => seg.stops))
      let stopCategory: StopFilter
      if (maxStops === 0) stopCategory = 'non-stop'
      else if (maxStops === 1) stopCategory = '1-stop'
      else stopCategory = '2-plus'
      if (!filters.stops.includes(stopCategory)) return false
    }

    // Refundable filter
    if (filters.refundableOnly && !offer.refundable) {
      return false
    }

    // Price range filter - only apply if range is valid (use gross amount)
    if (isRangeFilterActive(filters.priceRange.min, filters.priceRange.max)) {
      const price = offer.pricing.gross ?? offer.pricing.total
      if (price < filters.priceRange.min || price > filters.priceRange.max) {
        return false
      }
    }

    // Duration filter - only apply if range is valid
    if (isRangeFilterActive(filters.durationRange.min, filters.durationRange.max)) {
      // Calculate duration from actual departure/arrival times
      const segmentDurations = offer.segments.map((seg) => {
        const departureTime = new Date(seg.departure.dateTime).getTime()
        const arrivalTime = new Date(seg.arrival.dateTime).getTime()
        return Math.round((arrivalTime - departureTime) / (1000 * 60))
      })
      const maxDuration = Math.max(...segmentDurations.filter((d) => d > 0))
      if (maxDuration > 0 && (maxDuration < filters.durationRange.min || maxDuration > filters.durationRange.max)) {
        return false
      }
    }

    // Departure time filter
    if (filters.departureTimeSlots.length > 0) {
      const depIso = offer.segments[0]?.departure?.dateTime
      if (!depIso) return false
      const departureHour = parseInt(
        new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'UTC' }).format(
          new Date(depIso)
        ),
        10
      )
      let inTimeSlot = false
      for (const slot of filters.departureTimeSlots) {
        if (slot === '00-06' && departureHour >= 0 && departureHour < 6) inTimeSlot = true
        if (slot === '06-12' && departureHour >= 6 && departureHour < 12) inTimeSlot = true
        if (slot === '12-18' && departureHour >= 12 && departureHour < 18) inTimeSlot = true
        if (slot === '18-24' && departureHour >= 18 && departureHour < 24) inTimeSlot = true
      }
      if (!inTimeSlot) return false
    }

    // Layover time filter
    if (filters.layoverTime.length > 0) {
      const layoverMinutes = offer.segments.flatMap((seg) =>
        seg.segments.filter((s) => s.layover).map((s) => s.layover!.duration)
      )
      if (layoverMinutes.length > 0) {
        const maxLayover = Math.max(...layoverMinutes)
        let inTimeRange = false
        for (const range of filters.layoverTime) {
          if (range === '0h-5h' && maxLayover >= 0 && maxLayover < 300) inTimeRange = true
          if (range === '5h-10h' && maxLayover >= 300 && maxLayover < 600) inTimeRange = true
          if (range === '10h-15h' && maxLayover >= 600 && maxLayover < 900) inTimeRange = true
          if (range === '15h+' && maxLayover >= 900) inTimeRange = true
        }
        if (!inTimeRange) return false
      }
    }

    // Alliance filter
    if (filters.alliances.length > 0) {
      const airline = offer.validatingCarrier.code
      const alliance = AIRLINE_ALLIANCES[airline]
      if (!alliance || !filters.alliances.includes(alliance)) {
        return false
      }
    }

    // Airlines filter
    if (filters.airlines.length > 0) {
      if (!filters.airlines.includes(offer.validatingCarrier.code)) {
        return false
      }
    }

    // Layover airports filter
    if (filters.layoverAirports.length > 0) {
      const layoverAirports = offer.segments.flatMap((seg) =>
        seg.segments.filter((s) => s.layover).map((s) => s.layover!.airport)
      )
      const hasMatchingAirport = layoverAirports.some((airport) =>
        filters.layoverAirports.includes(airport)
      )
      if (!hasMatchingAirport) return false
    }

    return true
  })
}
