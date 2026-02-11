import { cityAirportMapping } from '@/components/flight/airport-selection/city-airport-mapping'
import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'

/** Bangladesh airport IATA codes (for routes entirely within Bangladesh). */
const BANGLADESH_AIRPORT_CODES = new Set([
  'DAC', 'CGP', 'ZYL', 'CXB', 'JSR', 'SPD', 'RJH', 'BZL',
])

function isAirportInBangladesh(iata: string): boolean {
  const code = iata?.trim().toUpperCase()
  if (!code) return false
  const mapping = cityAirportMapping[code]
  if (mapping) return mapping.countryCode === 'BD'
  return BANGLADESH_AIRPORT_CODES.has(code)
}

/**
 * Returns true if the offer is a domestic Bangladesh route (all segments
 * only touch airports in Bangladesh). For such routes we do not show
 * operating carrier info on the flight card.
 */
export function isDomesticBangladeshOffer(offer: FlightOffer): boolean {
  if (!offer?.segments?.length) return false
  for (const group of offer.segments) {
    if (!isAirportInBangladesh(group.departure?.airport)) return false
    if (!isAirportInBangladesh(group.arrival?.airport)) return false
    for (const segment of group.segments) {
      if (!isAirportInBangladesh(segment.departure?.airport)) return false
      if (!isAirportInBangladesh(segment.arrival?.airport)) return false
    }
  }
  return true
}
