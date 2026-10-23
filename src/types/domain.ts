/**
 * Domain entity types, enumerations, and state interfaces
 * for the Smart Parking IoT System.
 */

export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'ALLOCATED' | 'UNAVAILABLE' | 'OUT_OF_SERVICE';

export type DeviceHealthStatus = 'HEALTHY' | 'STALE' | 'OFFLINE';

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED';

export type RecognitionLocation = 'ENTRY' | 'EXIT';

export type RecognitionStatus =
  | 'SUCCESS'
  | 'NO_PLATE'
  | 'LOW_CONFIDENCE'
  | 'MULTIPLE_CANDIDATES'
  | 'ERROR';

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export type PaymentMethod = 'MOCK' | 'CREDIT_CARD' | 'RFID' | 'FASTAG';

export interface ParkingSlot {
  id: string;
  slotCode: string; // e.g. "S1", "S2", "S3", "S4"
  status: SlotStatus;
  sensorOccupied: boolean;
  distanceCm: number;
  sensorUpdatedAt: string | null;
  reservationId: string | null;
  activeSessionId: string | null;
  activeVehiclePlate?: string | null;
  healthStatus: DeviceHealthStatus;
  updatedAt?: string | null;
}

export interface DeviceHealthSummary {
  healthySensors: number;
  staleSensors: number;
  offlineSensors: number;
  lastTelemetryAt: string | null;
}

export interface DashboardSummary {
  totalSlots: number;
  availableSlots: number;
  reservedSlots: number;
  allocatedSlots: number;
  physicallyOccupiedSlots: number;
  unavailableSlots: number;
  activeSessions: number;
  occupancyRatePercentage: number;
  deviceHealth: DeviceHealthSummary;
  // Extended dashboard metrics
  vehiclesEnteredToday?: number;
  vehiclesExitedToday?: number;
  todayRevenue?: number;
}

export interface Reservation {
  id: string;
  userId: string;
  slotId: string;
  slotCode: string;
  plateNumber: string;
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt?: string;
  checkedInAt?: string | null;
}

export interface RecognitionEvent {
  eventId: string;
  timestamp: string;
  location: RecognitionLocation;
  plateNumber: string | null;
  confidence: number;
  resultStatus: RecognitionStatus;
  decision?: 'AUTHORIZED' | 'DENIED' | 'PAYMENT_REQUIRED';
  sessionId?: string | null;
  slotCode?: string | null;
  errorCode?: string | null;
  message?: string;
}

export interface ParkingSession {
  sessionId: string;
  plateNumber: string;
  slotId: string;
  slotCode: string;
  entryAt: string;
  exitAt?: string | null;
  status: 'ACTIVE' | 'PAYMENT_PENDING' | 'COMPLETED' | 'CANCELLED';
  durationMinutes: number;
  amountDue: number;
  currency: string;
  paymentStatus: PaymentStatus;
  reservationId?: string | null;
}

export interface PaymentRecord {
  paymentId: string;
  sessionId: string;
  plateNumber?: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string;
  gateCommandIssued: boolean;
  message?: string;
}

export interface IoTDevice {
  deviceId: string;
  name: string;
  deviceType: 'CONTROLLER' | 'ENTRY_CAM' | 'EXIT_CAM' | 'GATE_SERVO' | 'ULTRASONIC_SENSOR';
  location: string;
  lastHeartbeat: string;
  status: 'ONLINE' | 'STALE' | 'OFFLINE';
  firmwareVersion: string;
  ipAddress?: string;
  lastCommand?: string;
  lastCommandAck?: 'RECEIVED' | 'PENDING' | 'FAILED';
  physicalState?: string;
}

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  defaultPlate?: string;
  createdAt?: string;
  updatedAt?: string;
}

