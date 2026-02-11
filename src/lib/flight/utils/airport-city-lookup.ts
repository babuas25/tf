// Utility to get city name from airport IATA code using airports.json
import airportsData from '@/components/flight/airport-selection/airports.json'

// Create a lookup map for fast access (IATA -> city)
const airportCityMap = new Map<string, string>()

// Initialize the map from airports.json
if (Array.isArray(airportsData)) {
  airportsData.forEach((airport: Record<string, unknown>) => {
    const iata = airport.iata
    const city = airport.city
    
    if (
      iata && 
      city && 
      typeof iata === 'string' && 
      typeof city === 'string'
    ) {
      const iataCode = iata.trim().toUpperCase()
      airportCityMap.set(iataCode, city)
    }
  })
}

/**
 * Get city name for an airport IATA code
 * @param iataCode - Airport IATA code (e.g., "DAC", "LAX")
 * @returns City name if found, otherwise returns the IATA code as fallback
 */
export function getAirportCity(iataCode: string | undefined): string {
  if (!iataCode) return ''
  
  const normalizedIata = iataCode.trim().toUpperCase()
  return airportCityMap.get(normalizedIata) || normalizedIata
}
