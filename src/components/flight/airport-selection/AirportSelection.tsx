'use client'

import { MapPin, PlaneTakeoff, Clock, Star } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Input } from '@/components/ui/input'
import {
  getRecentAirports,
  addToAirportHistory,
  POPULAR_BANGLADESH_AIRPORTS,
} from '@/lib/airport-history'
import { cn } from '@/lib/utils'

import airportsRaw from './airports.json'
import { getCityInfo, isMultiAirportCity } from './city-airport-mapping'

type AirportRecord = {
  iata: string
  name: string
  city?: string
  country?: string
  iso: string
  continent: string
  type: string
  status: number
  lat?: number | string
  lon?: number | string
  size?: string | null
}

export type AirportOption = {
  id: string
  name: string
  city: string
  country: string
  iata: string
  isCity?: boolean // Flag to indicate if this is a city group
  cityCode?: string | undefined // Metro area code for city groups
  isRecent?: boolean // Flag to indicate if this is a recent selection
  isPopular?: boolean // Flag to indicate if this is a popular airport
}

export type CityGroup = {
  cityCode: string
  city: string
  country: string
  airports: AirportOption[]
}

const airports = airportsRaw as AirportRecord[]

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function startsWithNormalized(haystack: string, needle: string) {
  const h = normalize(haystack)
  const n = normalize(needle)
  if (!n) return true
  return h.startsWith(n)
}

function includesWordStart(haystack: string, needle: string) {
  const h = normalize(haystack)
  const n = normalize(needle)
  if (!n) return true
  return h
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .some((w) => w.startsWith(n))
}

type AirportSelectionProps = {
  label: string
  value: AirportOption | null
  onChange: (airport: AirportOption) => void
  inputId: string
  inputName: string
  placeholder?: string
  className?: string
}

export function AirportSelection({
  label,
  value,
  onChange,
  inputId,
  inputName,
  placeholder,
  className,
}: AirportSelectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recentAirports, setRecentAirports] = useState<AirportOption[]>([])
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setDropdownPosition(null)
    } else if (containerRef.current) {
      // Calculate position for portal
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownPosition({
        // Portal uses `position: fixed`, so coordinates are viewport-based.
        // Do NOT add scroll offsets here, otherwise the dropdown "drifts"
        // when the page is scrolled (e.g. Trip 2/3/4 in multicity).
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      })
    }
  }, [open])

  // Reset query when value changes from parent (e.g., when swapping locations)
  useEffect(() => {
    if (!open) {
      setQuery('')
      setDropdownPosition(null)
    }
  }, [value, open])

  useEffect(() => {
    // Load recent airports when component mounts or opens
    if (open) {
      const recent = getRecentAirports()
      const recentOptions: AirportOption[] = recent.map((item, index) => ({
        id: `recent-${item.iata}-${index}`,
        name: item.name,
        city: item.city,
        country: item.country,
        iata: item.iata,
        isRecent: true,
      }))
      setRecentAirports(recentOptions)
    }
  }, [open])

  useEffect(() => {
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const el = containerRef.current
      if (!el) return
      const target = e.target as Node | null
      const dropdownEl = dropdownRef.current
      if (target && (el.contains(target) || dropdownEl?.contains(target))) return
      setOpen(false)
    }

    function updateDropdownPosition() {
      if (open && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width
        })
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
    
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = normalize(query)

    // Convert raw airport data to AirportOption format
    const allAirports = airports
      .filter(
        (a) => typeof a.iata === 'string' && a.iata.trim().length === 3 && a.status === 1 && a.name,
      )
      .map((a, index) => {
        const cityInfo = getCityInfo(a.iata)

        return {
          id: `${a.iata}-${index}`, // Make ID unique by adding index
          name: a.name || '',
          city: cityInfo?.city || a.city || extractCityFromName(a.name || ''),
          country: cityInfo?.country || a.country || getCountryName(a.iso),
          iata: a.iata.trim().toUpperCase(),
          cityCode: cityInfo?.cityCode,
        }
      })

    if (!q) {
      // When no query, show recent airports first, then popular Bangladesh airports
      const results: AirportOption[] = []

      // Add recent airports if any
      if (recentAirports.length > 0) {
        results.push(...recentAirports)
      }

      // Add popular Bangladesh airports
      const popularOptions: AirportOption[] = POPULAR_BANGLADESH_AIRPORTS.map((airport, index) => ({
        id: `popular-${airport.iata}-${index}`,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        iata: airport.iata,
        isPopular: true,
      }))

      // Filter out popular airports that are already in recent
      const recentIatas = new Set(recentAirports.map((a) => a.iata))
      const filteredPopular = popularOptions.filter((a) => !recentIatas.has(a.iata))

      results.push(...filteredPopular)

      // Add some other popular international airports if we have space
      if (results.length < 15) {
        const internationalPopular = allAirports
          .filter((a) => ['LHR', 'JFK', 'DXB', 'SIN', 'BKK', 'CDG', 'NRT', 'LAX'].includes(a.iata))
          .filter((a) => !recentIatas.has(a.iata))
          .slice(0, 15 - results.length)

        results.push(...internationalPopular)
      }

      return results.slice(0, 20)
    }

    // Filter and score airports based on query
    const scoredAirports = allAirports
      .map((airport) => ({
        airport,
        score: getRelevanceScore(airport, q),
      }))
      .filter(({ score }) => score > 0) // Only include airports with some relevance

    // For short queries (3 letters or less), be more restrictive
    let filteredAirports = scoredAirports
    if (q.length <= 3) {
      // Only keep high-scoring results for short queries
      const minScore = q === 'lon' ? 500 : 100 // Higher threshold for "lon"
      filteredAirports = scoredAirports.filter(({ score }) => score >= minScore)
    }

    const finalAirports = filteredAirports
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .map(({ airport }) => airport)

    return createGroupedResults(finalAirports).slice(0, 50)
  }, [query])

  // Helper function to create grouped results
  function createGroupedResults(airports: AirportOption[]): AirportOption[] {
    const results: AirportOption[] = []
    const cityGroups = new Map<string, AirportOption[]>()
    const singleAirports: AirportOption[] = []

    // Group airports by city
    airports.forEach((airport) => {
      if (airport.cityCode && isMultiAirportCity(airport.cityCode)) {
        if (!cityGroups.has(airport.cityCode)) {
          cityGroups.set(airport.cityCode, [])
        }
        cityGroups.get(airport.cityCode)!.push(airport)
      } else {
        singleAirports.push(airport)
      }
    })

    // Add city groups first, sorted by relevance
    Array.from(cityGroups.entries())
      .sort(([, a], [, b]) => a[0]?.city.localeCompare(b[0]?.city || '') || 0)
      .forEach(([cityCode, cityAirports]) => {
        const firstAirport = cityAirports[0]
        if (!firstAirport) return

        // Add city group header
        results.push({
          id: `city-group-${cityCode}`,
          name: 'All Airports',
          city: firstAirport.city,
          country: firstAirport.country,
          iata: cityCode.replace('_CITY', ''),
          isCity: true,
          cityCode: cityCode,
        })

        // Add individual airports under the city
        cityAirports
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((airport) => {
            results.push(airport)
          })
      })

    // Add single airports
    singleAirports
      .sort((a, b) => {
        const byCity = a.city.localeCompare(b.city)
        if (byCity !== 0) return byCity
        return a.name.localeCompare(b.name)
      })
      .forEach((airport) => {
        results.push(airport)
      })

    return results
  }

  // Helper function to calculate search relevance score
  function getRelevanceScore(airport: AirportOption, query: string): number {
    const q = normalize(query)
    let score = 0

    // Special handling for common city codes - be very specific
    if (q === 'lon') {
      // Only allow London, UK airports
      if (normalize(airport.city) === 'london' && normalize(airport.country) === 'united kingdom') {
        if (normalize(airport.iata) === q) {
          score = 1000 // Exact IATA match
        } else {
          score = 800 // London airport
        }
      } else {
        // Exclude everything else for "LON" query
        return 0
      }
      return score
    }

    if (q === 'new') {
      // Only allow New York, USA airports
      if (
        normalize(airport.city) === 'new york' &&
        normalize(airport.country) === 'united states'
      ) {
        score = 800
      } else {
        return 0
      }
      return score
    }

    if (q === 'par') {
      // Only allow Paris, France airports
      if (normalize(airport.city) === 'paris' && normalize(airport.country) === 'france') {
        score = 800
      } else {
        return 0
      }
      return score
    }

    // For other 3-letter queries, prioritize exact IATA matches heavily
    if (q.length === 3) {
      // Exact IATA match gets HIGHEST priority
      if (normalize(airport.iata) === q) {
        score = 2000 // Very high score for exact IATA match
      }

      // City name starts with query gets lower priority
      else if (startsWithNormalized(airport.city, q)) {
        score = 500
      }

      // Airport name starts with query gets even lower priority
      else if (startsWithNormalized(airport.name, q)) {
        score = 300
      }

      return score
    }

    // For longer queries, use more flexible matching
    // Exact IATA match gets highest priority
    if (normalize(airport.iata) === q) score += 2000

    // IATA starts with query
    if (startsWithNormalized(airport.iata, q)) score += 1500

    // City name starts with query gets high priority
    if (startsWithNormalized(airport.city, q)) score += 500

    // Airport name starts with query
    if (startsWithNormalized(airport.name, q)) score += 300

    // Country starts with query
    if (startsWithNormalized(airport.country, q)) score += 100

    // Word boundaries in city name
    if (includesWordStart(airport.city, q)) score += 50

    // Word boundaries in airport name
    if (includesWordStart(airport.name, q)) score += 25

    // Word boundaries in country name
    if (includesWordStart(airport.country, q)) score += 10

    return score
  }

  // Helper function to extract city from airport name (fallback)
  function extractCityFromName(name: string): string {
    const airportKeywords = [
      'International Airport',
      'Airport',
      'International',
      'Regional',
      'Municipal',
      'Airfield',
      'Heliport',
      'Station',
    ]

    // Try to find the first keyword and extract everything before it
    for (const keyword of airportKeywords) {
      const idx = name.indexOf(keyword)
      if (idx !== -1) {
        const extracted = name.substring(0, idx).trim()
        // If the extracted part has multiple words, take the first word as the city
        const words = extracted.split(/\s+/)
        const firstWord = words[0]
        if (words.length > 0 && firstWord && firstWord.length > 2) {
          return firstWord
        }
      }
    }

    // If no keyword found, take the first word if it's reasonable
    const words = name.split(/\s+/)
    const firstWord = words[0]
    if (firstWord && firstWord.length > 2) {
      return firstWord
    }

    return name
  }

  // Helper function to get country name from ISO code (basic mapping)
  function getCountryName(iso: string): string {
    const countryMap: Record<string, string> = {
      US: 'United States',
      GB: 'United Kingdom',
      FR: 'France',
      DE: 'Germany',
      IT: 'Italy',
      ES: 'Spain',
      JP: 'Japan',
      CN: 'China',
      IN: 'India',
      BD: 'Bangladesh',
      NP: 'Nepal',
      LK: 'Sri Lanka',
      PK: 'Pakistan',
      AE: 'United Arab Emirates',
      TH: 'Thailand',
      SG: 'Singapore',
      HK: 'Hong Kong',
      TR: 'Turkey',
      RU: 'Russia',
      // Add more as needed
    }

    return countryMap[iso] || iso
  }

  const inputValue = open ? query : value ? `${value.city} (${value.iata})` : ''

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <Input
        ref={inputRef}
        id={inputId}
        name={inputName}
        value={inputValue}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!open) setOpen(true)
        }}
        onFocus={() => {
          setQuery('') // Clear query when focusing to start fresh
          setOpen(true)
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-1 bg-transparent dark:bg-transparent h-9 rounded-md px-3 py-2 text-base font-bold text-gray-900 dark:text-gray-100 border border-transparent dark:border-transparent focus-visible:border-primary/40 focus-visible:dark:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
      />

      {!open ? (
        value ? (
          <div className="text-[11px] text-gray-500 dark:text-gray-400">{value.name}</div>
        ) : (
          <div className="text-[11px] text-gray-500 dark:text-gray-400">&nbsp;</div>
        )
      ) : null}

      {open && dropdownPosition && typeof document !== 'undefined' ? (
        createPortal(
          <div 
            ref={dropdownRef}
            className="fixed z-[100] mt-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950 shadow-lg overflow-hidden"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width
            }}
          >
          <div className="max-h-72 overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                No airports found
              </div>
            ) : (
              <>
                {!query && recentAirports.length > 0 && (
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
                    Recent Selections
                  </div>
                )}
                {filtered.map((airport, index) => {
                  // Show section header for popular airports
                  const showPopularHeader =
                    !query && airport.isPopular && (index === 0 || !filtered[index - 1]?.isPopular)

                  return (
                    <div key={airport.id}>
                      {showPopularHeader && (
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
                          Popular in Bangladesh
                        </div>
                      )}
                      <button
                        type="button"
                        className={cn(
                          'w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800 focus:bg-gray-50 dark:focus:bg-neutral-800 focus:outline-none transition-colors',
                          airport.isCity
                            ? 'bg-gray-25 dark:bg-neutral-900/50 cursor-default'
                            : 'pl-4',
                          airport.isCity ? 'hover:bg-gray-25 dark:hover:bg-neutral-900/50' : '',
                        )}
                        onClick={() => {
                          if (airport.isCity) {
                            // If clicking on city group, don't select it
                            return
                          }

                          // Add to history if it's not a recent/popular item (to avoid duplicates)
                          if (!airport.isRecent && !airport.isPopular) {
                            addToAirportHistory({
                              iata: airport.iata,
                              name: airport.name,
                              city: airport.city,
                              country: airport.country,
                            })
                          }

                          onChange(airport)
                          setOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {airport.isCity ? (
                              <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            ) : airport.isRecent ? (
                              <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            ) : airport.isPopular ? (
                              <Star className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                            ) : (
                              <PlaneTakeoff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div
                                  className={cn(
                                    'font-bold text-gray-900 dark:text-gray-100 truncate',
                                    airport.isCity ? 'text-sm' : 'text-sm',
                                  )}
                                >
                                  {airport.isCity
                                    ? `${airport.city}, ${airport.country}`
                                    : `${airport.city}, ${airport.country}`}
                                  {airport.isRecent && (
                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                                      Recent
                                    </span>
                                  )}
                                  {airport.isPopular && (
                                    <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400 font-normal">
                                      Popular
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate font-normal">
                                  {airport.isCity ? 'All Airports' : airport.name}
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                  {airport.iata}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>,
        document.body
        )
      ) : null}
    </div>
  )
}
