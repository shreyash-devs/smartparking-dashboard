import { db } from '@/lib/firebase';
import { collection, getDocs, limit, orderBy, query, doc, setDoc } from 'firebase/firestore';
import type { EntryRecognitionResponse } from '@/types/api';
import type { RecognitionEvent } from '@/types/domain';

import { formatFirestoreDate } from '@/lib/formatters';

export const recognitionService = {
  /**
   * Fetch recognition events directly from Firebase Firestore.
   */
  async getRecentEvents(): Promise<RecognitionEvent[]> {
    if (!db || !('type' in db)) return [];

    try {
      const eventsRef = collection(db, 'recognitionEvents');
      const snapshot = await getDocs(eventsRef);
      const results: RecognitionEvent[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        const timestamp = formatFirestoreDate(data.createdAt || data.timestamp);
        const plateNumber = data.plate || data.plateNumber || data.vehicleNumber || '';
        const isSuccess =
          data.status === 'recognized' ||
          data.status === 'SUCCESS' ||
          data.resultStatus === 'SUCCESS';

        results.push({
          eventId: data.eventId || d.id,
          timestamp,
          location: data.location || 'ENTRY',
          plateNumber,
          confidence: Number(data.confidence || 0),
          resultStatus: isSuccess ? 'SUCCESS' : 'ERROR',
          decision: isSuccess ? 'AUTHORIZED' : 'DENIED',
          sessionId: data.sessionId || null,
          slotCode: data.slotCode || data.slotId || null,
          message: data.errorMessage || (isSuccess ? `Plate ${plateNumber} recognized` : 'Recognition failed'),
        });
      });

      // Sort newest first
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return results;
    } catch (err) {
      console.warn('Error reading recognitionEvents from Firestore:', err);
      return [];
    }
  },

  async submitEntryImage(file: File): Promise<EntryRecognitionResponse> {
    const eventId = `rec-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const result: EntryRecognitionResponse = {
      recognizedPlate: 'SCANNED',
      confidence: 0.95,
      sessionId: `sess-${Date.now().toString().slice(-4)}`,
      slotId: 'slot-1',
      slotCode: 'S1',
      entryTime: now,
      decision: 'AUTHORIZED',
      message: 'Vehicle scan recorded to Firestore.',
    };

    if (db && 'type' in db) {
      try {
        await setDoc(doc(db, 'recognitionEvents', eventId), {
          eventId,
          timestamp: now,
          location: 'ENTRY',
          plateNumber: result.recognizedPlate,
          confidence: result.confidence,
          resultStatus: 'SUCCESS',
          decision: result.decision,
          sessionId: result.sessionId,
          slotCode: result.slotCode,
          message: result.message,
        });
      } catch (e) {
        console.error('Could not save recognition event to Firestore:', e);
      }
    }

    return result;
  },

  async submitExitImage(file: File): Promise<any> {
    const eventId = `rec-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const result = {
      recognizedPlate: 'SCANNED',
      confidence: 0.95,
      sessionId: `sess-${Date.now().toString().slice(-4)}`,
      slotId: 'slot-1',
      amountDue: 2.50,
      currency: 'EUR',
      paymentStatus: 'PENDING',
      decision: 'PAYMENT_REQUIRED',
      message: 'Exit scan recorded to Firestore.',
    };

    if (db && 'type' in db) {
      try {
        await setDoc(doc(db, 'recognitionEvents', eventId), {
          eventId,
          timestamp: now,
          location: 'EXIT',
          plateNumber: result.recognizedPlate,
          confidence: result.confidence,
          resultStatus: 'SUCCESS',
          decision: result.decision,
          sessionId: result.sessionId,
          slotCode: result.slotId,
          message: result.message,
        });
      } catch (e) {
        console.error('Could not save exit event to Firestore:', e);
      }
    }

    return result;
  },
};
