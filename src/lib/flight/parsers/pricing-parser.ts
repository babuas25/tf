// Parse pricing data from API offer
import type { Offer, FareDetail } from '@/types/flight/api/air-shopping.types'
import type { FlightPricing, PassengerFare } from '@/types/flight/domain/flight-offer.types'

export function parsePricing(offer: Offer): FlightPricing {
  const fareDetailList = offer.fareDetailList || []
  
  // Unwrap fareDetail objects if they're wrapped
  const fareDetails: FareDetail[] = fareDetailList
    .map((item) => {
      // Handle both wrapped { fareDetail: {...} } and direct FareDetail formats
      if ('fareDetail' in item && typeof item.fareDetail === 'object' && item.fareDetail !== null) {
        return item.fareDetail
      }
      return item
    })
    .filter((item): item is FareDetail => item !== null && typeof item === 'object')

  return {
    total: offer.price.totalPayable.total,
    currency: offer.price.totalPayable.currency || 'BDT',
    gross: offer.price.gross?.total,
    totalVAT: offer.price.totalVAT?.total,
    breakdown: {
      baseFare: calculateTotal(fareDetails, (fare) => fare.baseFare * fare.paxCount),
      taxes: calculateTotal(fareDetails, (fare) => fare.tax * fare.paxCount),
      fees: calculateTotal(fareDetails, (fare) => fare.otherFee * fare.paxCount),
      discount: calculateTotal(fareDetails, (fare) => fare.discount * fare.paxCount),
      vat: calculateTotal(fareDetails, (fare) => fare.vat * fare.paxCount),
    },
    perPassenger: fareDetails.map(parseFareDetail),
  }
}

function calculateTotal(
  fareDetails: FareDetail[],
  calculator: (fare: FareDetail) => number
): number {
  return fareDetails.reduce((sum, fare) => sum + calculator(fare), 0)
}

function parseFareDetail(fare: FareDetail): PassengerFare {
  return {
    type: fare.paxType as 'Adult' | 'Child' | 'Infant',
    count: fare.paxCount,
    baseFare: fare.baseFare,
    taxes: fare.tax,
    vat: fare.vat,
    otherFee: fare.otherFee,
    total: fare.subTotal / fare.paxCount,
  }
}
