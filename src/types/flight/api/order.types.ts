// OrderCreate / OrderRetrieve / OrderReshopPrice / OrderChange response types

export interface OrderDeparture {
  iatA_LocationCode: string
  terminalName?: string
  aircraftScheduledDateTime: string
}

export interface OrderArrival {
  iatA_LocationCode: string
  terminalName?: string
  aircraftScheduledDateTime: string
}

export interface MarketingCarrierInfo {
  carrierDesigCode: string
  marketingCarrierFlightNumber?: string
  carrierName: string
}

export interface OperatingCarrierInfo {
  carrierDesigCode: string
  carrierName: string
}

export interface OrderAircraftType {
  iatA_AircraftTypeCode: string
}

export interface PaxSegment {
  departure: OrderDeparture
  arrival: OrderArrival
  marketingCarrierInfo: MarketingCarrierInfo
  operatingCarrierInfo: OperatingCarrierInfo
  iatA_AircraftType: OrderAircraftType
  rbd: string
  flightNumber: string
  segmentGroup?: number
  returnJourney?: boolean
  airlinePNR?: string
  duration?: string
  cabinType?: string
}

export interface PaxSegmentItem {
  paxSegment: PaxSegment
}

export interface FareDetail {
  baseFare: number
  tax: number
  otherFee?: number
  discount: number
  vat: number
  currency: string
  paxType: string
  paxCount: number
  subTotal: number
}

export interface FareDetailItem {
  fareDetail: FareDetail
}

export interface TotalAmount {
  total: number
  curreny: string
}

export interface OrderPrice {
  totalPayable: TotalAmount
  gross?: TotalAmount
  discount?: TotalAmount
  totalVAT?: TotalAmount
}

export interface BaggageAllowanceItem {
  paxType: string
  allowance: string
}

export interface BaggageAllowance {
  departure: string
  arrival: string
  checkIn: BaggageAllowanceItem[]
  cabin: BaggageAllowanceItem[]
}

export interface BaggageAllowanceItemWrap {
  baggageAllowance: BaggageAllowance
}

export interface PenaltyTextInfo {
  textInfo: {
    paxType: string
    info: string[]
  }
}

export interface PenaltyInfo {
  penaltyInfo: {
    type: string
    textInfoList: PenaltyTextInfo[]
  }
}

export interface RefundPenaltyItem {
  refundPenalty: {
    departure: string
    arrival: string
    penaltyInfoList: PenaltyInfo[]
  }
}

export interface ExchangePenaltyItem {
  exchangePenalty: {
    departure: string
    arrival: string
    penaltyInfoList: PenaltyInfo[]
  }
}

export interface OrderPenalty {
  refundPenaltyList?: RefundPenaltyItem[]
  exchangePenaltyList?: ExchangePenaltyItem[]
}

export interface OrderItem {
  validatingCarrier: string
  refundable: boolean
  fareType: string
  paxSegmentList: PaxSegmentItem[]
  fareDetailList: FareDetailItem[]
  price: OrderPrice
  baggageAllowanceList?: BaggageAllowanceItemWrap[]
  penalty?: OrderPenalty
}

export interface IdentityDoc {
  identityDocType: string
  identityDocID?: string
  issuingCountryCode?: string
  expiryDate: string
}

/** OrderCreate may use ticketNumber; OrderRetrieve/OrderChange use array of ticketDocNbr when Confirmed. */
export interface OrderIndividual {
  title?: string
  givenName: string
  surname: string
  gender: string
  birthdate: string
  nationality: string
  identityDoc?: IdentityDoc
  ticketDocument?: { ticketNumber?: string; ticketDocNbr?: string } | Array<{ ticketDocNbr?: string }> | null
}

export interface OrderPax {
  ptc: string
  individual: OrderIndividual
}

export interface OrderContactDetail {
  phoneNumber: string
  emailAddress: string
}

export interface OrderCreateResponse {
  orderReference: string
  paymentTimeLimit?: string
  orderItem: OrderItem[]
  paxList: OrderPax[]
  contactDetail: OrderContactDetail
  orderStatus: string
  orderChangeInfo?: unknown
  partialPaymentInfo?: unknown
  exchangeDetails?: unknown
  traceId?: string
}

export interface OrderCreateApiResponse {
  message: string | null
  requestedOn: string
  respondedOn: string
  response: OrderCreateResponse
  statusCode: string
  success: boolean
  error: unknown
  info: unknown
}
