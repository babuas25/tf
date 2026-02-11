// Utility functions for multi-city flight searches
import { getCityInfo } from '@/components/flight/airport-selection/city-airport-mapping'
import type { SearchFormData } from '@/types/flight/ui/search-form.types'

/**
 * Check if a multi-city search is domestic (all airports in the same country)
 * @param searchData - The search form data
 * @returns true if all airports are in the same country, false otherwise
 */
export function isMulticityDomestic(searchData: SearchFormData): boolean {
  if (searchData.tripType !== 'multicity' || !searchData.segments || searchData.segments.length === 0) {
    return false
  }

  // Collect all unique airports from segments
  const airports = new Set<string>()
  
  for (const segment of searchData.segments) {
    if (segment.from?.iata) {
      airports.add(segment.from.iata)
    }
    if (segment.to?.iata) {
      airports.add(segment.to.iata)
    }
  }

  // Get country codes for all airports
  const countryCodes = new Set<string>()
  
  for (const airport of airports) {
    const cityInfo = getCityInfo(airport)
    if (!cityInfo || !cityInfo.countryCode) {
      // If we can't determine the country for any airport, assume it's not domestic
      return false
    }
    countryCodes.add(cityInfo.countryCode)
  }

  // If all airports are in the same country, it's domestic
  return countryCodes.size === 1
}

/**
 * Check if multi-city search has exactly 2 segments/trips
 * @param searchData - The search form data
 * @returns true if exactly 2 segments, false otherwise
 */
export function isMulticityTwoSegments(searchData: SearchFormData): boolean {
  return searchData.tripType === 'multicity' && 
         searchData.segments !== undefined && 
         searchData.segments.length === 2
}

/**
 * Check if multi-city search should be displayed as TwoOneWay
 * Conditions: domestic + 2 segments/trip only
 * @param searchData - The search form data
 * @returns true if should display as TwoOneWay, false otherwise
 */
export function shouldDisplayAsTwoOneway(searchData: SearchFormData): boolean {
  return isMulticityTwoSegments(searchData) && isMulticityDomestic(searchData)
}
