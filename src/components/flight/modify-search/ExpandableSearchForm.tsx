'use client'

import { ArrowLeftRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'

import {
  AirportSelection,
  type AirportOption,
} from '@/components/flight/airport-selection/AirportSelection'
import { FlightDatePicker } from '@/components/flight/flight-date-picker'
import { MulticityFlightSearch } from '@/components/flight/MulticityFlightSearch'
import { TravelerSelection, type TravelerData } from '@/components/flight/traveler-selection'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDynamicThemeColors } from '@/lib/dynamic-theme-colors'
import { cn } from '@/lib/utils'
import type { MulticitySegment } from '@/types/flight/ui/search-form.types'

type TripType = 'oneway' | 'roundtrip' | 'multicity'
type FareType = 'regular' | 'student' | 'seaman'

interface SearchData {
  tripType: TripType
  from: AirportOption | null
  to: AirportOption | null
  departureDate: string
  returnDate?: string | undefined
  segments?: MulticitySegment[]
  travelerData: TravelerData
  preferredAirline: string
  fareType: FareType
}

interface ExpandableSearchFormProps {
  isExpanded: boolean
  onToggle: () => void
  onSearch?: (searchData: SearchData) => void
  initialData: SearchData
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return 'N/A'
  // Avoid timezone drift for date-only strings like "2026-01-27"
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getTodayDate(): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function ExpandableSearchForm({ isExpanded, onToggle, onSearch, initialData }: ExpandableSearchFormProps) {
  const themeColors = useDynamicThemeColors()
  
  // Initialize state with provided data
  const [tripType, setTripType] = useState<TripType>(initialData.tripType)
  const [from, setFrom] = useState<AirportOption | null>(initialData.from)
  const [to, setTo] = useState<AirportOption | null>(initialData.to)
  const [departureDate, setDepartureDate] = useState(initialData.departureDate)
  const [returnDate, setReturnDate] = useState(initialData.returnDate || '')
  const [segments, setSegments] = useState<MulticitySegment[] | undefined>(initialData.segments)
  const [travelerData, setTravelerData] = useState<TravelerData>(initialData.travelerData)
  const [preferredAirline, setPreferredAirline] = useState(initialData.preferredAirline)
  const [fareType, setFareType] = useState<FareType>(initialData.fareType)

  // Update state when initialData changes
  useEffect(() => {
    setTripType(initialData.tripType)
    setFrom(initialData.from)
    setTo(initialData.to)
    setDepartureDate(initialData.departureDate)
    setReturnDate(initialData.returnDate || '')
    setSegments(initialData.segments)
    setTravelerData(initialData.travelerData)
    setPreferredAirline(initialData.preferredAirline)
    setFareType(initialData.fareType)
  }, [initialData])

  // Handle trip type changes
  useEffect(() => {
    if (tripType !== 'roundtrip') {
      setReturnDate('')
    }
  }, [tripType])

  // Handle departure date changes
  const handleDepartureDateChange = (newDate: string) => {
    setDepartureDate(newDate)

    if (returnDate && newDate) {
      const departureParts = newDate.split('-')
      const returnParts = returnDate.split('-')

      if (departureParts.length === 3 && returnParts.length === 3) {
        const depYear = parseInt(departureParts[0] || '0', 10)
        const depMonth = parseInt(departureParts[1] || '0', 10) - 1
        const depDay = parseInt(departureParts[2] || '0', 10)
        const departure = new Date(depYear, depMonth, depDay)
        departure.setHours(0, 0, 0, 0)

        const retYear = parseInt(returnParts[0] || '0', 10)
        const retMonth = parseInt(returnParts[1] || '0', 10) - 1
        const retDay = parseInt(returnParts[2] || '0', 10)
        const returnD = new Date(retYear, retMonth, retDay)
        returnD.setHours(0, 0, 0, 0)

        if (returnD < departure) {
          setReturnDate('')
        }
      }
    }
  }

  const swapLocations = () => {
    const prevFrom = from
    const prevTo = to
    setFrom(prevTo)
    setTo(prevFrom)
  }

  const handleSearch = () => {
    const searchData: SearchData = {
      tripType,
      from,
      to,
      departureDate,
      returnDate: tripType === 'roundtrip' && returnDate ? returnDate : undefined,
      travelerData,
      preferredAirline,
      fareType,
    }
    
    if (onSearch) {
      onSearch(searchData)
    }
    onToggle() // Collapse after search
  }

  const isReturnDisabled = tripType !== 'roundtrip'

  // Format search summary for collapsed state
  const formatSearchSummary = () => {
    const totalTravelers = travelerData.adults + travelerData.children + travelerData.infants
    const travelers = `${totalTravelers} Passenger${totalTravelers > 1 ? 's' : ''}, ${travelerData.travelClass}`

    if (tripType === 'multicity') {
      const cleanSegments = (segments ?? []).filter(
        (s) => Boolean(s?.from?.iata) && Boolean(s?.to?.iata) && Boolean(s?.departureDate),
      )

      // For multi-city, show each segment separately: "DAC → CGP, CXB → DAC"
      const route =
        cleanSegments.length > 0
          ? cleanSegments.map((s) => `${s.from!.iata} → ${s.to!.iata}`).join(', ')
          : `${from?.iata || 'N/A'} → ${to?.iata || 'N/A'}`

      const dateStrings = cleanSegments.map((s) => formatDisplayDate(s.departureDate))
      const dates =
        dateStrings.length === 0
          ? formatDisplayDate(departureDate)
          : dateStrings.length <= 3
            ? dateStrings.join(', ')
            : `${dateStrings[0]} → ${dateStrings[dateStrings.length - 1]}`

      return { route, dates, travelers }
    }

    const fromIata = from?.iata || 'N/A'
    const toIata = to?.iata || 'N/A'
    const isRoundtrip = tripType === 'roundtrip' && Boolean(returnDate)

    return {
      route: isRoundtrip ? `${fromIata} → ${toIata} → ${fromIata}` : `${fromIata} → ${toIata}`,
      dates: isRoundtrip
        ? `${formatDisplayDate(departureDate)} → ${formatDisplayDate(returnDate)}`
        : formatDisplayDate(departureDate),
      travelers,
    }
  }

  const searchSummary = formatSearchSummary()

  return (
    <div className="w-full max-w-full bg-white dark:bg-neutral-900/95 border border-gray-200/80 dark:border-white/10 rounded-xl shadow-sm overflow-hidden relative backdrop-blur-sm">
      {/* Modify summary bar - polished typography and layout */}
      <div className="px-4 sm:px-5 py-3.5 sm:py-0 sm:h-14 flex items-center border-b border-gray-200/80 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 w-full">
          {/* Mobile: Compact single-line summary */}
          <div className="flex-1 sm:hidden min-w-0">
            <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-snug">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {tripType === 'oneway' ? 'One way' : tripType === 'roundtrip' ? 'Roundtrip' : 'Multicity'}
              </span>
              <span className="mx-1.5 text-gray-400 dark:text-gray-500">·</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{searchSummary.route}</span>
              <span className="mx-1.5 text-gray-400 dark:text-gray-500">·</span>
              <span className="text-gray-900 dark:text-gray-100">{searchSummary.dates}</span>
              <span className="mx-1.5 text-gray-400 dark:text-gray-500">·</span>
              <span className="text-gray-900 dark:text-gray-100">{searchSummary.travelers}</span>
            </p>
          </div>

          {/* Desktop: Label-value pairs with clear hierarchy */}
          <div className="hidden sm:flex flex-wrap items-center gap-x-6 gap-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Route</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{searchSummary.route}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{searchSummary.dates}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Travelers</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{searchSummary.travelers}</span>
            </div>
          </div>

          {/* Modify Search button - primary CTA */}
          <Button
            onClick={onToggle}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium px-4 py-2.5 w-full sm:w-auto shadow-sm transition-colors shrink-0"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Hide Search</span>
                <span className="sm:hidden">Hide</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Modify Search</span>
                <span className="sm:hidden">Modify</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expandable Content */}
      <div className={cn(
        "w-full transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[2000px] opacity-100 overflow-visible" : "max-h-0 opacity-0 overflow-hidden"
      )}>
        <div className="p-6 space-y-4 overflow-visible w-full">
          {/* Trip Type Selection */}
          <div className="w-full flex items-center gap-6 px-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name="expandableSearchTripType"
                className="h-4 w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                checked={tripType === 'oneway'}
                onChange={() => setTripType('oneway')}
              />
              Oneway
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name="expandableSearchTripType"
                className="h-4 w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                checked={tripType === 'roundtrip'}
                onChange={() => setTripType('roundtrip')}
              />
              Roundtrip
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name="expandableSearchTripType"
                className="h-4 w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                checked={tripType === 'multicity'}
                onChange={() => setTripType('multicity')}
              />
              Multicity
            </label>
          </div>

          {/* Search Form */}
          {tripType === 'multicity' ? (
            <div className="w-full">
              <MulticityFlightSearch 
                travelerData={travelerData}
                onTravelerDataChange={setTravelerData}
                preferredAirline={preferredAirline}
                onPreferredAirlineChange={setPreferredAirline}
                fareType={fareType}
                onFareTypeChange={setFareType}
                onSearch={handleSearch}
                idPrefix="expandable-multicity"
              />
            </div>
          ) : (
            <Card className="w-full p-5 bg-gray-50 dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 overflow-visible">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch overflow-visible">
                {/* From/To combined */}
                <div className="lg:col-span-4 relative overflow-visible">
                  <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-visible h-full min-h-[140px] flex flex-col relative z-10">
                    <div className="px-4 py-3 pr-16 flex-1 flex flex-col justify-center relative z-30">
                      <AirportSelection
                        key="expandable-from"
                        label="From"
                        inputId="expandable-search-from-field"
                        inputName="expandableSearchFrom"
                        value={from}
                        onChange={setFrom}
                        placeholder="City or airport"
                      />
                    </div>
                    <div className="relative h-px bg-gray-200 dark:bg-white/10">
                      <button
                        type="button"
                        onClick={swapLocations}
                        className="absolute right-6 top-1/2 -translate-y-1/2 z-40 h-8 w-8 rounded-full border border-primary/30 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                        aria-label="Swap origin and destination"
                      >
                        <ArrowLeftRight className="h-4 w-4 rotate-90 text-primary" />
                      </button>
                    </div>
                    <div className="px-4 py-3 pr-16 flex-1 flex flex-col justify-center relative z-30">
                      <AirportSelection
                        key="expandable-to"
                        label="To"
                        inputId="expandable-search-to-field"
                        inputName="expandableSearchTo"
                        value={to}
                        onChange={setTo}
                        placeholder="City or airport"
                      />
                    </div>
                  </div>
                </div>

                {/* Departure + Return (mobile side-by-side) */}
                <div className="grid grid-cols-2 gap-0 lg:gap-4 lg:contents">
                  {/* Departure */}
                  <div className="lg:col-span-3 h-full min-h-[90px] lg:min-h-[140px]">
                    <FlightDatePicker
                      label="Departure"
                      value={departureDate}
                      onChange={handleDepartureDateChange}
                      placeholder="Select date"
                      className="rounded-r-none lg:rounded-r-lg"
                      minDate={getTodayDate()}
                    />
                  </div>

                  {/* Return */}
                  <div className="lg:col-span-3 h-full min-h-[90px] lg:min-h-[140px]">
                    <FlightDatePicker
                      label="Return"
                      value={returnDate}
                      onChange={setReturnDate}
                      disabled={isReturnDisabled}
                      placeholder="Select date"
                      className="rounded-l-none lg:rounded-l-lg"
                      minDate={departureDate || getTodayDate()}
                    />
                  </div>
                </div>

                {/* Right side options */}
                <div className="lg:col-span-2">
                  <div className="h-full min-h-[140px] flex flex-col gap-2">
                    <TravelerSelection value={travelerData} onChange={setTravelerData} />

                    <div className="flex-[3] flex flex-col justify-start gap-1">
                      <div>
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          Preferred Airlines
                        </div>
                        <Input
                          id="expandable-flight-preferred-airline"
                          name="preferredAirline"
                          value={preferredAirline}
                          onChange={(e) => setPreferredAirline(e.target.value)}
                          placeholder="Enter preferred airlines"
                          className="mt-0 border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                        />
                      </div>

                      <div className="pt-0">
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">
                          Fare Type:
                        </div>
                        <div className="flex items-start gap-3 flex-wrap">
                          <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                            <input
                              type="radio"
                              name="expandableSearchFareType"
                              className="h-4 w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 flex-shrink-0"
                              checked={fareType === 'regular'}
                              onChange={() => setFareType('regular')}
                            />
                            <span className="text-sm">Regular</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                            <input
                              type="radio"
                              name="expandableSearchFareType"
                              className="h-4 w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 flex-shrink-0"
                              checked={fareType === 'student'}
                              onChange={() => setFareType('student')}
                            />
                            <span className="text-sm">Student</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                            <input
                              type="radio"
                              name="expandableSearchFareType"
                              className="h-4 w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 flex-shrink-0"
                              checked={fareType === 'seaman'}
                              onChange={() => setFareType('seaman')}
                            />
                            <span className="text-sm">Seaman</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="button"
                  onClick={handleSearch}
                  className={cn(
                    'px-8 text-white font-medium shadow-lg',
                    themeColors.primary,
                    themeColors.primaryHover,
                  )}
                >
                  Search Flights
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}