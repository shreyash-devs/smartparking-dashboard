import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { apiClient } from '@/lib/api-client';
import type {
  ExitBillResponse,
  MockPaymentResponse,
  MockPayResponse,
  PaymentRequest,
  PendingBill,
} from '@/types/api';
import type { PaymentRecord } from '@/types/domain';
import { formatFirestoreDate } from '@/lib/formatters';

export interface PendingBillLookupResult {
  paymentId: string;
  paymentCode: string;
  vehicleNumber: string;
  slotId: string;
  slotCode: string;
  amount: number;
  currency: string;
  durationMinutes: number;
  durationSeconds?: number;
  entryTime?: string;
  codeExpiresAt?: string;
  sessionId?: string;
  status?: string;
}

export const paymentsService = {
  /**
   * Fetch payment ledger directly from Firebase Firestore.
   */
  async getPaymentHistory(userId?: string): Promise<PaymentRecord[]> {
    if (!db || !('type' in db)) return [];

    try {
      const payRef = collection(db, 'payments');
      const q = query(payRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const results: PaymentRecord[] = [];

      snapshot.forEach(d => {
        const data = d.data();
        if (userId && data.userId && data.userId !== userId && data.userId !== 'current-user') {
          return;
        }

        results.push({
          paymentId: d.id,
          sessionId: data.sessionId || '',
          plateNumber: data.plateNumber || data.vehicleNumber || '',
          amount: Number(data.amount || 0),
          currency: data.currency || 'INR',
          method: data.method || 'MOCK',
          status: data.status || 'SUCCEEDED',
          createdAt: formatFirestoreDate(data.createdAt),
          paidAt: formatFirestoreDate(data.paidAt || data.createdAt),
          gateCommandIssued: Boolean(data.gateCommandIssued || data.openGate),
          message: data.message,
        });
      });
      return results;
    } catch (err) {
      console.warn('Error reading payments from Firestore:', err);
      return [];
    }
  },

  /**
   * Real-time subscription to payments.
   */
  subscribeToPayments(
    userId: string | undefined,
    onUpdate: (payments: PaymentRecord[]) => void
  ): () => void {
    if (!db || !('type' in db)) {
      onUpdate([]);
      return () => {};
    }

    try {
      const payRef = collection(db, 'payments');
      return onSnapshot(
        payRef,
        snapshot => {
          const results: PaymentRecord[] = [];
          snapshot.forEach(d => {
            const data = d.data();
            if (userId && data.userId && data.userId !== userId && data.userId !== 'current-user') {
              return;
            }
            results.push({
              paymentId: d.id,
              sessionId: data.sessionId || '',
              plateNumber: data.plateNumber || data.vehicleNumber || '',
              amount: Number(data.amount || 0),
              currency: data.currency || 'INR',
              method: data.method || 'MOCK',
              status: data.status || 'SUCCEEDED',
              createdAt: formatFirestoreDate(data.createdAt),
              paidAt: formatFirestoreDate(data.paidAt || data.createdAt),
              gateCommandIssued: Boolean(data.gateCommandIssued || data.openGate),
              message: data.message,
            });
          });
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          onUpdate(results);
        },
        err => console.warn('Payment listener warning:', err)
      );
    } catch {
      return () => {};
    }
  },

  /**
   * Endpoint C: View All Pending Codes (Admin / Lot Screen)
   * GET /payments/pending
   */
  async listPendingBills(): Promise<PendingBill[]> {
    // 1. Try FastAPI endpoint GET /payments/pending
    try {
      const res = await apiClient<any>('/payments/pending', { method: 'GET' });
      if (Array.isArray(res) && res.length > 0) {
        return res.map(b => ({
          paymentId: b.paymentId,
          paymentCode: b.paymentCode,
          vehicleNumber: b.vehicleNumber,
          slotId: b.slotId,
          amount: Number(b.amount || 20),
          currency: b.currency || 'INR',
          durationSeconds: b.durationSeconds,
          durationMinutes: Math.round(Number(b.durationSeconds || 1800) / 60),
          codeExpiresAt: b.codeExpiresAt,
          status: 'pending',
        }));
      }
    } catch (e) {
      // Backend might be offline; fall back to Firestore active sessions
    }

    // 2. Query Firestore parkingSessions for active / pending bills
    if (db && 'type' in db) {
      try {
        const snap = await getDocs(collection(db, 'parkingSessions'));
        const list: PendingBill[] = [];

        snap.forEach(d => {
          const data = d.data();
          const rawStatus = String(data.status || '').toLowerCase();
          if (rawStatus === 'active' || rawStatus === 'payment_pending') {
            const entryTime = data.entryTime || data.entryAt || data.createdAt || new Date().toISOString();
            const durationMins = Math.max(
              15,
              Math.round((Date.now() - new Date(entryTime).getTime()) / 60000)
            );
            const hourlyRate = 20; // ₹20/hr, min 1 hr
            const amount = Math.max(20, Math.ceil(durationMins / 60) * hourlyRate);

            list.push({
              paymentId: `pay_${d.id.slice(-8)}`,
              paymentCode: data.paymentCode || d.id.slice(-6).toUpperCase(),
              vehicleNumber: data.vehicleNumber || data.plateNumber || 'VEHICLE',
              slotId: String(data.slotId || data.slotCode || 'S1').replace('slot-', '').toUpperCase(),
              amount,
              currency: 'INR',
              durationMinutes: durationMins,
              durationSeconds: durationMins * 60,
              status: 'pending',
            });
          }
        });
        return list;
      } catch (err) {
        console.warn('Firestore pending sessions query warning:', err);
      }
    }

    return [];
  },

  /**
   * Endpoint A: Look Up Bill by 6-Digit Code
   * GET /payments/code/{code}
   */
  async lookupByCode(code: string): Promise<PendingBillLookupResult | null> {
    const cleanCode = code.trim();
    if (!cleanCode) return null;

    // 1. Try FastAPI backend GET /payments/code/{code}
    try {
      const res = await apiClient<any>(`/payments/code/${cleanCode}`, { method: 'GET' });
      if (res && (res.paymentId || res.amount !== undefined)) {
        return {
          paymentId: res.paymentId || `pay_${cleanCode}`,
          paymentCode: res.paymentCode || cleanCode,
          vehicleNumber: res.vehicleNumber || res.plateNumber || 'VEHICLE',
          slotId: res.slotId || 'S1',
          slotCode: String(res.slotId || 'S1').replace('slot-', '').toUpperCase(),
          amount: Number(res.amount || 20),
          currency: res.currency || 'INR',
          durationMinutes: Math.round(Number(res.durationSeconds || 1800) / 60),
          durationSeconds: res.durationSeconds,
          codeExpiresAt: res.codeExpiresAt,
          sessionId: res.sessionId,
          status: res.status || 'pending',
        };
      }
    } catch (e) {
      // Backend lookup might fail or return 404, check active sessions in Firestore
    }

    // 2. Query Firestore parkingSessions for matching code or active session
    if (db && 'type' in db) {
      try {
        const snap = await getDocs(collection(db, 'parkingSessions'));
        let found: any = null;

        snap.forEach(d => {
          const data = d.data();
          if (
            data.paymentCode === cleanCode ||
            d.id.includes(cleanCode) ||
            String(data.vehicleNumber || '').toUpperCase().includes(cleanCode.toUpperCase())
          ) {
            found = { id: d.id, ...data };
          }
        });

        // If not found by specific code, check if there's any active session
        if (!found) {
          snap.forEach(d => {
            const data = d.data();
            if (String(data.status).toLowerCase() === 'active' && !found) {
              found = { id: d.id, ...data };
            }
          });
        }

        if (found) {
          const entryTime = found.entryTime || found.entryAt || found.createdAt || new Date().toISOString();
          const durationMins = Math.max(
            15,
            Math.round((Date.now() - new Date(entryTime).getTime()) / 60000)
          );
          const hourlyRate = 20; // ₹20/hr, min 1 hr
          const amount = Math.max(20, Math.ceil(durationMins / 60) * hourlyRate);

          return {
            paymentId: `pay_${found.id.slice(-8)}`,
            paymentCode: cleanCode,
            vehicleNumber: found.vehicleNumber || found.plateNumber || 'MH12AB1234',
            slotId: found.slotId || 'S1',
            slotCode: String(found.slotId || 'S1').replace('slot-', '').toUpperCase(),
            amount,
            currency: 'INR',
            durationMinutes: durationMins,
            entryTime: formatFirestoreDate(entryTime),
            sessionId: found.id,
            status: 'pending',
          };
        }
      } catch (err) {
        console.warn('Firestore session lookup error:', err);
      }
    }

    // If still not found and valid 4-6 digits, generate a simulated pending bill
    if (cleanCode.length >= 4) {
      return {
        paymentId: `pay_${cleanCode}`,
        paymentCode: cleanCode,
        vehicleNumber: 'MH12AB1234',
        slotId: 'slot-s2',
        slotCode: 'S2',
        amount: 20,
        currency: 'INR',
        durationMinutes: 45,
        sessionId: `sess_${cleanCode}`,
        status: 'pending',
      };
    }

    return null;
  },

  /**
   * Endpoint B: Complete Payment (Mock Pay)
   * POST /payments/{paymentId}/mock-pay
   * Request Body: { "amount": amount }
   */
  async processMockPayment(
    paymentIdOrReq:
      | string
      | PaymentRequest
      | {
          paymentId?: string;
          amount?: number;
          sessionId?: string;
          vehiclePlate?: string;
          paymentMethod?: string;
          userId?: string;
          slotId?: string;
        },
    amountArg?: number,
    sessionIdArg: string = '',
    vehiclePlateArg: string = '',
    methodArg: string = 'MOCK',
    userIdArg: string = 'current-user',
    slotIdArg: string = ''
  ): Promise<MockPayResponse> {
    let paymentId: string;
    let amount: number;
    let sessionId: string;
    let vehiclePlate: string;
    let method: string;
    let userId: string;
    let slotId: string;

    if (typeof paymentIdOrReq === 'object') {
      paymentId = (paymentIdOrReq as any).paymentId || (paymentIdOrReq as any).sessionId || `pay_${Date.now().toString().slice(-8)}`;
      amount = Number((paymentIdOrReq as any).amount !== undefined ? (paymentIdOrReq as any).amount : 20);
      sessionId = (paymentIdOrReq as any).sessionId || `sess_${paymentId}`;
      vehiclePlate = (paymentIdOrReq as any).vehiclePlate || (paymentIdOrReq as any).plateNumber || '';
      method = (paymentIdOrReq as any).paymentMethod || 'MOCK';
      userId = (paymentIdOrReq as any).userId || 'current-user';
      slotId = (paymentIdOrReq as any).slotId || '';
    } else {
      paymentId = paymentIdOrReq;
      amount = Number(amountArg !== undefined ? amountArg : 20);
      sessionId = sessionIdArg || `sess_${paymentId}`;
      vehiclePlate = vehiclePlateArg;
      method = methodArg;
      userId = userIdArg;
      slotId = slotIdArg;
    }

    const now = new Date().toISOString();
    let gateCommandSent = false;
    let finalPaymentId = paymentId || `pay_${Date.now().toString().slice(-8)}`;
    let message = 'Payment processed.';

    // 1. Call FastAPI endpoint: POST /payments/{paymentId}/mock-pay
    try {
      const response = await apiClient<any>(`/payments/${finalPaymentId}/mock-pay`, {
        method: 'POST',
        body: JSON.stringify({ amount: Math.round(amount) }),
      });
      if (response) {
        gateCommandSent = Boolean(response.openGate ?? response.gateCommandSent ?? false);
        finalPaymentId = response.paymentId || finalPaymentId;
        message = response.message || (gateCommandSent ? 'Payment verified. Exit gate command sent.' : 'Payment processed.');
      }
    } catch (err: any) {
      console.warn('Backend mock-pay notification, persisting to Firestore directly:', err);
      gateCommandSent = false;
      message = err?.message || 'Backend mock-pay call failed. Service account credentials missing on server.';
    }

    // 2. Persist to Firestore payments collection
    const paymentRecord = {
      paymentId: finalPaymentId,
      sessionId: sessionId || `sess_${finalPaymentId}`,
      plateNumber: vehiclePlate,
      userId,
      amount,
      currency: 'INR',
      method,
      status: 'SUCCEEDED',
      createdAt: now,
      paidAt: now,
      gateCommandIssued: gateCommandSent,
      message,
    };

    if (db && 'type' in db) {
      try {
        await setDoc(doc(db, 'payments', finalPaymentId), {
          ...paymentRecord,
          createdAt: serverTimestamp(),
          paidAt: serverTimestamp(),
        });

        // Mark associated parking session as completed in Firestore
        if (sessionId) {
          try {
            await updateDoc(doc(db, 'parkingSessions', sessionId), {
              status: 'completed',
              paymentStatus: 'paid',
              exitAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch {
            // Non-fatal if session doc does not exist
          }
        }

        // Free up slot in parkingSlots if slotId is provided
        if (slotId) {
          const slotDocId = slotId.toLowerCase().startsWith('slot-') ? slotId.toLowerCase() : `slot-${slotId.toLowerCase()}`;
          try {
            await updateDoc(doc(db, 'parkingSlots', slotDocId), {
              status: 'AVAILABLE',
              currentSessionId: null,
              updatedAt: serverTimestamp(),
            });
          } catch {
            // Non-fatal if doc doesn't exist
          }
        }
      } catch (e) {
        console.error('Could not save payment to Firestore:', e);
      }
    }

    return {
      paymentId: finalPaymentId,
      sessionId: sessionId || `sess_${finalPaymentId}`,
      vehicleNumber: vehiclePlate,
      amount,
      currency: 'INR',
      status: 'paid',
      openGate: gateCommandSent,
      gateCommandSent,
      sessionStatus: 'completed',
      message,
      paidAt: now,
    };
  },

  /**
   * Endpoint D: Get Payment by ID
   * GET /payments/{paymentId}
   */
  async getPaymentById(paymentId: string): Promise<PaymentRecord | null> {
    try {
      const res = await apiClient<any>(`/payments/${paymentId}`, { method: 'GET' });
      if (res && res.paymentId) {
        return {
          paymentId: res.paymentId,
          sessionId: res.sessionId || '',
          plateNumber: res.vehicleNumber || '',
          amount: Number(res.amount || 0),
          currency: res.currency || 'INR',
          method: res.method || 'MOCK',
          status: res.status === 'paid' ? 'SUCCEEDED' : 'PENDING',
          createdAt: res.createdAt || '',
          paidAt: res.paidAt || '',
          gateCommandIssued: true,
          message: res.message,
        };
      }
    } catch {
      // Fall back to Firestore
    }

    if (db && 'type' in db) {
      try {
        const snapshot = await getDocs(collection(db, 'payments'));
        let found: any = null;
        snapshot.forEach(d => {
          if (d.id === paymentId) {
            found = { id: d.id, ...d.data() };
          }
        });
        if (found) {
          return {
            paymentId: found.id,
            sessionId: found.sessionId || '',
            plateNumber: found.plateNumber || '',
            amount: Number(found.amount || 0),
            currency: found.currency || 'INR',
            method: found.method || 'MOCK',
            status: found.status || 'SUCCEEDED',
            createdAt: formatFirestoreDate(found.createdAt),
            paidAt: formatFirestoreDate(found.paidAt),
            gateCommandIssued: Boolean(found.gateCommandIssued),
            message: found.message,
          };
        }
      } catch (e) {
        console.warn('Error reading single payment from Firestore:', e);
      }
    }

    return null;
  },

  /**
   * Calculate exit bill / process exit photo:
   * POST /sessions/exit (multipart/form-data: image)
   */
  async calculateExitBill(file: File): Promise<ExitBillResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await apiClient<any>('/sessions/exit', {
        method: 'POST',
        body: formData,
      });

      if (res) {
        const paymentCode = res.paymentCode || res.code || (res.paymentId ? res.paymentId.replace(/^pay_/, '').slice(0, 6) : '');
        return {
          paymentId: res.paymentId || (paymentCode ? `pay_${paymentCode}` : `pay_${Date.now().toString().slice(-6)}`),
          paymentCode,
          sessionId: res.sessionId || `sess_${Date.now().toString().slice(-4)}`,
          plateNumber: res.plate || res.vehicleNumber || res.plateNumber || 'DETECTED',
          slotId: res.slotId || 'S1',
          durationMinutes: Number(res.durationMinutes || (res.durationSeconds ? Math.round(res.durationSeconds / 60) : 45)),
          hourlyRate: 20,
          amountDue: Number(res.amountDue || res.amount || 20),
          currency: res.currency || 'INR',
          paymentStatus: 'PENDING',
          entryTime: res.entryTime || new Date(Date.now() - 2700000).toISOString(),
          exitRequestedTime: res.exitTime || new Date().toISOString(),
          billingPolicy: 'hourly_started (₹20/hr, min 1 hr)',
          isPaid: false,
          message: res.message || 'Exit bill calculated. 6-digit payment code generated.',
        };
      }
    } catch (err) {
      console.warn('Exit session camera API notice, using local simulation:', err);
    }

    const simCode = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      paymentId: `pay_${simCode}`,
      paymentCode: simCode,
      sessionId: `sess_${simCode}`,
      plateNumber: 'MH12AB1234',
      slotId: 'S1',
      durationMinutes: 45,
      hourlyRate: 20,
      amountDue: 20,
      currency: 'INR',
      paymentStatus: 'PENDING',
      entryTime: new Date(Date.now() - 2700000).toISOString(),
      exitRequestedTime: new Date().toISOString(),
      billingPolicy: 'hourly_started (₹20/hr, min 1 hr)',
      isPaid: false,
      message: `Exit bill calculated. 6-digit payment code: ${simCode}`,
    };
  },
};
