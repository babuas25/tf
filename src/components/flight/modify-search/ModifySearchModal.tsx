'use client'

import { ArrowLeftRight, X } from 'lucide-react'
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

type TripType = 'oneway' | 'roundtrip' | 'multicity'
type FareType = 'regular' | 'student' | 'seaman'

interface SearchData {
  tripType: TripType
  from: AirportOption | null
  to: AirportOption | null
  departureDate: string
  returnDate?: string | undefined
  travelerData: TravelerData
  preferredAirline: string
  fareType: FareType
}

interface ModifySearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch?: (searchData: SearchData) => void
  initialData?: {
    tripType?: TripType
    from?: AirportOption | null
    to?: AirportOption | null
    departureDate?: string
    returnDate?: string
    travelerData?: TravelerData
    preferredAirline?: string
    fareType?: FareType
  }
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

function getTodayDate(): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function ModifySearchModal({ isOpen, onClose, onSearch, initialData }: ModifySearchModalProps) {
  const themeColors = useDynamicThemeColors()
  
  // Initialize state with provided data or defaults
  const [tripType, setTripType] = useState<TripType>(initialData?.tripType || 'oneway')
  const [from, setFrom] = useState<AirportOption | null>(
    initialData?.from || {
      id: 'DAC',
      city: 'Dhaka',
      country: 'Bangladesh',
      iata: 'DAC',
      name: 'Hazrat Shahjalal International Airport',
    }
  )
  const [to, setTo] = useState<AirportOption | null>(
    initialData?.to || {
      id: 'CGP',
      city: 'Chittagong',
      country: 'Bangladesh',
      iata: 'CGP',
      name: 'Shah Amanat International',
    }
  )
  const [departureDate, setDepartureDate] = useState(initialData?.departureDate || getTomorrowDate())
  const [returnDate, setReturnDate] = useState(initialData?.returnDate || '')
  const [travelerData, setTravelerData] = useState<TravelerData>(
    initialData?.travelerData || {
      adults: 1,
      children: 0,
      infants: 0,
      travelClass: 'Economy',
      childrenAges: [],
    }
  )
  const [preferredAirline, setPreferredAirline] = useState(initialData?.preferredAirline || '')
  const [fareType, setFareType] = useState<FareType>(initialData?.fareType || 'regular')

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
      returnDate: tripType === 'roundtrip' ? returnDate : undefined,
      travelerData,
      preferredAirline,
      fareType,
    }
    
    if (onSearch) {
      onSearch(searchData)
    }
    onClose()
  }

  const isReturnDisabled = tripType !== 'roundtrip'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Modify Search
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Trip Type Selection */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name="tripType"
                className="h-4 w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                checked={tripType === 'oneway'}
                onChange={() => setTripType('oneway')}
              />
              Oneway
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name="tripType"
                className="h-4 w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                checked={tripType === 'roundtrip'}
                onChange={() => setTripType('roundtrip')}
              />
              Roundtrip
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name="tripType"
                className="h-4 w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                checked={tripType === 'multicity'}
                onChange={() => setTripType('multicity')}
              />
              Multicity
            </label>
          </div>

          {/* Search Form */}
          {tripType === 'multicity' ? (
            <MulticityFlightSearch 
              travelerData={travelerData}
              onTravelerDataChange={setTravelerData}
              preferredAirline={preferredAirline}
              onPreferredAirlineChange={setPreferredAirline}
              fareType={fareType}
              onFareTypeChange={setFareType}
              onSearch={handleSearch}
              idPrefix="modal-multicity"
            />
          ) : (
            <Card className="p-5 bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* From/To combined */}
              <div className="lg:col-span-4 relative">
                <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 overflow-visible h-full min-h-[140px] flex flex-col">
                  <div className="px-4 py-3 pr-16 flex-1 flex flex-col justify-center">
                    <AirportSelection
                      label="From"
                      inputId="modal-flight-from"
                      inputName="from"
                      value={from}
                      onChange={setFrom}
                      placeholder="City or airport"
                    />
                  </div>
                  <div className="relative h-px bg-gray-200 dark:bg-white/10">
                    <button
                      type="button"
                      onClick={swapLocations}
                      className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-primary/30 bg-gray-50 dark:bg-neutral-950 shadow-sm flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                      aria-label="Swap origin and destination"
                    >
                      <ArrowLeftRight className="h-4 w-4 rotate-90 text-primary" />
                    </button>
                  </div>
                  <div className="px-4 py-3 pr-16 flex-1 flex flex-col justify-center">
                    <AirportSelection
                      label="To"
                      inputId="modal-flight-to"
                      inputName="to"
                      value={to}
                      onChange={setTo}
                      placeholder="City or airport"
                    />
                  </div>
                </div>
              </div>

              {/* Departure */}
              <div className="lg:col-span-3 h-full min-h-[140px]">
                <FlightDatePicker
                  label="Departure"
                  value={departureDate}
                  onChange={handleDepartureDateChange}
                  placeholder="Select date"
                  minDate={getTodayDate()}
                />
              </div>

              {/* Return */}
              <div className="lg:col-span-3 h-full min-h-[140px]">
                <FlightDatePicker
                  label="Return"
                  value={returnDate}
                  onChange={setReturnDate}
                  disabled={isReturnDisabled}
                  placeholder="Select date"
                  minDate={departureDate || getTodayDate()}
                />
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
                        id="modal-flight-preferred-airline"
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
                            name="modalFareType"
                            className="h-4 w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 flex-shrink-0"
                            checked={fareType === 'regular'}
                            onChange={() => setFareType('regular')}
                          />
                          <span className="text-sm">Regular</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          <input
                            type="radio"
                            name="modalFareType"
                            className="h-4 w-4 appearance-none rounded-full border border-gray-300 dark:border-white/30 grid place-content-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:scale-0 before:transition-transform checked:border-primary checked:before:bg-primary checked:before:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 flex-shrink-0"
                            checked={fareType === 'student'}
                            onChange={() => setFareType('student')}
                          />
                          <span className="text-sm">Student</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          <input
                            type="radio"
                            name="modalFareType"
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
          </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Cancel
          </Button>
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
      </div>
    </div>
  )
}