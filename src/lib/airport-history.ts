// Airport selection history management

export interface AirportHistoryItem {
  iata: string
  name: string
  city: string
  country: string
  timestamp: number
}

const STORAGE_KEY = 'airport_selection_history'
const MAX_HISTORY_ITEMS = 5

// Get recent airport selections from localStorage
export function getRecentAirports(): AirportHistoryItem[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const history: AirportHistoryItem[] = JSON.parse(stored) as AirportHistoryItem[]

    // Sort by timestamp (most recent first) and limit to MAX_HISTORY_ITEMS
    return history.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_HISTORY_ITEMS)
  } catch (error) {
    console.error('Error reading airport history:', error)
    return []
  }
}

// Add an airport to the selection history
export function addToAirportHistory(airport: {
  iata: string
  name: string
  city: string
  country: string
}) {
  if (typeof window === 'undefined') return

  try {
    const existing = getRecentAirports()

    // Remove any existing entry for this airport
    const filtered = existing.filter((item) => item.iata !== airport.iata)

    // Add the new entry at the beginning
    const updated: AirportHistoryItem[] = [
      {
        ...airport,
        timestamp: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_HISTORY_ITEMS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving airport history:', error)
  }
}

// Clear airport history
export function clearAirportHistory() {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing airport history:', error)
  }
}

// Popular Bangladesh airports
export const POPULAR_BANGLADESH_AIRPORTS = [
  {
    iata: 'DAC',
    name: 'Hazrat Shahjalal International Airport',
    city: 'Dhaka',
    country: 'Bangladesh',
  },
  {
    iata: 'CGP',
    name: 'Shah Amanat International Airport',
    city: 'Chittagong',
    country: 'Bangladesh',
  },
  { iata: 'ZYL', name: 'Osmany International Airport', city: 'Sylhet', country: 'Bangladesh' },
  { iata: 'CXB', name: "Cox's Bazar Airport", city: "Cox's Bazar", country: 'Bangladesh' },
  { iata: 'JSR', name: 'Jessore Airport', city: 'Jessore', country: 'Bangladesh' },
  { iata: 'SPD', name: 'Saidpur Airport', city: 'Saidpur', country: 'Bangladesh' },
  { iata: 'RJH', name: 'Rajshahi Airport', city: 'Rajshahi', country: 'Bangladesh' },
  { iata: 'BZL', name: 'Barisal Airport', city: 'Barisal', country: 'Bangladesh' },
]
