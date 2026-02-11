import type { FlightOffer, UpSellOption } from '@/types/flight/domain/flight-offer.types'

/**
 * Build a signature that identifies the same flight (carrier + flight number + times).
 * Offers with the same signature are the same flight with different fare classes/prices.
 */
export function getTwoOnewayFlightSignature(offer: FlightOffer): string {
  const carrier = offer.validatingCarrier?.code ?? ''
  const segmentParts: string[] = []
  for (const group of offer.segments ?? []) {
    for (const seg of group.segments ?? []) {
      segmentParts.push(
        `${seg.airline?.code ?? ''}${seg.flightNumber ?? ''}_${seg.departure?.dateTime ?? ''}_${seg.arrival?.dateTime ?? ''}`
      )
    }
  }
  return `${carrier}_${segmentParts.join('_')}`
}

/**
 * Build a synthetic UpSellOption from a FlightOffer (same flight, different fare).
 */
function offerToUpSellOption(offer: FlightOffer, brandName: string): UpSellOption {
  const firstSegment = offer.segments?.[0]?.segments?.[0]
  const bookingClass = firstSegment?.bookingClass ?? ''

  return {
    id: offer.id,
    brandName,
    refundable: offer.refundable,
    pricing: offer.pricing,
    features: {
      meal: false,
      seat: '',
      miles: '',
      refundAllowed: offer.refundable,
      exchangeAllowed: false,
    },
    baggage: offer.baggage,
    ...(bookingClass && { bookingClass }),
  }
}

/**
 * Merge multiple offers for the same flight into one offer with synthetic upSellOptions.
 * Sorts by price (gross) ascending so the first option is the cheapest; the merged
 * offer uses the first offer's id and base data.
 */
function mergeTwoOnewayOfferGroup(offers: FlightOffer[]): FlightOffer {
  if (offers.length === 0) throw new Error('mergeTwoOnewayOfferGroup requires at least one offer')
  const first = offers[0]
  if (offers.length === 1 && first) return first

  const sorted = [...offers].sort(
    (a, b) => (a.pricing.gross ?? a.pricing.total) - (b.pricing.gross ?? b.pricing.total)
  )
  const base = sorted[0] as FlightOffer

  const upSellOptions: UpSellOption[] = sorted.map((offer) => {
    const firstSeg = offer.segments?.[0]?.segments?.[0]
    const rbd = firstSeg?.bookingClass ?? ''
    const price = offer.pricing.gross ?? offer.pricing.total
    const currency = offer.pricing.currency ?? 'BDT'
    const priceStr = `${currency} ${price.toLocaleString()}`
    const brandName = rbd ? `Economy (${rbd}) - ${priceStr}` : priceStr
    return offerToUpSellOption(offer, brandName)
  })

  return {
    ...base,
    id: base.id,
    pricing: base.pricing,
    baggage: base.baggage,
    seatsRemaining: base.seatsRemaining,
    upSellOptions,
  }
}

/**
 * Group two-oneway offers by flight signature and merge same-flight offers into
 * a single card with synthetic fare options (upsell-style dropdown).
 */
export function groupTwoOnewayOffersByFlight(offers: FlightOffer[]): FlightOffer[] {
  if (offers.length === 0) return []

  const bySignature = new Map<string, FlightOffer[]>()
  for (const offer of offers) {
    const sig = getTwoOnewayFlightSignature(offer)
    const list = bySignature.get(sig) ?? []
    list.push(offer)
    bySignature.set(sig, list)
  }

  const result: FlightOffer[] = []
  for (const group of bySignature.values()) {
    result.push(mergeTwoOnewayOfferGroup(group))
  }
  return result
}
