// UI search form types
import type { AirportOption } from '@/components/flight/airport-selection/AirportSelection'
import type { TravelerData } from '@/components/flight/traveler-selection'

export type TripType = 'oneway' | 'roundtrip' | 'multicity'
export type FareType = 'regular' | 'student' | 'seaman'

export interface MulticitySegment {
  id?: string
  from: AirportOption | null
  to: AirportOption | null
  departureDate: string
}

export interface SearchFormData {
  tripType: TripType
  from: AirportOption | null
  to: AirportOption | null
  departureDate: string
  returnDate?: string
  /**
   * Used when `tripType === 'multicity'`.
   * Frontend URL carries `segments=` JSON which is transformed into API `originDest[]`.
   */
  segments?: MulticitySegment[]
  travelerData: TravelerData
  preferredAirline: string
  fareType: FareType
}

export interface FlightSearchParams {
  tripType: 'Oneway' | 'Return' | 'Circle'
  from: string
  to: string
  departureDate: string
  returnDate?: string
  adults: number
  children: number
  infants: number
  childrenAges: number[]
  travelClass: 'Economy' | 'PremiumEconomy' | 'Business' | 'First'
  preferredAirlines: string[]
}
