// Parse upsell brand options from API offer
import type { UpSellBrand } from '@/types/flight/api/air-shopping.types'
import type { UpSellOption } from '@/types/flight/domain/flight-offer.types'

import { parseBaggage } from './baggage-parser'
import { parsePricing } from './pricing-parser'

export function parseUpSellOptions(upSellBrandList?: UpSellBrand[]): UpSellOption[] {
  if (!upSellBrandList || upSellBrandList.length === 0) {
    return []
  }

  return upSellBrandList.map((brand) => parseUpSellBrand(brand))
}

function parseUpSellBrand(brand: UpSellBrand): UpSellOption {
  // Create a temporary offer-like object to reuse existing parsers
  const tempOffer = {
    offerId: brand.offerId,
    validatingCarrier: '',
    refundable: brand.refundable,
    fareType: 'OnHold' as const,
    paxSegmentList: [],
    fareDetailList: brand.fareDetailList,
    price: brand.price,
    penalty: brand.penalty,
    baggageAllowanceList: brand.baggageAllowanceList,
    seatsRemaining: 0,
  }

  const pricing = parsePricing(tempOffer)
  const baggage = parseBaggage(tempOffer)

  // Extract booking class from rbd (format: "T;T;T" or single "T")
  const bookingClass = brand.rbd?.split(';')[0]?.trim() || ''

  return {
    id: brand.offerId,
    brandName: brand.brandName,
    refundable: brand.refundable,
    pricing,
    features: {
      meal: brand.meal,
      seat: brand.seat || '',
      miles: brand.miles || '',
      refundAllowed: brand.refundAllowed,
      exchangeAllowed: brand.exchangeAllowed,
    },
    baggage,
    bookingClass,
  }
}
