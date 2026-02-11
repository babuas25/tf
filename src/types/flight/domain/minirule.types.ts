// MiniRule API types for Cancellation and Date Change penalties

export interface MiniRuleRequest {
  traceId: string
  offerId: string
}

export interface MiniRuleResponse {
  message: string | null
  requestedOn: string
  respondedOn: string
  response: {
    penalty: MiniRulePenalty
    traceId: string
  } | null
  statusCode: string
  success: boolean
  error: {
    errorCode: string
    errorMessage: string
  } | null
  info: string | null
}

export interface MiniRulePenalty {
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
    type: string // "Any Time", "Before Departure", "After Departure", etc.
    textInfoList: TextInfoItem[]
  }
}

export interface TextInfoItem {
  textInfo: {
    paxType: string // "Adult", "Child", "Infant"
    info: string[]
  }
}

// Transformed/simplified types for UI consumption
export interface TransformedMiniRule {
  cancellation: RoutePolicy[]
  dateChange: RoutePolicy[]
}

export interface RoutePolicy {
  route: string // e.g., "DAC → BKK"
  policies: PolicyInfo[]
}

export interface PolicyInfo {
  type: string // "Any Time", "Before Departure", etc.
  passengerPolicies: {
    paxType: string
    details: string[]
  }[]
}

// Helper function to transform API response to UI-friendly format
export function transformMiniRuleResponse(response: MiniRuleResponse): TransformedMiniRule | null {
  if (!response.success || !response.response?.penalty) {
    return null
  }

  const { refundPenaltyList, exchangePenaltyList } = response.response.penalty

  // Transform refund penalties (Cancellation)
  const cancellation: RoutePolicy[] = refundPenaltyList.map((item) => ({
    route: `${item.refundPenalty.departure} → ${item.refundPenalty.arrival}`,
    policies: item.refundPenalty.penaltyInfoList.map((penaltyItem) => ({
      type: penaltyItem.penaltyInfo.type,
      passengerPolicies: penaltyItem.penaltyInfo.textInfoList.map((textItem) => ({
        paxType: textItem.textInfo.paxType,
        details: textItem.textInfo.info,
      })),
    })),
  }))

  // Transform exchange penalties (Date Change)
  const dateChange: RoutePolicy[] = exchangePenaltyList.map((item) => ({
    route: `${item.exchangePenalty.departure} → ${item.exchangePenalty.arrival}`,
    policies: item.exchangePenalty.penaltyInfoList.map((penaltyItem) => ({
      type: penaltyItem.penaltyInfo.type,
      passengerPolicies: penaltyItem.penaltyInfo.textInfoList.map((textItem) => ({
        paxType: textItem.textInfo.paxType,
        details: textItem.textInfo.info,
      })),
    })),
  }))

  return { cancellation, dateChange }
}
