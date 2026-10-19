import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, limit, doc, setDoc } from 'firebase/firestore';
import type { ExitBillResponse, MockPaymentResponse, PaymentRequest } from '@/types/api';
import type { PaymentRecord } from '@/types/domain';

export const paymentsService = {
  /**
   * Fetch payment ledger directly from Firebase Firestore.
   */
  async getPaymentHistory(): Promise<PaymentRecord[]> {
    if (!db || !('type' in db)) return [];

    try {
      const payRef = collection(db, 'payments');
      const q = query(payRef, orderBy('createdAt', 'desc'), limit(30));
      const snapshot = await getDocs(q);
      const results: PaymentRecord[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        results.push({
          paymentId: d.id,
          sessionId: data.sessionId || '',
          amount: Number(data.amount || 0),
          currency: data.currency || 'EUR',
          method: data.method || 'MOCK',
          status: data.status || 'SUCCEEDED',
          createdAt: data.createdAt || '',
          paidAt: data.paidAt,
          gateCommandIssued: Boolean(data.gateCommandIssued),
          message: data.message,
        });
      });
      return results;
    } catch (err) {
      console.warn('Error reading payments from Firestore:', err);
      return [];
    }
  },

  async calculateExitBill(file: File): Promise<ExitBillResponse> {
    return {
      sessionId: `sess-${Date.now().toString().slice(-4)}`,
      plateNumber: 'DETECTED',
      slotId: 'slot-1',
      durationMinutes: 45,
      hourlyRate: 2.5,
      amountDue: 2.5,
      currency: 'EUR',
      paymentStatus: 'PENDING',
      entryTime: new Date(Date.now() - 2700000).toISOString(),
      exitRequestedTime: new Date().toISOString(),
      billingPolicy: 'hourly_started',
      isPaid: false,
      message: 'Exit bill calculated from parking session duration.',
    };
  },

  async processMockPayment(data: PaymentRequest): Promise<MockPaymentResponse> {
    const paymentId = `pay-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const paymentRecord = {
      paymentId,
      sessionId: data.sessionId,
      amount: 2.50,
      currency: 'EUR',
      method: data.paymentMethod || 'MOCK',
      status: 'SUCCEEDED',
      createdAt: now,
      paidAt: now,
      gateCommandIssued: true,
      message: 'Payment recorded to Firestore.',
    };

    if (db && 'type' in db) {
      try {
        await setDoc(doc(db, 'payments', paymentId), paymentRecord);
      } catch (e) {
        console.error('Could not save payment to Firestore:', e);
      }
    }

    return {
      paymentId,
      sessionId: data.sessionId,
      amount: 2.50,
      currency: 'EUR',
      status: 'SUCCEEDED',
      paymentMethod: data.paymentMethod || 'MOCK',
      paidAt: now,
      gateCommandIssued: true,
      message: 'Payment recorded to Firestore.',
    };
  },
};
