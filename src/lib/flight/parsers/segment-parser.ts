// Parse flight segment data from API offer
import type { Offer, PaxSegment } from '@/types/flight/api/air-shopping.types'
import type { FlightSegmentGroup, FlightSegmentInfo } from '@/types/flight/domain/flight-offer.types'

export function parseSegments(offer: Offer): FlightSegmentGroup[] {
  const groups = new Map<number, FlightSegmentInfo[]>()

  // Group segments by segment group ID
  for (const paxSeg of offer.paxSegmentList) {
    const segment = paxSeg.paxSegment
    const groupId = segment.segmentGroup

    if (!groups.has(groupId)) {
      groups.set(groupId, [])
    }

    const segmentInfo = parseSegmentInfo(paxSeg)
    groups.get(groupId)!.push(segmentInfo)
  }

  // Convert groups to segment groups with calculated data
  return Array.from(groups.entries()).map(([groupId, segments]) => 
    buildSegmentGroup(groupId, segments, offer)
  )
}

function parseSegmentInfo(paxSeg: PaxSegment): FlightSegmentInfo {
  const segment = paxSeg.paxSegment

  return {
    // Keep only the numeric flight number here; UI concatenates airline code where needed.
    flightNumber: String(segment.marketingCarrierInfo.marketingCarrierFlightNumber ?? segment.flightNumber),
    airline: {
      code: segment.marketingCarrierInfo.carrierDesigCode,
      name: segment.marketingCarrierInfo.carrierName,
    },
    operatingAirline: {
      code: segment.operatingCarrierInfo.carrierDesigCode,
      name: segment.operatingCarrierInfo.carrierName,
    },
    aircraft: segment.iatA_AircraftType.iatA_AircraftTypeCode,
    departure: {
      airport: segment.departure.iatA_LocationCode,
      dateTime: segment.departure.aircraftScheduledDateTime,
      ...(segment.departure.terminalName && { terminal: segment.departure.terminalName }),
    },
    arrival: {
      airport: segment.arrival.iatA_LocationCode,
      dateTime: segment.arrival.aircraftScheduledDateTime,
      ...(segment.arrival.terminalName && { terminal: segment.arrival.terminalName }),
    },
    duration: segment.duration,
    cabinClass: segment.cabinType,
    bookingClass: segment.rbd,
  }
}

function buildSegmentGroup(
  groupId: number,
  segments: FlightSegmentInfo[],
  offer: Offer
): FlightSegmentGroup {
  // Calculate layovers between segments
  calculateLayovers(segments)

  const totalDuration = segments.reduce((sum, seg) => {
    let duration = seg.duration
    if (seg.layover) duration += seg.layover.duration
    return sum + duration
  }, 0)

  const firstSegment = segments[0]
  const lastSegment = segments[segments.length - 1]

  if (!firstSegment || !lastSegment) {
    throw new Error('Invalid segment data: missing first or last segment')
  }

  return {
    groupId,
    isReturn: offer.paxSegmentList.some(
      (ps) => ps.paxSegment.segmentGroup === groupId && ps.paxSegment.returnJourney
    ),
    segments,
    totalDuration,
    stops: segments.length - 1,
    departure: {
      airport: firstSegment.departure.airport,
      city: firstSegment.departure.airport, // TODO: Map to city name
      dateTime: firstSegment.departure.dateTime,
      ...(firstSegment.departure.terminal && { terminal: firstSegment.departure.terminal }),
    },
    arrival: {
      airport: lastSegment.arrival.airport,
      city: lastSegment.arrival.airport, // TODO: Map to city name
      dateTime: lastSegment.arrival.dateTime,
      ...(lastSegment.arrival.terminal && { terminal: lastSegment.arrival.terminal }),
    },
  }
}

function calculateLayovers(segments: FlightSegmentInfo[]): void {
  for (let i = 0; i < segments.length - 1; i++) {
    const currentSeg = segments[i]
    const nextSeg = segments[i + 1]
    
    if (!currentSeg || !nextSeg) continue

    const currentArrival = new Date(currentSeg.arrival.dateTime)
    const nextDeparture = new Date(nextSeg.departure.dateTime)
    const layoverMinutes = (nextDeparture.getTime() - currentArrival.getTime()) / (1000 * 60)

    currentSeg.layover = {
      duration: Math.round(layoverMinutes),
      airport: currentSeg.arrival.airport,
    }
  }
}
