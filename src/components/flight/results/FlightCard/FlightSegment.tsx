'use client'

import { Plane } from 'lucide-react'

import { AirlineLogo } from '@/components/flight/shared/AirlineLogo'
import { getAirportCity } from '@/lib/flight/utils/airport-city-lookup'
import { formatFlightTime, formatFlightDate } from '@/lib/flight/utils/date-formatter'
import { formatDuration } from '@/lib/flight/utils/duration'
import type { FlightSegmentInfo } from '@/types/flight/domain/flight-offer.types'

interface FlightSegmentProps {
  segment: FlightSegmentInfo
  showLayover?: boolean
  isFirst?: boolean
  isLast?: boolean
  /** When true, show marketing airline only (no operating carrier), e.g. domestic Bangladesh */
  hideOperatingCarrier?: boolean
}

export function FlightSegment({ segment, showLayover = false, isFirst = false, isLast = false, hideOperatingCarrier = false }: FlightSegmentProps) {
  const roundedClass = isFirst ? 'rounded-t-lg' : isLast ? 'rounded-b-lg' : ''
  const displayAirline = hideOperatingCarrier ? segment.airline : segment.operatingAirline

  return (
    <div className="space-y-0">
      {/* Main Segment Row */}
      <div className={`flex items-center gap-3 py-2.5 px-3 bg-white dark:bg-gray-900 ${roundedClass}`}>
        {/* Airline Logo & Info - marketing carrier; or operating carrier when not domestic Bangladesh */}
        <div className="flex items-center gap-2 min-w-[130px]">
          <AirlineLogo airlineId={displayAirline.code} size={24} />
          <div>
            <div className="text-[11px] font-medium text-gray-900 dark:text-white leading-tight">
              {displayAirline.name}
            </div>
            <div className="text-[9px] text-gray-500 dark:text-gray-400">
              {segment.airline.code}{segment.flightNumber}
            </div>
            <div className="text-[9px] text-gray-500 dark:text-gray-400">
              {segment.cabinClass} - {segment.bookingClass}
            </div>
          </div>
        </div>

        {/* Departure */}
        <div className="flex-1">
          <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">
            {formatFlightTime(segment.departure.dateTime)}
          </div>
          <div className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
            {formatFlightDate(segment.departure.dateTime)}
          </div>
          {segment.departure.terminal && (
            <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
              Terminal: {segment.departure.terminal}
            </div>
          )}
          <div className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
            {segment.departure.airport}
          </div>
        </div>

        {/* Duration */}
        <div className="flex flex-col items-center px-2">
          <div className="text-[9px] text-gray-600 dark:text-gray-400 mb-1">
            {formatDuration(segment.duration)}
          </div>
          <div className="relative w-14">
            <div className="border-t border-dashed border-gray-300 dark:border-gray-600" />
            <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 text-gray-400" />
          </div>
        </div>

        {/* Arrival */}
        <div className="flex-1 text-right">
          <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">
            {formatFlightTime(segment.arrival.dateTime)}
          </div>
          <div className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
            {formatFlightDate(segment.arrival.dateTime)}
          </div>
          {segment.arrival.terminal && (
            <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
              Terminal: {segment.arrival.terminal}
            </div>
          )}
          <div className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
            {segment.arrival.airport}
          </div>
        </div>
      </div>

      {/* Layover Info */}
      {showLayover && segment.layover && (
        <div className="px-3 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="text-[10px] text-center text-orange-700 dark:text-orange-400">
            Change of planes {formatDuration(segment.layover.duration)} Layover in {getAirportCity(segment.layover.airport)}
          </div>
        </div>
      )}
    </div>
  )
}
