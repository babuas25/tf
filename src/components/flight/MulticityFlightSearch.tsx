'use client'

import { Plus, ArrowLeftRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  AirportSelection,
  type AirportOption,
} from '@/components/flight/airport-selection/AirportSelection'
import { FlightDatePicker } from '@/components/flight/flight-date-picker'
import { TravelerSelection, type TravelerData } from '@/components/flight/traveler-selection'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDynamicThemeColors } from '@/lib/dynamic-theme-colors'
import { cn } from '@/lib/utils'

type FareType = 'regular' | 'student' | 'seaman'

interface FlightSegment {
  id: string
  from: AirportOption | null
  to: AirportOption | null
  departureDate: string
}

function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const year = tomorrow.getFullYear()
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const day = String(tomorrow.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateAfterDays(baseDate: string, days: number): string {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTodayDate(): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface MulticityFlightSearchProps {
  travelerData: TravelerData
  onTravelerDataChange: (data: TravelerData) => void
  preferredAirline: string
  onPreferredAirlineChange: (airline: string) => void
  fareType: FareType
  onFareTypeChange: (fareType: FareType) => void
  onSearch?: () => void
  idPrefix?: string // Add optional prefix for unique IDs
}

export function MulticityFlightSearch({
  travelerData,
  onTravelerDataChange,
  preferredAirline,
  onPreferredAirlineChange,
  fareType,
  onFareTypeChange,
  onSearch,
  idPrefix = 'multicity'
}: MulticityFlightSearchProps) {
  const themeColors = useDynamicThemeColors()
  const router = useRouter()
  const [segments, setSegments] = useState<FlightSegment[]>([
    {
      id: '1',
      from: {
        id: 'DAC',
        city: 'Dhaka',
        country: 'Bangladesh',
        iata: 'DAC',
        name: 'Hazrat Shahjalal International Airport',
      },
      to: {
        id: 'CGP',
        city: 'Chittagong',
        country: 'Bangladesh',
        iata: 'CGP',
        name: 'Shah Amanat International',
      },
      departureDate: getTomorrowDate(),
    },
  ])

  const updateSegment = (
    segmentId: string,
    field: keyof FlightSegment,
    value: AirportOption | string | null,
  ) => {
    setSegments((prev) => {
      const next = prev.map((segment) =>
        segment.id === segmentId ? { ...segment, [field]: value } : segment
      )

      if (field === 'departureDate') {
        for (let i = 1; i < next.length; i++) {
          const prevDate = next[i - 1]?.departureDate
          const currDate = next[i]?.departureDate
          if (!prevDate || !currDate) continue

          const prevD = new Date(prevDate)
          const currD = new Date(currDate)
          prevD.setHours(0, 0, 0, 0)
          currD.setHours(0, 0, 0, 0)

          if (currD.getTime() < prevD.getTime()) {
            const bumped = getDateAfterDays(prevDate, 1)
            const segmentToUpdate = next[i]
            if (!segmentToUpdate) continue
            next[i] = { ...segmentToUpdate, departureDate: bumped }
          }
        }
      }

      return next
    })
  }

  const swapSegmentLocations = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((segment) => 
        segment.id === segmentId 
          ? { ...segment, from: segment.to, to: segment.from }
          : segment
      )
    )
  }

  const addSegment = () => {
    if (segments.length >= 6) return // Maximum 6 segments

    const lastSegment = segments[segments.length - 1]
    const newSegment: FlightSegment = {
      id: Date.now().toString(),
      from: lastSegment?.to || null,
      to: null,
      departureDate: lastSegment?.departureDate
        ? getDateAfterDays(lastSegment.departureDate, 1)
        : getTomorrowDate(),
    }

    setSegments((prev) => [...prev, newSegment])
  }

  const handleSearch = () => {
    // For multicity, we need to pass all segments
    const params = new URLSearchParams({
      tripType: 'multicity',
      adults: travelerData.adults.toString(),
      children: travelerData.children.toString(),
      infants: travelerData.infants.toString(),
      travelClass: travelerData.travelClass,
      preferredAirline,
      fareType,
    })

    // Add segments data as JSON
    params.append('segments', JSON.stringify(segments))

    // Navigate to flight search results page
    router.push(`/results?${params.toString()}`)
    
    if (onSearch) {
      onSearch()
    }
  }

  // Get the current segment (first one for display)
  const currentSegment = segments[0]

  if (!currentSegment) {
    return null // or some loading state
  }

  return (
    <div className="w-full space-y-4 overflow-visible">
      <Card className="w-full p-3 lg:p-5 bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-visible">
        {/* All Flight Segments */}
        <div className="space-y-4 mb-6">
          {segments.map((segment, index) => (
            <div
              key={segment.id}
              className="border border-gray-200 dark:border-white/10 rounded-lg p-2 bg-white dark:bg-neutral-950 relative"
            >
              {/* Trip label positioned at top-left corner of the parent gray container */}
              <div className="absolute -top-2 -left-1 text-xs font-medium text-white bg-primary px-2 py-1 rounded z-30 shadow-sm">
                Trip {index + 1}
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-2 items-stretch">
                  {/* From/To combined */}
                  <div className={`relative ${index === 0 ? 'lg:col-span-4' : 'lg:col-span-7'}`}>
                    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950 overflow-visible h-full min-h-[80px] lg:min-h-[140px] flex flex-col relative z-20">
                      <div className="px-3 py-2 lg:px-4 lg:py-3 pr-12 lg:pr-16 flex-1 flex flex-col justify-center relative z-30">
                        <AirportSelection
                          label="From"
                          inputId={`${idPrefix}-from-${segment.id}`}
                          inputName={`${idPrefix}-from-${segment.id}`}
                          value={segment.from}
                          onChange={(value) => updateSegment(segment.id, 'from', value)}
                          placeholder="City or airport"
                        />
                      </div>
                      <div className="relative h-px bg-gray-200 dark:bg-white/10">
                        <button
                          type="button"
                          onClick={() => swapSegmentLocations(segment.id)}
                          className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-primary/30 bg-white dark:bg-neutral-950 shadow-sm flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors z-40"
                          aria-label="Swap origin and destination"
                        >
                          <ArrowLeftRight className="h-4 w-4 rotate-90 text-primary" />
                        </button>
                      </div>
                      <div className="px-3 py-2 lg:px-4 lg:py-3 pr-12 lg:pr-16 flex-1 flex flex-col justify-center relative z-30">
                        <AirportSelection
                          label="To"
                          inputId={`${idPrefix}-to-${segment.id}`}
                          inputName={`${idPrefix}-to-${segment.id}`}
                          value={segment.to}
                          onChange={(value) => updateSegment(segment.id, 'to', value)}
                          placeholder="City or airport"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Departure Date */}
                  <div className="lg:col-span-3 h-full min-h-[90px] lg:min-h-[140px]">
                    <FlightDatePicker
                      label="Departure"
                      value={segment.departureDate}
                      onChange={(value) => updateSegment(segment.id, 'departureDate', value)}
                      placeholder="Select date"
                      minDate={index === 0 ? getTodayDate() : (segments[index - 1]?.departureDate || getTodayDate())}
                      {...(index > 0 && segments[index - 1]?.departureDate
                        ? { openToDate: segments[index - 1]!.departureDate }
                        : {})}
                    />
                  </div>

                  {/* Traveler + Preferred Airlines + Fare Type Block (only for first segment) */}
                  {index === 0 && (
                    <div className="lg:col-span-3 h-full min-h-[90px] lg:min-h-[140px]">
                      <div className="h-full flex flex-col gap-1 lg:gap-2">
                        <TravelerSelection value={travelerData} onChange={onTravelerDataChange} />

                        <div className="flex-[3] flex flex-col justify-start gap-1">
                          <div>
                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              Preferred Airlines
                            </div>
                            <Input
                              id={`${idPrefix}-preferred-airline`}
                              name={`${idPrefix}-preferredAirline`}
                              value={preferredAirline}
                              onChange={(e) => onPreferredAirlineChange(e.target.value)}
                              placeholder="Enter preferred airlines"
                              className="mt-0 border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-950 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                            />
                          </div>

                          <div className="pt-0">
                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">
                              Fare Type:
                            </div>
                            <div className="flex items-start gap-1 sm:gap-2 lg:gap-3 flex-wrap">
                              <label className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap min-w-0">
                                <input
                                  type="radio"
                                  name={`${idPrefix}-fareType`}
                                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-1.5 before:h-1.5 sm:before:w-2 sm:before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 flex-shrink-0"
                                  checked={fareType === 'regular'}
                                  onChange={() => onFareTypeChange('regular')}
                                />
                                <span className="text-xs sm:text-sm">Regular</span>
                              </label>
                              <label className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap min-w-0">
                                <input
                                  type="radio"
                                  name={`${idPrefix}-fareType`}
                                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-1.5 before:h-1.5 sm:before:w-2 sm:before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 flex-shrink-0"
                                  checked={fareType === 'student'}
                                  onChange={() => onFareTypeChange('student')}
                                />
                                <span className="text-xs sm:text-sm">Student</span>
                              </label>
                              <label className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap min-w-0">
                                <input
                                  type="radio"
                                  name={`${idPrefix}-fareType`}
                                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-1.5 before:h-1.5 sm:before:w-2 sm:before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 flex-shrink-0"
                                  checked={fareType === 'seaman'}
                                  onChange={() => onFareTypeChange('seaman')}
                                />
                                <span className="text-xs sm:text-sm">Seaman</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Segment Button (only for first segment) */}
                  {index === 0 && (
                    <div className="lg:col-span-2 h-full min-h-[90px] lg:min-h-[140px] flex items-center justify-center">
                      <Button
                        type="button"
                        onClick={addSegment}
                        disabled={segments.length >= 6}
                        className={cn(
                          'h-full w-full min-h-[90px] lg:min-h-[140px] rounded-lg flex flex-col items-center justify-center gap-2 text-white font-medium shadow-lg',
                          themeColors.primary,
                          themeColors.primaryHover,
                        )}
                      >
                        <Plus className="h-6 w-6" />
                        <span className="text-sm font-medium">
                          Add Segment ({segments.length}/6)
                        </span>
                      </Button>
                    </div>
                  )}

                  {/* Remove Button (for additional segments) - smaller width */}
                  {index > 0 && (
                    <div className="lg:col-span-2 h-full min-h-[90px] lg:min-h-[140px] flex items-center justify-center">
                      <Button
                        type="button"
                        onClick={() => {
                          setSegments((prev) => prev.filter((s) => s.id !== segment.id))
                        }}
                        className="h-full w-full min-h-[90px] lg:min-h-[140px] bg-gray-900 dark:bg-gray-800 text-white hover:bg-red-600 dark:hover:bg-red-700 rounded-lg flex flex-col items-center justify-center gap-2"
                      >
                        <span className="text-sm font-medium">Remove</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button
            type="button"
            className={cn(
              'min-w-[180px] text-white font-medium shadow-lg',
              themeColors.primary,
              themeColors.primaryHover,
            )}
            onClick={handleSearch}
          >
            Search Flights
          </Button>
        </div>
      </Card>
    </div>
  )
}
