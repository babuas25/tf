// Parse baggage allowance data from API offer
import type { Offer, BaggageAllowance, BaggageDetail } from '@/types/flight/api/air-shopping.types'
import type { BaggageInfo, SegmentBaggage } from '@/types/flight/domain/flight-offer.types'

export function parseBaggage(offer: Offer): BaggageInfo {
  const baggageList = offer.baggageAllowanceList || []

  // API sometimes wraps each item as { baggageAllowance: {...} }
  const normalized: BaggageAllowance[] = baggageList
    .map((item) => {
      if (item && typeof item === 'object' && 'baggageAllowance' in item) {
        return item.baggageAllowance
      }
      return item
    })
    .filter((b): b is BaggageAllowance => !!b && typeof b === 'object')

  const fallbackRoutes = buildFallbackRoutesFromSegments(offer)

  return {
    segments: normalized.map((b, idx) => parseSegmentBaggage(b, fallbackRoutes[idx])),
  }
}

function cleanCode(value: string | undefined | null): string {
  const v = (value ?? '').trim()
  if (!v) return ''
  const lower = v.toLowerCase()
  if (lower === 'undefined' || lower === 'null') return ''
  return v
}

function buildFallbackRoutesFromSegments(offer: Offer): string[] {
  // Use paxSegmentList to derive routes per segmentGroup (works for oneway/return/multicity)
  const byGroup = new Map<number, { dep: string; arr: string }>()

  for (const ps of offer.paxSegmentList || []) {
    const seg = ps.paxSegment
    const gid = seg.segmentGroup
    const dep = cleanCode(seg.departure?.iatA_LocationCode)
    const arr = cleanCode(seg.arrival?.iatA_LocationCode)
    if (!dep || !arr) continue

    if (!byGroup.has(gid)) {
      byGroup.set(gid, { dep, arr })
    } else {
      // Update arrival to last segment's arrival within the group
      byGroup.get(gid)!.arr = arr
    }
  }

  return Array.from(byGroup.entries())
    .sort(([a], [b]) => a - b)
    .map(([, r]) => `${r.dep}-${r.arr}`)
}

function parseSegmentBaggage(baggage: BaggageAllowance, fallbackRoute?: string): SegmentBaggage {
  const dep = cleanCode(baggage.departure)
  const arr = cleanCode(baggage.arrival)
  const route = dep && arr ? `${dep}-${arr}` : (fallbackRoute || 'N/A')
  return {
    route,
    checkIn: {
      adults: findAllowance(baggage.checkIn, 'Adult'),
      children: findAllowance(baggage.checkIn, 'Child'),
      infants: findAllowance(baggage.checkIn, 'Infant'),
    },
    cabin: {
      adults: findAllowance(baggage.cabin, 'Adult'),
      children: findAllowance(baggage.cabin, 'Child'),
      infants: findAllowance(baggage.cabin, 'Infant'),
    },
  }
}

function normalizePaxType(paxType: string): 'ADULT' | 'CHILD' | 'INFANT' | 'OTHER' {
  const t = paxType.trim().toUpperCase()
  if (t === 'ADT' || t === 'ADULT') return 'ADULT'
  if (t === 'CHD' || t === 'CHILD' || t.startsWith('C')) return 'CHILD'
  if (t === 'INF' || t === 'INFANT') return 'INFANT'
  return 'OTHER'
}

function findAllowance(
  baggageDetails: BaggageDetail[] | undefined,
  paxType: string
): string {
  const desired = normalizePaxType(paxType)
  const detail = baggageDetails?.find((b) => normalizePaxType(b.paxType) === desired)
  return detail?.allowance || 'N/A'
}
