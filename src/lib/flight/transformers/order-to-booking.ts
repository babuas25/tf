import type { BookingRecord, BookingStatus } from '@/types/booking'
import type { OrderCreateResponse } from '@/types/flight/api/order.types'

const API_STATUS_TO_BOOKING: Record<string, BookingStatus> = {
  OnHold: 'on-hold',
  Pending: 'pending',
  InProgress: 'in-progress',
  Confirmed: 'confirmed',
  UnConfirmed: 'unconfirmed',
  Unconfirmed: 'unconfirmed',
  Expired: 'expired',
  Cancelled: 'cancelled',
}

function normalizeStatus(apiStatus: string): BookingStatus {
  const normalized = API_STATUS_TO_BOOKING[apiStatus] ?? 'pending'
  return normalized
}

function formatPaxType(ptc: string): string {
  const map: Record<string, string> = {
    ADT: 'Adult',
    CHD: 'Child',
    INF: 'Infant',
  }
  return map[ptc] ?? ptc
}

/**
 * Build passenger type string from paxList (e.g. "Adult 2+Child 1").
 */
function buildPassengerType(paxList: OrderCreateResponse['paxList']): string {
  const counts: Record<string, number> = {}
  for (const pax of paxList) {
    const label = formatPaxType(pax.ptc)
    counts[label] = (counts[label] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([label, n]) => `${label} ${n}`)
    .join('+')
}

/**
 * Build primary passenger name (first pax) with (+ N) if more passengers.
 */
function buildName(paxList: OrderCreateResponse['paxList']): string {
  if (!paxList?.length) return '–'
  const first = paxList[0]
  if (!first) return '–'
  const name =
    [first.individual?.givenName, first.individual?.surname].filter(Boolean).join(' ').trim() || '–'
  if (paxList.length > 1) {
    return `${name.toUpperCase()} (+${paxList.length - 1})`
  }
  return name.toUpperCase()
}

/**
 * Build route string from orderItem segments (e.g. "DAC-CXB,CGP-DAC").
 */
function buildRoute(orderItem: OrderCreateResponse['orderItem'][0] | undefined): string {
  const segments = orderItem?.paxSegmentList ?? []
  return (
    segments
      .map((s) => {
        const dep = s.paxSegment?.departure?.iatA_LocationCode ?? ''
        const arr = s.paxSegment?.arrival?.iatA_LocationCode ?? ''
        return `${dep}-${arr}`
      })
      .filter(Boolean)
      .join(',') || '–'
  )
}

/**
 * First segment departure date (fly date).
 */
function getFlyDate(orderItem: OrderCreateResponse['orderItem'][0] | undefined): string {
  const first = orderItem?.paxSegmentList?.[0]?.paxSegment?.departure?.aircraftScheduledDateTime
  if (first) return first
  return ''
}

/**
 * PNR from first segment airlinePNR or fallback.
 */
function getPnr(response: OrderCreateResponse): string | undefined {
  const firstItem = response.orderItem?.[0]
  const firstSegment = firstItem?.paxSegmentList?.[0]?.paxSegment
  const pnr = (firstSegment as { airlinePNR?: string })?.airlinePNR
  if (pnr) return pnr
  return (response as { pnr?: string }).pnr
}

/**
 * Map OrderCreate/OrderRetrieve response to BookingRecord for Firestore.
 * Accepts full or minimal response (at least orderReference and orderStatus).
 */
export function orderResponseToBookingRecord(
  response: Partial<OrderCreateResponse> & { orderReference: string },
  options: {
    respondedOn: string // ISO datetime from API response
    createdBy?: string
    createdByEmail?: string
    issuedOverride?: string // e.g. when confirmed, use issued time
  },
): BookingRecord {
  const orderItem = response.orderItem?.[0]
  const totalPayable = orderItem?.price?.totalPayable?.total ?? 0
  const flyDate = getFlyDate(orderItem)
  const route = buildRoute(orderItem)
  const airline =
    orderItem?.validatingCarrier ??
    (orderItem?.paxSegmentList?.[0]?.paxSegment?.marketingCarrierInfo
      ?.carrierDesigCode as string) ??
    '–'
  const issued = options.issuedOverride ?? options.respondedOn
  const pnr = getPnr(response as OrderCreateResponse)

  return {
    referenceNo: response.orderReference,
    createDate: options.respondedOn,
    status: normalizeStatus(response.orderStatus ?? 'Pending'),
    ...(pnr !== undefined && pnr !== '' ? { pnr } : {}),
    name: buildName(response.paxList ?? []),
    flyDate: flyDate || options.respondedOn.slice(0, 10),
    airline: airline || '–',
    fare: totalPayable,
    issued,
    passengerType: buildPassengerType(response.paxList ?? []),
    route,
    createdBy: options.createdBy ?? 'Guest',
    ...(options.createdByEmail ? { createdByEmail: options.createdByEmail } : {}),
    updatedAt: new Date().toISOString(),
  }
}
