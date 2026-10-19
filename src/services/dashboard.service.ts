import type { DashboardSummary, ParkingSlot } from '@/types/domain';
import type { SlotAvailabilityResponse } from '@/types/api';
import { slotsService } from './slots.service';

export const dashboardService = {
  /**
   * Calculate summary directly from live Firestore slots.
   * No FastAPI endpoints called.
   */
  async getSummary(): Promise<DashboardSummary> {
    const slots = await slotsService.getSlots();
    const totalSlots = slots.length;
    const occupiedSlots = slots.filter(s => s.status === 'OCCUPIED').length;
    const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
    const reservedSlots = slots.filter(s => s.status === 'RESERVED').length;
    const activeSessions = slots.filter(s => Boolean(s.activeSessionId)).length;
    const healthySensors = slots.filter(s => s.healthStatus === 'HEALTHY').length;
    const offlineSensors = slots.filter(s => s.healthStatus === 'OFFLINE').length;

    return {
      totalSlots,
      availableSlots,
      reservedSlots,
      allocatedSlots: 0,
      physicallyOccupiedSlots: occupiedSlots,
      unavailableSlots: 0,
      activeSessions,
      occupancyRatePercentage: totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
      vehiclesEnteredToday: 0,
      vehiclesExitedToday: 0,
      todayRevenue: 0,
      deviceHealth: {
        healthySensors,
        staleSensors: 0,
        offlineSensors,
        lastTelemetryAt: slots[0]?.sensorUpdatedAt || null,
      },
    };
  },

  async getAllSlots(): Promise<ParkingSlot[]> {
    return slotsService.getSlots();
  },

  async getAvailableSlots(): Promise<SlotAvailabilityResponse> {
    const slots = await slotsService.getSlots();
    const freeSlots = slots.filter(s => s.status === 'AVAILABLE');
    return {
      totalAvailable: freeSlots.length,
      slots: freeSlots,
    };
  },
};
