// OfferPrice API types

export interface OfferPriceRequest {
  traceId: string
  offerId: string[]
}

export interface OfferPriceResponse {
  message: string | null
  requestedOn: string
  respondedOn: string
  response: OfferPriceResponseData | null
  statusCode: string
  success: boolean
  error: {
    errorCode: string
    errorMessage: string
  } | null
  info: string | null
}

export interface OfferPriceResponseData {
  offersGroup: OfferGroup[]
  offerChangeInfo: Record<string, unknown> | null
  offerAvailable: boolean
  passportRequired: boolean
  availableSSR: string[]
  seatsAvailable: boolean
  serviceListAvailable: boolean
  partialPaymentInfo: Record<string, unknown> | null
  traceId: string
}

export interface OfferGroup {
  offer: DetailedOffer
}

export interface DetailedOffer {
  twoOnewayIndex: string | null
  offerId: string
  validatingCarrier: string
  refundable: boolean
  fareType: string
  paxSegmentList: PaxSegmentItem[]
  fareDetailList: FareDetailItem[]
  price: OfferPrice
  penalty: OfferPenalty
  baggageAllowanceList: BaggageAllowanceItem[]
  upSellBrandList: Record<string, unknown>[] | null
  seatsRemaining: number | null
  source: string | null
  nearByAirport: Record<string, unknown> | null
}

export interface PaxSegmentItem {
  paxSegment: PaxSegment
}

export interface PaxSegment {
  departure: LocationInfo
  arrival: LocationInfo
  marketingCarrierInfo: CarrierInfo
  operatingCarrierInfo: CarrierInfo
  iatA_AircraftType: {
    iatA_AircraftTypeCode: string
  }
  rbd: string
  flightNumber: string
  segmentGroup: number
  returnJourney: boolean
  airlinePNR: string | null
  technicalStopOver: Record<string, unknown> | null
  duration: string
  cabinType: string
}

export interface LocationInfo {
  iatA_LocationCode: string
  terminalName: string | null
  aircraftScheduledDateTime: string
}

export interface CarrierInfo {
  carrierDesigCode: string
  marketingCarrierFlightNumber?: string
  carrierName: string
}

export interface FareDetailItem {
  fareDetail: FareDetail
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

export interface OfferPrice {
  totalPayable: PriceAmount
  gross: PriceAmount
  discount: PriceAmount
  totalVAT: PriceAmount
  additionalMealCharges: Record<string, unknown> | null
  additionalBaggageCharges: Record<string, unknown> | null
  additionalSeatCharges: Record<string, unknown> | null
}

export interface PriceAmount {
  total: number
  curreny: string // Note: API has typo "curreny" instead of "currency"
}

export interface OfferPenalty {
  refundPenaltyList: RefundPenaltyItem[]
  exchangePenaltyList: ExchangePenaltyItem[]
}

export interface RefundPenaltyItem {
  refundPenalty: PenaltyDetail
}

export interface ExchangePenaltyItem {
  exchangePenalty: PenaltyDetail
}

export interface PenaltyDetail {
  departure: string
  arrival: string
  penaltyInfoList: PenaltyInfoItem[]
}

export interface PenaltyInfoItem {
  penaltyInfo: {
    type: string
    textInfoList: PenaltyTextInfoItem[]
  }
}

export interface PenaltyTextInfoItem {
  textInfo: {
    paxType: string
    info: string[]
  }
}

export interface BaggageAllowanceItem {
  baggageAllowance: BaggageAllowance
}

export interface BaggageAllowance {
  departure: string
  arrival: string
  checkIn: BaggageItem[]
  cabin: BaggageItem[]
}

export interface BaggageItem {
  paxType: string
  allowance: string
}
