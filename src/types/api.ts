import type {
  ParkingSlot,
  DashboardSummary,
  Reservation,
  PaymentMethod,
  PaymentStatus,
  ReservationStatus,
} from './domain';

// Slot Availability response from GET /api/v1/slots/availability
export interface SlotAvailabilityResponse {
  totalAvailable: number;
  slots: ParkingSlot[];
}

// Entry Recognition Response from POST /api/v1/payment/entry & POST /api/v1/recognition/entry
export interface EntryRecognitionResponse {
  recognizedPlate: string;
  confidence: number;
  sessionId: string;
  slotId: string;
  slotCode: string;
  entryTime: string;
  decision: 'AUTHORIZED' | 'DENIED';
  reservationId?: string | null;
  message: string;
}

// Exit Bill Response from POST /api/v1/payment/exit
export interface ExitBillResponse {
  sessionId: string;
  plateNumber: string;
  slotId: string;
  durationMinutes: number;
  hourlyRate: number;
  amountDue: number;
  currency: string;
  paymentStatus: PaymentStatus;
  entryTime: string;
  exitRequestedTime: string;
  billingPolicy: string;
  isPaid: boolean;
  message: string;
}

// Mock Payment Request to POST /api/v1/payment
export interface PaymentRequest {
  sessionId: string;
  paymentMethod?: PaymentMethod;
  idempotencyKey?: string | null;
}

// Mock Payment Response from POST /api/v1/payment
export interface MockPaymentResponse {
  paymentId: string;
  sessionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  paidAt: string;
  idempotencyKey?: string | null;
  gateCommandIssued: boolean;
  message: string;
}

// Reservation Create Request to POST /api/v1/reservations
export interface ReservationCreateRequest {
  slotId: string;
  plateNumber: string;
  startAt: string;
  endAt: string;
}

// Reservation Check-in Request to POST /api/v1/reservations/{id}/checkin
export interface ReservationCheckinRequest {
  plateNumber: string;
}

export interface ReservationCheckinResponse {
  reservationId: string;
  sessionId: string;
  slotId: string;
  slotCode: string;
  plateNumber: string;
  checkedInAt: string;
  message: string;
}

export interface ReservationCancelResponse {
  reservationId: string;
  status: ReservationStatus;
  slotId: string;
  message: string;
}

// API Error Schema
export interface ApiErrorDetail {
  code?: string;
  message: string;
  detail?: string | Array<{ loc: string[]; msg: string; type: string }>;
}
