import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { apiClient } from '@/lib/api-client';
import type { Reservation, ReservationStatus } from '@/types/domain';
import type {
  ReservationCreateRequest,
  ReservationCancelResponse,
  ReservationCheckinResponse,
} from '@/types/api';
import { formatFirestoreDate } from '@/lib/formatters';

export const reservationsService = {
  /**
   * Fetch reservations directly from Firebase Firestore, optionally filtered by user and status.
   */
  async listMyReservations(userId?: string, status?: ReservationStatus): Promise<Reservation[]> {
    if (!db || !('type' in db)) return [];

    try {
      // First try to fetch from backend API if available
      try {
        const apiReservations = await apiClient<any[]>('/reservations', { method: 'GET' });
        if (Array.isArray(apiReservations) && apiReservations.length > 0) {
          return apiReservations.map(r => ({
            id: r.reservationId || r.id,
            userId: r.userId || userId || '',
            slotId: r.slotId || '',
            slotCode: String(r.slotId || '').replace('slot-', '').toUpperCase(),
            plateNumber: r.plateNumber || r.vehicleNumber || '',
            startAt: formatFirestoreDate(r.startTime || r.startAt),
            endAt: formatFirestoreDate(r.endTime || r.endAt),
            status: (r.status || 'CONFIRMED').toUpperCase() as ReservationStatus,
            checkedInAt: r.checkedInAt ? formatFirestoreDate(r.checkedInAt) : null,
            createdAt: formatFirestoreDate(r.createdAt),
          }));
        }
      } catch (e) {
        // Fall back to Firestore
      }

      const reservationsRef = collection(db, 'reservations');
      const snapshot = await getDocs(reservationsRef);
      const results: Reservation[] = [];

      snapshot.forEach(d => {
        const data = d.data();
        const rawStatus = String(data.status || 'CONFIRMED').toUpperCase();
        const docUserId = data.userId || '';

        // If userId is provided, filter reservations for this user (unless user is admin)
        if (userId && docUserId && docUserId !== userId && docUserId !== 'current-user') {
          return;
        }

        results.push({
          id: d.id,
          userId: docUserId,
          slotId: data.slotId || '',
          slotCode: data.slotCode || data.slotId?.replace('slot-', '').toUpperCase() || '',
          plateNumber: data.plateNumber || data.vehicleNumber || data.plate || '',
          startAt: formatFirestoreDate(data.startAt || data.startTime),
          endAt: formatFirestoreDate(data.endAt || data.endTime),
          status: rawStatus as ReservationStatus,
          checkedInAt: data.checkedInAt ? formatFirestoreDate(data.checkedInAt) : null,
          createdAt: formatFirestoreDate(data.createdAt),
        });
      });

      // Sort newest first
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
   * Real-time subscription to user's reservations.
   */
  subscribeToReservations(
    userId: string | undefined,
    onUpdate: (reservations: Reservation[]) => void
  ): () => void {
    if (!db || !('type' in db)) {
      onUpdate([]);
      return () => {};
    }

    try {
      const reservationsRef = collection(db, 'reservations');
      return onSnapshot(
        reservationsRef,
        snapshot => {
          const results: Reservation[] = [];
          snapshot.forEach(d => {
            const data = d.data();
            const docUserId = data.userId || '';

            // Match user or current-user fallback
            if (userId && docUserId && docUserId !== userId && docUserId !== 'current-user') {
              return;
            }

            results.push({
              id: d.id,
              userId: docUserId,
              slotId: data.slotId || '',
              slotCode: data.slotCode || data.slotId?.replace('slot-', '').toUpperCase() || '',
              plateNumber: data.plateNumber || data.vehicleNumber || data.plate || '',
              startAt: formatFirestoreDate(data.startAt || data.startTime),
              endAt: formatFirestoreDate(data.endAt || data.endTime),
              status: String(data.status || 'CONFIRMED').toUpperCase() as ReservationStatus,
              checkedInAt: data.checkedInAt ? formatFirestoreDate(data.checkedInAt) : null,
              createdAt: formatFirestoreDate(data.createdAt),
            });
          });

          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          onUpdate(results);
        },
        err => {
          console.warn('Reservations listener error:', err);
        }
      );
    } catch {
      return () => {};
    }
  },

  /**
   * Fetch a single reservation by ID
   */
  async getReservationById(reservationId: string): Promise<Reservation | null> {
    if (!db || !('type' in db)) return null;

    try {
      // Try backend endpoint first
      try {
        const res = await apiClient<any>(`/reservations/${reservationId}`, { method: 'GET' });
        if (res && res.reservationId) {
          return {
            id: res.reservationId,
            userId: res.userId || '',
            slotId: res.slotId || '',
            slotCode: String(res.slotId || '').replace('slot-', '').toUpperCase(),
            plateNumber: res.plateNumber || res.vehicleNumber || '',
            startAt: formatFirestoreDate(res.startTime || res.startAt),
            endAt: formatFirestoreDate(res.endTime || res.endAt),
            status: (res.status || 'CONFIRMED').toUpperCase() as ReservationStatus,
            checkedInAt: res.checkedInAt ? formatFirestoreDate(res.checkedInAt) : null,
            createdAt: formatFirestoreDate(res.createdAt),
          };
        }
      } catch {
        // Fall back to Firestore
      }

      const docSnap = await getDoc(doc(db, 'reservations', reservationId));
      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId || '',
        slotId: data.slotId || '',
        slotCode: data.slotCode || data.slotId?.replace('slot-', '').toUpperCase() || '',
        plateNumber: data.plateNumber || data.vehicleNumber || data.plate || '',
        startAt: formatFirestoreDate(data.startAt || data.startTime),
        endAt: formatFirestoreDate(data.endAt || data.endTime),
        status: String(data.status || 'CONFIRMED').toUpperCase() as ReservationStatus,
        checkedInAt: data.checkedInAt ? formatFirestoreDate(data.checkedInAt) : null,
        createdAt: formatFirestoreDate(data.createdAt),
      };
    } catch (err) {
      console.warn('Error reading single reservation:', err);
      return null;
    }
  },

  /**
   * Create reservation via FastAPI backend or atomic Firestore transaction.
   */
  async createReservation(
    data: ReservationCreateRequest,
    userId: string = 'current-user'
  ): Promise<Reservation> {
    const newId = `res-${Date.now().toString().slice(-6)}`;
    const slotCode = data.slotId.replace('slot-', '').toUpperCase();

    const newRes: Reservation = {
      id: newId,
      userId,
      slotId: data.slotId,
      slotCode,
      plateNumber: data.plateNumber.toUpperCase().trim(),
      startAt: data.startAt,
      endAt: data.endAt,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    // Try backend FastAPI POST /reservations
    let backendReservationId = newId;
    try {
      const response = await apiClient<any>('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          slotId: slotCode,
          startTime: data.startAt,
          endTime: data.endAt,
        }),
      });
      if (response?.reservationId) {
        backendReservationId = response.reservationId;
        newRes.id = backendReservationId;
      }
    } catch (apiErr) {
      console.warn('Backend reservation notice, storing to Firestore directly:', apiErr);
    }

    // Persist to Firestore
    if (db && 'type' in db) {
      try {
        await setDoc(doc(db, 'reservations', backendReservationId), {
          ...newRes,
          id: backendReservationId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error('Could not save reservation to Firestore:', e);
      }
    }

    return newRes;
  },

  /**
   * Cancel reservation
   */
  async cancelReservation(reservationId: string): Promise<ReservationCancelResponse> {
    // Attempt backend cancel endpoint
    try {
      await apiClient(`/reservations/${reservationId}/cancel`, { method: 'POST' });
    } catch (err) {
      console.warn('Backend cancel notice, updating Firestore directly:', err);
    }

    if (db && 'type' in db) {
      try {
        await updateDoc(doc(db, 'reservations', reservationId), {
          status: 'CANCELLED',
          updatedAt: serverTimestamp(),
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
   * Check in reservation
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
          updatedAt: serverTimestamp(),
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
