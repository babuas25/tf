// Domain types for flight offers (transformed from API)
export interface FlightOffer {
  id: string
  traceId: string
  /**
   * For special return (paired two-oneway) responses.
   * "OB" (outbound) | "IB" (inbound)
   */
  twoOnewayIndex?: 'OB' | 'IB'
  validatingCarrier: {
    code: string
    name: string
  }
  refundable: boolean
  fareType: 'OnHold' | 'Web'
  segments: FlightSegmentGroup[]
  pricing: FlightPricing
  baggage: BaggageInfo
  seatsRemaining: number
  upSellOptions?: UpSellOption[]
  penalties: PenaltyInfo
}

export interface FlightSegmentGroup {
  groupId: number
  isReturn: boolean
  segments: FlightSegmentInfo[]
  totalDuration: number
  stops: number
  departure: {
    airport: string
    city: string
    dateTime: string
    terminal?: string
  }
  arrival: {
    airport: string
    city: string
    dateTime: string
    terminal?: string
  }
}

export interface FlightSegmentInfo {
  flightNumber: string
  airline: {
    code: string
    name: string
  }
  operatingAirline: {
    code: string
    name: string
  }
  aircraft: string
  departure: {
    airport: string
    dateTime: string
    terminal?: string
  }
  arrival: {
    airport: string
    dateTime: string
    terminal?: string
  }
  duration: number
  cabinClass: string
  bookingClass: string
  layover?: {
    duration: number
    airport: string
  }
  technicalStops?: TechnicalStop[]
}

export interface TechnicalStop {
  airport: string
  arrivalTime: string
  departureTime: string
  duration: number
}

export interface FlightPricing {
  total: number
  currency: string
  gross?: number
  totalVAT?: number
  breakdown: {
    baseFare: number
    taxes: number
    fees: number
    discount: number
    vat: number
  }
  perPassenger: PassengerFare[]
}

export interface PassengerFare {
  type: 'Adult' | 'Child' | 'Infant'
  count: number
  baseFare: number
  taxes: number
  vat: number
  otherFee: number
  total: number
}

export interface BaggageInfo {
  segments: SegmentBaggage[]
}

export interface SegmentBaggage {
  route: string
  checkIn: {
    adults: string
    children: string
    infants: string
  }
  cabin: {
    adults: string
    children: string
    infants: string
  }
}

export interface UpSellOption {
  id: string
  brandName: string
  refundable: boolean
  pricing: FlightPricing
  features: {
    meal: boolean
    seat: string
    miles: string
    refundAllowed: boolean
    exchangeAllowed: boolean
  }
  baggage: BaggageInfo
  bookingClass?: string // RBD booking class (e.g., "T", extracted from "T;T;T")
}

export interface PenaltyInfo {
  refund: PenaltyRule[]
  exchange: PenaltyRule[]
}

export interface PenaltyRule {
  route: string
  rules: {
    type: 'Before' | 'After'
    passengerType: string
    details: string[]
  }[]
}
