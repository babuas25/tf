'use client'

import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'
import type { TripType } from '@/types/flight/ui/search-form.types'

import { FlightCard } from './FlightCard'

interface FlightResultsListProps {
  offers: FlightOffer[]
  tripType: TripType
  onFlightSelect?: (offerId: string) => void
}

export function FlightResultsList({ offers, tripType, onFlightSelect }: FlightResultsListProps) {
  return (
    <div className="space-y-0.5 sm:space-y-1">
      {offers.map((offer) => (
        <FlightCard
          key={offer.id}
          offer={offer}
          tripType={tripType}
          {...(onFlightSelect && { onSelect: onFlightSelect })}
        />
      ))}
    </div>
  )
}
