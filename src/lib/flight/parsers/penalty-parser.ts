// Parse penalty (refund/exchange) rules from API offer
import type { Offer, PenaltyDetail, ApiPenaltyInfo } from '@/types/flight/api/air-shopping.types'
import type { PenaltyInfo, PenaltyRule } from '@/types/flight/domain/flight-offer.types'

export function parsePenalties(offer: Offer): PenaltyInfo {
  const penalty = offer.penalty

  return {
    refund: (penalty?.refundPenaltyList || []).map(parsePenaltyDetail),
    exchange: (penalty?.exchangePenaltyList || []).map(parsePenaltyDetail),
  }
}

function parsePenaltyDetail(detail: PenaltyDetail): PenaltyRule {
  return {
    route: `${detail.departure}-${detail.arrival}`,
    rules: (detail.penaltyInfoList || []).map(parsePenaltyInfo),
  }
}

function parsePenaltyInfo(info: ApiPenaltyInfo) {
  return {
    type: info.type as 'Before' | 'After',
    passengerType: info.textInfoList?.[0]?.paxType || 'All',
    details: (info.textInfoList || []).flatMap((t) => t.info || []),
  }
}
