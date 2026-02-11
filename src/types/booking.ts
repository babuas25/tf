/**
 * Booking record as stored in Firestore and used by BookingHistoryTable.
 * Field names align with UI columns: Create Date, Status, PNR's, Name, Fly Date,
 * Airline, Fare, Issued, Passenger Type, Route, Created By, Ref No.
 */
export type BookingStatus =
  | 'confirmed'
  | 'cancelled'
  | 'expired'
  | 'pending'
  | 'on-hold'
  | 'in-progress'
  | 'unconfirmed'

export interface BookingRecord {
  referenceNo: string
  createDate: string // ISO string
  status: BookingStatus
  pnr?: string
  name: string
  flyDate: string // ISO date
  airline: string
  fare: number
  issued: string // ISO string
  passengerType: string
  route: string
  createdBy: string
  createdByEmail?: string
  /** Firestore doc id = referenceNo for easy lookup */
  id?: string
  /** Last time we synced from OrderRetrieve (ISO) */
  updatedAt?: string
}
