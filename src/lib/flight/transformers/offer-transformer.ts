// Transform API response to UI-friendly format
import type { AirShoppingResponseData, Offer, UpSellBrand } from '@/types/flight/api/air-shopping.types'
import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'

import { parseBaggage } from '../parsers/baggage-parser'
import { parsePenalties } from '../parsers/penalty-parser'
import { parsePricing } from '../parsers/pricing-parser'
import { parseSegments } from '../parsers/segment-parser'
import { parseUpSellOptions } from '../parsers/upsell-parser'
import { groupTwoOnewayOffersByFlight } from '../utils/twooneway-grouping'

// Type for wrapped upSellBrand format that sometimes comes from the API
type WrappedUpSellBrand = {
  upSellBrand: UpSellBrand
}

export function transformOffersToFlightOffers(
  responseData: AirShoppingResponseData
): FlightOffer[] {
  const offers: FlightOffer[] = []

  // Transform regular offers
  if (Array.isArray(responseData.offersGroup)) {
    for (const offerGroup of responseData.offersGroup) {
      const transformed = transformOffer(offerGroup.offer, responseData.traceId)
      if (transformed) offers.push(transformed)
    }
  }

  // Transform special return offers (domestic returns)
  if (responseData.specialReturn) {
    // Some responses use `specialReturnOfferGroup.OB/IB` and others use `specialReturnOffersGroup.ob/ib`
    const ob =
      responseData.specialReturnOfferGroup?.OB ??
      responseData.specialReturnOffersGroup?.ob ??
      []

    const ib =
      responseData.specialReturnOfferGroup?.IB ??
      responseData.specialReturnOffersGroup?.ib ??
      []

    for (const offerGroup of ob) {
      const transformed = transformOffer(offerGroup.offer, responseData.traceId)
      if (transformed) offers.push(transformed)
    }

    for (const offerGroup of ib) {
      const transformed = transformOffer(offerGroup.offer, responseData.traceId)
      if (transformed) offers.push(transformed)
    }
  }

  return offers
}

export function transformOffersToTwoOnewayLists(
  responseData: AirShoppingResponseData
): { obOffers: FlightOffer[]; ibOffers: FlightOffer[] } {
  const obOffers: FlightOffer[] = []
  const ibOffers: FlightOffer[] = []

  if (!responseData.specialReturn) return { obOffers, ibOffers }

  const ob =
    responseData.specialReturnOfferGroup?.OB ??
    responseData.specialReturnOffersGroup?.ob ??
    []

  const ib =
    responseData.specialReturnOfferGroup?.IB ??
    responseData.specialReturnOffersGroup?.ib ??
    []

  for (const offerGroup of ob) {
    const transformed = transformOffer(offerGroup.offer, responseData.traceId)
    if (transformed) obOffers.push(transformed)
  }

  for (const offerGroup of ib) {
    const transformed = transformOffer(offerGroup.offer, responseData.traceId)
    if (transformed) ibOffers.push(transformed)
  }

  // Group same flight (same carrier, flight number, times) with different prices into one card with fare options
  return {
    obOffers: groupTwoOnewayOffersByFlight(obOffers),
    ibOffers: groupTwoOnewayOffersByFlight(ibOffers),
  }
}

/**
 * Transform multi-city offers (with 2 segments) into two-oneway format
 * Splits each offer into two separate offers: first segment as OB, second segment as IB
 * @param offers - Array of flight offers from multi-city search
 * @returns Object with obOffers and ibOffers arrays
 */
export function transformMulticityToTwoOneway(
  offers: FlightOffer[]
): { obOffers: FlightOffer[]; ibOffers: FlightOffer[] } {
  const obOffers: FlightOffer[] = []
  const ibOffers: FlightOffer[] = []

  for (const offer of offers) {
    // Each multi-city offer should have 2 segment groups (Trip 1 and Trip 2)
    if (offer.segments.length === 2) {
      const firstSegment = offer.segments[0]
      const secondSegment = offer.segments[1]
      
      // Ensure both segments exist before creating offers
      if (firstSegment && secondSegment) {
        // Create OB offer from first segment
        const obOffer: FlightOffer = {
          ...offer,
          id: `${offer.id}-OB`,
          twoOnewayIndex: 'OB',
          segments: [firstSegment], // Only first segment
        }
        obOffers.push(obOffer)

        // Create IB offer from second segment
        const ibOffer: FlightOffer = {
          ...offer,
          id: `${offer.id}-IB`,
          twoOnewayIndex: 'IB',
          segments: [secondSegment], // Only second segment
        }
        ibOffers.push(ibOffer)
      }
    }
  }

  return { obOffers, ibOffers }
}

function transformOffer(offer: Offer, traceId: string): FlightOffer | null {
  if (!offer.paxSegmentList || offer.paxSegmentList.length === 0) {
    return null
  }

  // Use parsers to extract structured data
  const segments = parseSegments(offer)
  const pricing = parsePricing(offer)
  const baggage = parseBaggage(offer)
  const penalties = parsePenalties(offer)
  
  // Parse upsell options if available
  // The API response wraps each upSellBrand in { upSellBrand: {...} }
  // but the TypeScript type expects UpSellBrand[] directly
  // We need to unwrap if needed
  let upSellBrandList: UpSellBrand[] | undefined = offer.upSellBrandList
  if (upSellBrandList && upSellBrandList.length > 0) {
    // Check if wrapped format - first item has 'upSellBrand' property
    const firstItem = upSellBrandList[0] as UpSellBrand | WrappedUpSellBrand
    if (firstItem && 'upSellBrand' in firstItem && typeof firstItem === 'object') {
      // Unwrap the format - cast to unknown first to safely handle the type conversion
      const wrappedList = upSellBrandList as unknown as WrappedUpSellBrand[]
      upSellBrandList = wrappedList.map((item: WrappedUpSellBrand) => item.upSellBrand)
    }
  }
  const upSellOptions = upSellBrandList ? parseUpSellOptions(upSellBrandList) : undefined

  return {
    id: offer.offerId,
    traceId,
    ...(offer.twoOnewayIndex === 'OB' || offer.twoOnewayIndex === 'IB'
      ? { twoOnewayIndex: offer.twoOnewayIndex }
      : {}),
    validatingCarrier: {
      code: offer.validatingCarrier,
      name: offer.paxSegmentList[0]?.paxSegment.marketingCarrierInfo.carrierName || offer.validatingCarrier,
    },
    refundable: offer.refundable,
    fareType: offer.fareType,
    segments,
    pricing,
    baggage,
    seatsRemaining: typeof offer.seatsRemaining === 'string' 
      ? parseInt(offer.seatsRemaining, 10) || 0 
      : offer.seatsRemaining || 0,
    ...(upSellOptions && { upSellOptions }),
    penalties,
  }
}
