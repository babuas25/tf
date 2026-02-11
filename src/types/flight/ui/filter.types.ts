// Filter types for flight search results

export type StopFilter = 'all' | 'non-stop' | '1-stop' | '2-plus'

export type TimeSlot = '00-06' | '06-12' | '12-18' | '18-24'

export type LayoverTime = '0h-5h' | '5h-10h' | '10h-15h' | '15h+'

export type Alliance = 'Star Alliance' | 'Oneworld' | 'SkyTeam'

export interface PriceRange {
  min: number
  max: number
}

export interface DurationRange {
  min: number // in minutes
  max: number // in minutes
}

export interface FlightFilters {
  // Stops filter
  stops: StopFilter[]
  
  // Refundable filter
  refundableOnly: boolean
  
  // Price range
  priceRange: PriceRange
  
  // Duration range
  durationRange: DurationRange
  
  // Departure time slots
  departureTimeSlots: TimeSlot[]
  
  // Layover time
  layoverTime: LayoverTime[]
  
  // Alliances
  alliances: Alliance[]
  
  // Airlines (dynamic based on results)
  airlines: string[]
  
  // Layover airports (dynamic based on results)
  layoverAirports: string[]
}

export interface FilterOption<T = string> {
  value: T
  label: string
  count?: number
  price?: number
  disabled?: boolean
}

export interface AirlineFilterOption extends FilterOption {
  code: string
  logo?: string
}

export interface AirportFilterOption extends FilterOption {
  code: string
  name: string
  price?: number
}

export interface AllianceFilterOption extends FilterOption<Alliance> {
  count: number
}

// Default filter values
export const defaultFilters: FlightFilters = {
  stops: [],
  refundableOnly: false,
  priceRange: { min: 0, max: Infinity },
  durationRange: { min: 0, max: Infinity },
  departureTimeSlots: [],
  layoverTime: [],
  alliances: [],
  airlines: [],
  layoverAirports: [],
}

// Helper to format duration from minutes
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

// Helper to format price
export function formatPrice(price: number, currency: string = 'BDT'): string {
  return `${currency} ${price.toLocaleString()}`
}
