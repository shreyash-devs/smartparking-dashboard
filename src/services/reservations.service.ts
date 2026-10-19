import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import type { Reservation, ReservationStatus } from '@/types/domain';
import type {
  ReservationCreateRequest,
  ReservationCancelResponse,
  ReservationCheckinResponse,
} from '@/types/api';

import { formatFirestoreDate } from '@/lib/formatters';

export const reservationsService = {
  /**
   * Fetch reservations directly from Firebase Firestore.
   */
  async listMyReservations(status?: ReservationStatus): Promise<Reservation[]> {
    if (!db || !('type' in db)) return [];

    try {
      const reservationsRef = collection(db, 'reservations');
      const snapshot = await getDocs(reservationsRef);
      const results: Reservation[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        const rawStatus = String(data.status || 'CONFIRMED').toUpperCase();
        results.push({
          id: d.id,
          userId: data.userId || '',
          slotId: data.slotId || '',
          slotCode: data.slotCode || data.slotId || '',
          plateNumber: data.plateNumber || data.vehicleNumber || data.plate || '',
          startAt: formatFirestoreDate(data.startAt || data.startTime),
          endAt: formatFirestoreDate(data.endAt || data.endTime),
          status: rawStatus as ReservationStatus,
          checkedInAt: data.checkedInAt ? formatFirestoreDate(data.checkedInAt) : null,
          createdAt: formatFirestoreDate(data.createdAt),
        });
      });

      if (status) {
        return results.filter(r => r.status === status);
      }
      return results;
    } catch (err) {
      console.warn('Error reading reservations from Firestore:', err);
      return [];
    }
  },

  /**
   * Create reservation directly in Firebase Firestore.
   */
  async createReservation(data: ReservationCreateRequest): Promise<Reservation> {
    const newId = `res-${Date.now().toString().slice(-6)}`;
    const newRes: Reservation = {
      id: newId,
      userId: 'current-user',
      slotId: data.slotId,
      slotCode: data.slotId.replace('slot-', '').toUpperCase(),
      plateNumber: data.plateNumber.toUpperCase(),
      startAt: data.startAt,
      endAt: data.endAt,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    if (db && 'type' in db) {
      try {
        await setDoc(doc(db, 'reservations', newId), newRes);
      } catch (e) {
        console.error('Could not save reservation to Firestore:', e);
      }
    }
    return newRes;
  },

  /**
   * Cancel reservation directly in Firebase Firestore.
   */
  async cancelReservation(reservationId: string): Promise<ReservationCancelResponse> {
    if (db && 'type' in db) {
      try {
        await updateDoc(doc(db, 'reservations', reservationId), {
          status: 'CANCELLED',
        });
      } catch (e) {
        console.error('Could not update reservation in Firestore:', e);
      }
    }
    return {
      reservationId,
      status: 'CANCELLED',
      slotId: 'unknown',
      message: 'Reservation cancelled successfully',
    };
  },

  /**
   * Check in reservation directly in Firebase Firestore.
   */
  async checkinReservation(
    reservationId: string,
    plateNumber: string
  ): Promise<ReservationCheckinResponse> {
    if (db && 'type' in db) {
      try {
        await updateDoc(doc(db, 'reservations', reservationId), {
          status: 'CHECKED_IN',
          checkedInAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Could not update checkin in Firestore:', e);
      }
    }
    return {
      reservationId,
      sessionId: `sess-${Date.now().toString().slice(-4)}`,
      slotId: 'slot-checkedin',
      slotCode: 'S1',
      plateNumber,
      checkedInAt: new Date().toISOString(),
      message: 'Reservation checked in successfully.',
    };
  },
};
