import type { ParkingSlot, Reservation, ParkingSession, PaymentRecord } from './domain';

export interface FirestoreSlotDoc extends ParkingSlot {}
export interface FirestoreReservationDoc extends Reservation {}
export interface FirestoreSessionDoc extends ParkingSession {}
export interface FirestorePaymentDoc extends PaymentRecord {}

export interface FirestoreDeviceDoc {
  deviceId: string;
  name: string;
  deviceType: string;
  status: 'ONLINE' | 'STALE' | 'OFFLINE';
  lastHeartbeat: string;
  firmwareVersion: string;
  ipAddress?: string;
}
