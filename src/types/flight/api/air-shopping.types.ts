// AirShopping API Request Types
export interface AirShoppingRequest {
  pointOfSale: string
  request: {
    originDest: OriginDestRequest[]
    pax: PaxRequest[]
    shoppingCriteria: ShoppingCriteria
  }
}

export interface OriginDestRequest {
  originDepRequest: {
    iatA_LocationCode: string
    date: string
  }
  destArrivalRequest: {
    iatA_LocationCode: string
    date?: string
  }
}

export interface PaxRequest {
  paxID: string
  ptc: string // "ADT" | "CHD" | "INF" | "C01" | "C02" ...
}

export interface ShoppingCriteria {
  tripType: 'Oneway' | 'Return' | 'Circle'
  travelPreferences: {
    vendorPref: string[]
    cabinCode: 'Economy' | 'PremiumEconomy' | 'Business' | 'First'
  }
  returnUPSellInfo: boolean
  preferCombine: boolean
}

// AirShopping API Response Types
export interface AirShoppingResponse {
  message: string
  requestedOn: string
  respondedOn: string
  response: AirShoppingResponseData
  statusCode: string
  success: boolean
  error?: ApiError
}

export interface AirShoppingResponseData {
  traceId: string
  offersGroup?: _OfferGroup[] | null
  specialReturn: boolean
  /**
   * Some API responses use `specialReturnOfferGroup` with `OB/IB` keys.
   */
  specialReturnOfferGroup?: {
    OB?: _OfferGroup[]
    IB?: _OfferGroup[]
  } | null
  /**
   * Some API responses (like paired two-oneway) use `specialReturnOffersGroup` with `ob/ib` keys.
   */
  specialReturnOffersGroup?: {
    ob?: _OfferGroup[]
    ib?: _OfferGroup[]
  } | null
  moreOffersAvailableAirline: string[]
}

// OfferGroup for paired one-way flights (future use)
export interface _OfferGroup {
  offer: Offer
  twoOnewayIndex?: string
}

export interface Offer {
  offerId: string
  /**
   * Present for special return (paired two-oneway) offers.
   * Example: "OB" | "IB"
   */
  twoOnewayIndex?: string
  validatingCarrier: string
  refundable: boolean
  fareType: 'OnHold' | 'Web'
  paxSegmentList: PaxSegment[]
  fareDetailList: FareDetail[]
  price: Price
  penalty: Penalty
  /**
   * API sometimes wraps each item as { baggageAllowance: {...} }.
   */
  baggageAllowanceList: Array<BaggageAllowance | { baggageAllowance: BaggageAllowance }>
  upSellBrandList?: UpSellBrand[]
  seatsRemaining: number | string
}

export interface PaxSegment {
  paxSegment: {
    departure: Departure
    arrival: Arrival
    marketingCarrierInfo: CarrierInfo
    operatingCarrierInfo: CarrierInfo
    iatA_AircraftType: AircraftType
    rbd: string
    flightNumber: number
    segmentGroup: number
    returnJourney: boolean
    airlinePNR: string
    technicalStopOver?: TechnicalStopOver[]
    duration: number
    cabinType: string
  }
}

export interface Departure {
  iatA_LocationCode: string
  terminalName?: string
  aircraftScheduledDateTime: string
}

export interface Arrival {
  iatA_LocationCode: string
  terminalName?: string
  aircraftScheduledDateTime: string
}

export interface CarrierInfo {
  carrierDesigCode: string
  marketingCarrierFlightNumber?: number
  carrierName: string
}

export interface AircraftType {
  iatA_AircraftTypeCode: string
}

export interface TechnicalStopOver {
  iatA_LocationCode: string
  aircraftScheduledArrivalDateTime: string
  aircraftScheduledDepartureDateTime: string
  arrivalTerminalName?: string
  departureTerminalName?: string
}

export interface FareDetail {
  baseFare: number
  tax: number
  otherFee: number
  discount: number
  vat: number
  currency: string
  paxType: string
  paxCount: number
  subTotal: number
}

export interface Price {
  totalPayable: {
    total: number
    currency: string
  }
  gross: {
    total: number
    currency: string
  }
  discount: {
    total: number
    currency: string
  }
  totalVAT: {
    total: number
    currency: string
  }
}

export interface Penalty {
  refundPenaltyList: PenaltyDetail[]
  exchangePenaltyList: PenaltyDetail[]
}

export interface PenaltyDetail {
  departure: string
  arrival: string
  penaltyInfoList: ApiPenaltyInfo[]
}

export interface ApiPenaltyInfo {
  type: string
  textInfoList: TextInfo[]
}

export interface TextInfo {
  paxType: string
  info: string[]
}

export interface BaggageAllowance {
  departure: string
  arrival: string
  checkIn: BaggageDetail[]
  cabin: BaggageDetail[]
}

export interface BaggageDetail {
  paxType: string
  allowance: string
}

export interface UpSellBrand {
  offerId: string
  brandName: string
  refundable: boolean
  fareDetailList: FareDetail[]
  price: Price
  penalty: Penalty
  /**
   * API sometimes wraps each item as { baggageAllowance: {...} }.
   */
  baggageAllowanceList: Array<BaggageAllowance | { baggageAllowance: BaggageAllowance }>
  rbd: string
  meal: boolean
  seat: string
  miles: string
  refundAllowed: boolean
  exchangeAllowed: boolean
}

export interface ApiError {
  errorCode: string
  errorMessage: string
}
