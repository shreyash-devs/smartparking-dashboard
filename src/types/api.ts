import type {
  ParkingSlot,
  PaymentMethod,
  PaymentStatus,
  ReservationStatus,
} from './domain';

// Slot Availability response from GET /api/v1/slots/availability
export interface SlotAvailabilityResponse {
  totalAvailable: number;
  slots: ParkingSlot[];
}

// FastAPI Plate Recognition response from POST /recognition
export interface RecognitionResponse {
  eventId: string;
  status: 'recognized' | 'no_plate' | 'low_confidence' | 'error' | string;
  plate: string | null;
  confidence: number | null;
  errorMessage?: string | null;
  createdAt: string;
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

// Exit Bill Response from POST /sessions/exit or POST /api/v1/payment/exit
export interface ExitBillResponse {
  paymentId?: string;
  paymentCode?: string;
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

// Mock Payment Request to POST /payments/{paymentId}/mock-pay
export interface MockPayRequest {
  amount: number;
}

// Mock Payment Response from POST /payments/{paymentId}/mock-pay
export interface MockPayResponse {
  paymentId: string;
  sessionId?: string;
  vehicleNumber?: string;
  slotId?: string;
  amount?: number;
  currency?: string;
  status: string;
  openGate: boolean;
  gateCommandSent: boolean;
  gateCommandIssued?: boolean;
  paymentMethod?: string;
  sessionStatus?: string;
  message: string;
  paidAt?: string;
}

// Pending Bill from GET /payments/pending & GET /payments/code/{code}
export interface PendingBill {
  paymentId?: string;
  paymentCode: string;
  vehicleNumber: string;
  slotId: string;
  amount: number;
  currency: string;
  durationSeconds?: number;
  durationMinutes?: number;
  codeExpiresAt?: string;
  status?: string;
}

// Legacy Payment Request/Response adapters
export interface PaymentRequest {
  sessionId: string;
  paymentMethod?: PaymentMethod;
  idempotencyKey?: string | null;
  amount?: number;
  paymentId?: string;
}

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
