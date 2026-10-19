import { db } from '@/lib/firebase';
import { collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import type { ParkingSlot, SlotStatus } from '@/types/domain';
import { formatFirestoreDate } from '@/lib/formatters';

interface ActiveSessionInfo {
  sessionId: string;
  vehicleNumber: string;
  entryTime: string;
}

function parseSlotDoc(
  docId: string,
  data: any,
  activeSessionMap: Map<string, ActiveSessionInfo>
): ParkingSlot {
  const slotCode = String(data.slotCode || data.slotId || data.code || data.slot || data.name || docId).toUpperCase();
  const activeSession = activeSessionMap.get(slotCode);

  const isOccupied =
    Boolean(activeSession) ||
    data.status?.toLowerCase() === 'occupied' ||
    data.status?.toLowerCase() === 'active' ||
    Boolean(data.occupied) ||
    Boolean(data.isOccupied) ||
    Boolean(data.sensorOccupied) ||
    (typeof data.distanceCm === 'number' && data.distanceCm > 0 && data.distanceCm < 30) ||
    (typeof data.distance === 'number' && data.distance > 0 && data.distance < 30);

  const isReserved =
    !isOccupied &&
    (data.status?.toLowerCase() === 'reserved' ||
      Boolean(data.reserved) ||
      Boolean(data.isReserved) ||
      Boolean(data.reservationId));

  let status: SlotStatus = 'AVAILABLE';
  if (isOccupied) {
    status = 'OCCUPIED';
  } else if (isReserved) {
    status = 'RESERVED';
  } else if (data.status) {
    const s = String(data.status).toUpperCase();
    if (s === 'OUT_OF_SERVICE' || s === 'UNAVAILABLE') status = 'OUT_OF_SERVICE';
    else if (s === 'ALLOCATED') status = 'ALLOCATED';
    else status = 'AVAILABLE';
  }

  const distanceCm = Number(
    data.distanceCm ?? data.distance ?? (isOccupied ? 20.0 : 150.0)
  );

  return {
    id: docId,
    slotCode,
    status,
    sensorOccupied: isOccupied,
    distanceCm,
    sensorUpdatedAt: formatFirestoreDate(
      data.sensorUpdatedAt || data.updatedAt || data.timestamp || activeSession?.entryTime || null
    ),
    reservationId: data.reservationId || null,
    activeSessionId: activeSession?.sessionId || data.activeSessionId || data.sessionId || null,
    activeVehiclePlate: activeSession?.vehicleNumber || data.vehicleNumber || data.plateNumber || data.plate || null,
    healthStatus: data.healthStatus || 'HEALTHY',
    updatedAt: formatFirestoreDate(data.updatedAt || activeSession?.entryTime || null),
  };
}

async function getActiveSessionsMap(): Promise<Map<string, ActiveSessionInfo>> {
  const map = new Map<string, ActiveSessionInfo>();
  if (!db || !('type' in db)) return map;

  try {
    const snap = await getDocs(collection(db, 'parkingSessions'));
    snap.forEach(d => {
      const data = d.data();
      const rawStatus = String(data.status || '').toLowerCase();
      if (rawStatus === 'active') {
        const slotKey = String(data.slotId || data.slotCode || '').toUpperCase();
        if (slotKey) {
          map.set(slotKey, {
            sessionId: data.sessionId || d.id,
            vehicleNumber: data.vehicleNumber || data.plateNumber || data.plate || '',
            entryTime: formatFirestoreDate(data.entryTime || data.entryAt || data.createdAt),
          });
        }
      }
    });
  } catch (e) {
    console.warn('Error reading active parkingSessions:', e);
  }
  return map;
}

export const slotsService = {
  /**
   * Fetch slots directly and solely from Firebase Firestore.
   * Merges real-time status with active parkingSessions.
   */
  async getSlots(): Promise<ParkingSlot[]> {
    if (!db || !('type' in db)) {
      return [];
    }

    try {
      const activeSessions = await getActiveSessionsMap();

      // Query 'parkingSlots' collection
      let snap = await getDocs(collection(db, 'parkingSlots'));
      if (snap.empty) {
        snap = await getDocs(collection(db, 'slots'));
      }

      if (!snap.empty) {
        const slots: ParkingSlot[] = [];
        snap.forEach(doc => {
          slots.push(parseSlotDoc(doc.id, doc.data(), activeSessions));
        });
        slots.sort((a, b) => a.slotCode.localeCompare(b.slotCode, undefined, { numeric: true }));
        return slots;
      }

      // If parkingSlots collection is not yet created, derive default 4 slots and overlay active sessions
      const defaultBays = ['S1', 'S2', 'S3', 'S4'];
      const slots: ParkingSlot[] = defaultBays.map(code => {
        const active = activeSessions.get(code);
        return {
          id: `slot-${code.toLowerCase()}`,
          slotCode: code,
          status: active ? 'OCCUPIED' : 'AVAILABLE',
          sensorOccupied: Boolean(active),
          distanceCm: active ? 20.0 : 150.0,
          sensorUpdatedAt: active?.entryTime || null,
          reservationId: null,
          activeSessionId: active?.sessionId || null,
          activeVehiclePlate: active?.vehicleNumber || null,
          healthStatus: 'HEALTHY',
          updatedAt: active?.entryTime || null,
        };
      });

      return slots;
    } catch (err) {
      console.error('Error reading slots from Firestore:', err);
      return [];
    }
  },

  /**
   * Real-time subscription directly to Firebase Firestore.
   */
  subscribeToLiveSlots(
    onUpdate: (slots: ParkingSlot[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    if (!db || !('type' in db)) {
      onUpdate([]);
      return () => {};
    }

    try {
      let unsubSessions: (() => void) | null = null;
      let unsubSlots: (() => void) | null = null;

      let currentActiveSessions = new Map<string, ActiveSessionInfo>();
      let rawSlotDocs: Array<{ id: string; data: any }> = [];

      const emitUpdated = () => {
        if (rawSlotDocs.length > 0) {
          const slots = rawSlotDocs.map(d => parseSlotDoc(d.id, d.data, currentActiveSessions));
          slots.sort((a, b) => a.slotCode.localeCompare(b.slotCode, undefined, { numeric: true }));
          onUpdate(slots);
        } else {
          // Derive default bays S1-S4 if parkingSlots collection has no documents
          const defaultBays = ['S1', 'S2', 'S3', 'S4'];
          const slots: ParkingSlot[] = defaultBays.map(code => {
            const active = currentActiveSessions.get(code);
            return {
              id: `slot-${code.toLowerCase()}`,
              slotCode: code,
              status: active ? 'OCCUPIED' : 'AVAILABLE',
              sensorOccupied: Boolean(active),
              distanceCm: active ? 20.0 : 150.0,
              sensorUpdatedAt: active?.entryTime || null,
              reservationId: null,
              activeSessionId: active?.sessionId || null,
              activeVehiclePlate: active?.vehicleNumber || null,
              healthStatus: 'HEALTHY',
              updatedAt: active?.entryTime || null,
            };
          });
          onUpdate(slots);
        }
      };

      // Listen to active parkingSessions in real time
      unsubSessions = onSnapshot(
        collection(db, 'parkingSessions'),
        snapshot => {
          const map = new Map<string, ActiveSessionInfo>();
          snapshot.forEach(d => {
            const data = d.data();
            const rawStatus = String(data.status || '').toLowerCase();
            if (rawStatus === 'active') {
              const slotKey = String(data.slotId || data.slotCode || '').toUpperCase();
              if (slotKey) {
                map.set(slotKey, {
                  sessionId: data.sessionId || d.id,
                  vehicleNumber: data.vehicleNumber || data.plateNumber || data.plate || '',
                  entryTime: formatFirestoreDate(data.entryTime || data.entryAt || data.createdAt),
                });
              }
            }
          });
          currentActiveSessions = map;
          emitUpdated();
        },
        err => console.warn('Sessions live listener error:', err)
      );

      // Listen to parkingSlots in real time
      unsubSlots = onSnapshot(
        collection(db, 'parkingSlots'),
        snapshot => {
          rawSlotDocs = [];
          snapshot.forEach(doc => {
            rawSlotDocs.push({ id: doc.id, data: doc.data() });
          });
          emitUpdated();
        },
        error => {
          console.warn('Slots live listener error:', error);
          if (onError) onError(error);
          emitUpdated();
        }
      );

      return () => {
        if (unsubSessions) unsubSessions();
        if (unsubSlots) unsubSlots();
      };
    } catch (err: any) {
      console.warn('Could not setup Firestore live listener:', err);
      onUpdate([]);
      return () => {};
    }
  },
};
