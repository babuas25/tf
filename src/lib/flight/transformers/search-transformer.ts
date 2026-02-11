// Transform UI search form data to AirShopping API request
import type { AirShoppingRequest, PaxRequest } from '@/types/flight/api/air-shopping.types'
import type { SearchFormData } from '@/types/flight/ui/search-form.types'

import { POINT_OF_SALE } from '../api/endpoints'

export function transformSearchToRequest(
  searchData: SearchFormData
): AirShoppingRequest {
  const { tripType, from, to, departureDate, returnDate, travelerData, preferredAirline, segments } =
    searchData

  // Map trip types
  const apiTripType = tripType === 'oneway' ? 'Oneway' : tripType === 'roundtrip' ? 'Return' : 'Circle'

  // Build origin/destination array
  const originDest = []
  
  if (tripType === 'multicity') {
    // Multicity requests must use all segments as `originDest[]`.
    // Backend expects `shoppingCriteria.tripType = "Circle"` with 2+ legs.
    for (const seg of segments ?? []) {
      if (!seg?.from?.iata || !seg?.to?.iata || !seg?.departureDate) continue
      originDest.push({
        originDepRequest: {
          iatA_LocationCode: seg.from.iata,
          date: seg.departureDate,
        },
        destArrivalRequest: {
          iatA_LocationCode: seg.to.iata,
        },
      })
    }
  } else {
    // Outbound
    if (from && to) {
      originDest.push({
        originDepRequest: {
          iatA_LocationCode: from.iata,
          date: departureDate,
        },
        destArrivalRequest: {
          iatA_LocationCode: to.iata,
        },
      })
    }
  }

  // Return leg
  if (tripType === 'roundtrip' && returnDate && to && from) {
    originDest.push({
      originDepRequest: {
        iatA_LocationCode: to.iata,
        date: returnDate,
      },
      destArrivalRequest: {
        iatA_LocationCode: from.iata,
      },
    })
  }

  // Build passenger list
  const pax: PaxRequest[] = []
  let paxCounter = 1

  // Adults
  for (let i = 0; i < travelerData.adults; i++) {
    pax.push({
      paxID: `PAX${paxCounter++}`,
      ptc: 'ADT',
    })
  }

  // Children
  for (let i = 0; i < travelerData.children; i++) {
    const age = travelerData.childrenAges?.[i] || 11
    pax.push({
      paxID: `PAX${paxCounter++}`,
      ptc: age < 12 ? `C${String(age).padStart(2, '0')}` : 'CHD',
    })
  }

  // Infants
  for (let i = 0; i < travelerData.infants; i++) {
    pax.push({
      paxID: `PAX${paxCounter++}`,
      ptc: 'INF',
    })
  }

  // Build request
  return {
    pointOfSale: POINT_OF_SALE,
    request: {
      originDest,
      pax,
      shoppingCriteria: {
        tripType: apiTripType,
        travelPreferences: {
          vendorPref: preferredAirline ? [preferredAirline] : [],
          cabinCode: (travelerData.travelClass || 'Economy') as 'Economy' | 'PremiumEconomy' | 'Business' | 'First',
        },
        returnUPSellInfo: true,
        // Matches saved multicity request samples where Circle uses preferCombine=true
        preferCombine: tripType === 'multicity',
      },
    },
  }
}
