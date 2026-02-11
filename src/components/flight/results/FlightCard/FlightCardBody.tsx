'use client'

import { Plane } from 'lucide-react'

import { getAirportCity } from '@/lib/flight/utils/airport-city-lookup'
import { formatFlightTime, formatFlightDate } from '@/lib/flight/utils/date-formatter'
import { formatDuration } from '@/lib/flight/utils/duration'
import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'
import type { TripType } from '@/types/flight/ui/search-form.types'

interface FlightCardBodyProps {
  offer: FlightOffer
  tripType: TripType
}

export function FlightCardBody({ offer, tripType }: FlightCardBodyProps) {
  const segmentGroups = offer.segments
  if (!segmentGroups?.length) return null

  // Check if this is a two-oneway offer (needs compact styling for 2-column grid)
  const isTwoOneway = !!offer.twoOnewayIndex

  // Desktop-only: show Outbound & Return side-by-side for roundtrip (2 groups)
  const isDesktopRoundTripHorizontal =
    !isTwoOneway && tripType !== 'multicity' && segmentGroups.length === 2

  // Conditional class helpers for two-oneway compact vs regular layout
  const containerClass = isTwoOneway
    ? "px-2 sm:px-4 lg:px-3 3xl:px-4 pt-2 sm:pt-4 lg:pt-3 3xl:pt-4 pb-0 w-full overflow-hidden"
    : "px-2 sm:px-4 pt-3 sm:pt-4 pb-0 w-full overflow-hidden"

  const groupsWrapperClass = isTwoOneway
    ? "space-y-2 sm:space-y-4 lg:space-y-3 3xl:space-y-4"
    : isDesktopRoundTripHorizontal
      ? "space-y-3 sm:space-y-4 lg:grid lg:grid-cols-2 lg:gap-0 lg:space-y-0"
      : "space-y-3 sm:space-y-4"

  return (
    <div className={containerClass}>
      <div className={groupsWrapperClass}>
        {segmentGroups.map((segmentGroup, groupIndex) => {
          const departure = segmentGroup.departure
          const arrival = segmentGroup.arrival
          const stops = segmentGroup.stops

          const departureTime = new Date(departure.dateTime)
          const arrivalTime = new Date(arrival.dateTime)
          const totalDurationMinutes = Math.round((arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60))

          const totalLayoverMinutes = segmentGroup.segments.reduce(
            (sum, seg) => sum + (seg.layover?.duration ?? 0),
            0,
          )
          const departureCityName = getAirportCity(departure.airport)
          const arrivalCityName = getAirportCity(arrival.airport)

          // Use twoOnewayIndex from offer if available
          let title: string
          if (offer.twoOnewayIndex) {
            title = offer.twoOnewayIndex === 'OB' ? 'Outbound' : 'Return'
          } else if (tripType === 'multicity') {
            title = `Trip ${groupIndex + 1}`
          } else {
            title = segmentGroup.isReturn ? 'Return' : 'Outbound'
          }

          // Conditional classes for compact (two-oneway) vs regular layout
          const dividerClass = isTwoOneway
            ? "my-1.5 sm:my-3 lg:my-2 3xl:my-3"
            : "my-2 sm:my-3"

          const labelClass = isTwoOneway
            ? "flex items-center gap-1.5 lg:gap-2 text-[9px] sm:text-xs lg:text-[10px] 3xl:text-xs text-gray-700 dark:text-gray-300 pb-0.5 lg:pb-1"
            : "flex items-center gap-2 text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 pb-1"

          const gridGapClass = isTwoOneway
            ? "grid grid-cols-[1fr_auto_1fr] items-start gap-1 sm:gap-4 lg:gap-2 3xl:gap-4 w-full"
            : "grid grid-cols-[1fr_auto_1fr] items-start gap-1.5 sm:gap-4 lg:gap-6 w-full"

          const airportTextClass = isTwoOneway
            ? "text-[9px] sm:text-sm lg:text-[10px] 3xl:text-sm text-gray-500 dark:text-gray-300 truncate"
            : "text-[10px] sm:text-sm text-gray-500 dark:text-gray-300 truncate"

          const timeTextClass = isTwoOneway
            ? "text-lg sm:text-3xl lg:text-xl 3xl:text-3xl font-bold text-gray-900 dark:text-white leading-tight"
            : "text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white"

          const cityTextClass = isTwoOneway
            ? "text-[9px] sm:text-sm lg:text-[10px] 3xl:text-sm font-semibold text-primary truncate"
            : "text-xs sm:text-base font-bold text-primary truncate"

          const dateTextClass = isTwoOneway
            ? "text-[8px] sm:text-xs lg:text-[9px] 3xl:text-xs text-gray-500 dark:text-gray-300"
            : "text-[9px] sm:text-xs text-gray-500 dark:text-gray-300"

          const durationTextClass = isTwoOneway
            ? "text-xs sm:text-sm lg:text-xs 3xl:text-sm font-semibold text-gray-700 dark:text-gray-200"
            : "text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200"

          const durationLabelClass = isTwoOneway
            ? "text-xs sm:text-xs lg:text-xs 3xl:text-xs text-gray-500 dark:text-gray-300"
            : "text-xs text-gray-500 dark:text-gray-300"

          const lineMaxClass = isTwoOneway
            ? "relative w-full max-w-[50px] sm:max-w-[128px] lg:max-w-[70px] 3xl:max-w-[100px]"
            : "relative w-full max-w-[60px] sm:max-w-[128px]"

          const planeIconClass = isTwoOneway
            ? "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-4 sm:h-4 lg:w-2.5 lg:h-2.5 3xl:w-3.5 3xl:h-3.5 text-gray-400"
            : "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-4 sm:h-4 text-gray-400"

          const stopsTextClass = isTwoOneway
            ? "text-xs sm:text-xs lg:text-xs 3xl:text-xs font-medium"
            : "text-xs font-medium"

          const centerPxClass = isTwoOneway
            ? "text-center px-0.5 sm:px-2 lg:px-1 3xl:px-2 flex flex-col items-center flex-shrink-0 space-y-1.5"
            : "text-center px-0.5 sm:px-2 flex flex-col items-center flex-shrink-0 space-y-1.5"

          const spaceYColClass = isTwoOneway
            ? "text-left space-y-0 sm:space-y-1 lg:space-y-0.5 min-w-0"
            : "text-left space-y-0.5 sm:space-y-1 min-w-0"

          const spaceYColRightClass = isTwoOneway
            ? "text-right space-y-0 sm:space-y-1 lg:space-y-0.5 min-w-0"
            : "text-right space-y-0.5 sm:space-y-1 min-w-0"

          const mtClass = isTwoOneway ? "mt-0.5 lg:mt-1" : ""

          return (
            <div
              key={segmentGroup.groupId ?? groupIndex}
              className={[
                'w-full',
                isDesktopRoundTripHorizontal && groupIndex === 0 ? 'lg:pr-6' : '',
                isDesktopRoundTripHorizontal && groupIndex === 1
                  ? 'lg:pl-6 lg:border-l lg:border-gray-200 dark:lg:border-gray-700/50'
                  : '',
              ].join(' ')}
            >
              {/* Divider between Outbound & Return (or multiple groups) */}
              {groupIndex > 0 && (
                <div className={[dividerClass, isDesktopRoundTripHorizontal ? 'lg:hidden' : ''].join(' ')}>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
                  <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
                </div>
              )}

              {/* Segment group label */}
              <div className={labelClass}>
                <Plane className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                <span className="font-semibold">
                  {tripType === 'multicity' ? title : `${title} ${departure.airport} ✈ ${arrival.airport}`}
                </span>
              </div>

              <div className={gridGapClass}>
                {/* Left: Departure */}
                <div className={spaceYColClass}>
                  <div className={airportTextClass}>
                    {departure.airport}
                  </div>
                  <div className={timeTextClass}>
                    {formatFlightTime(departure.dateTime)}
                  </div>
                  <div className={cityTextClass}>
                    {departureCityName}
                  </div>
                  <div className={dateTextClass}>
                    {formatFlightDate(departure.dateTime)}
                  </div>
                  {departure.terminal && (
                    <div className={dateTextClass}>
                      Terminal: {departure.terminal}
                    </div>
                  )}
                </div>

                {/* Center: Duration & Stops */}
                <div className={centerPxClass}>
                  {/* Duration (time first, label second) */}
                  <div className="leading-tight whitespace-nowrap space-y-0.5">
                    <div className={durationTextClass}>
                      {formatDuration(totalDurationMinutes)}
                    </div>
                    <div className={durationLabelClass}>
                      Duration
                    </div>
                  </div>

                  <div className={lineMaxClass}>
                    <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 w-full" />
                    <Plane className={planeIconClass} />
                  </div>

                  {/* Stops / Layover */}
                  {stops === 0 ? (
                    <div className={`${mtClass} ${stopsTextClass} text-emerald-600 dark:text-emerald-400 whitespace-nowrap`}>
                      Direct
                    </div>
                  ) : (
                    <div className={`${mtClass} leading-tight whitespace-nowrap`}>
                      <div className={`${stopsTextClass} text-primary`}>
                        {stops} stop{stops > 1 ? 's' : ''}
                      </div>
                      {totalLayoverMinutes > 0 && (
                        <>
                          <div className={durationTextClass}>
                            {formatDuration(totalLayoverMinutes)}
                          </div>
                          <div className={durationLabelClass}>
                            Layover
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Arrival */}
                <div className={spaceYColRightClass}>
                  <div className={airportTextClass}>
                    {arrival.airport}
                  </div>
                  <div className={timeTextClass}>
                    {formatFlightTime(arrival.dateTime)}
                  </div>
                  <div className={cityTextClass}>
                    {arrivalCityName}
                  </div>
                  <div className={dateTextClass}>
                    {formatFlightDate(arrival.dateTime)}
                  </div>
                  {arrival.terminal && (
                    <div className={dateTextClass}>
                      Terminal: {arrival.terminal}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
