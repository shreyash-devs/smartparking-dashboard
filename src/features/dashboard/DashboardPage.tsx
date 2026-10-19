import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { slotsService } from '@/services/slots.service';
import { StatCard } from '@/components/cards/StatCard';
import { SlotCard } from '@/components/cards/SlotCard';
import type { ParkingSlot } from '@/types/domain';
import {
  CircleParking,
  Car,
  CheckCircle2,
  Bookmark,
  RefreshCw,
  Info,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatters';

export const DashboardPage: React.FC = () => {
  // 1. Fetch Slots & Subscribe to real-time Firestore updates
  const [liveSlots, setLiveSlots] = useState<ParkingSlot[]>([]);
  const { data: initialSlots, isLoading: isSlotsLoading, refetch } = useQuery({
    queryKey: ['slots-list'],
    queryFn: () => dashboardService.getAllSlots(),
  });

  useEffect(() => {
    if (initialSlots) {
      setLiveSlots(initialSlots);
    }
  }, [initialSlots]);

  useEffect(() => {
    const unsubscribe = slotsService.subscribeToLiveSlots(slots => {
      setLiveSlots(slots);
    });
    return () => unsubscribe();
  }, []);

  // Derived metrics
  const totalSlots = liveSlots.length;
  const occupiedSlots = liveSlots.filter(s => s.status === 'OCCUPIED').length;
  const availableSlots = liveSlots.filter(s => s.status === 'AVAILABLE').length;
  const reservedSlots = liveSlots.filter(s => s.status === 'RESERVED').length;
  const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  // Selected slot modal / detail
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

  return (
    <div className="space-y-6">
      {/* Clean Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900">
            Parking Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time bay occupancy and sensor telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className={`w-2 h-2 rounded-full ${totalSlots > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="font-medium">
              {totalSlots > 0 ? 'Live Telemetry' : 'Awaiting Data'}
            </span>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Basic Metrics (4 Clean Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Slots"
          value={totalSlots}
          subtitle="Configured bays"
          icon={CircleParking}
          color="indigo"
        />
        <StatCard
          title="Available"
          value={availableSlots}
          subtitle="Ready for entry"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Occupied"
          value={occupiedSlots}
          subtitle={`${occupancyRate}% utilization`}
          icon={Car}
          color="rose"
        />
        <StatCard
          title="Reserved"
          value={reservedSlots}
          subtitle="Holds active"
          icon={Bookmark}
          color="amber"
        />
      </div>

      {/* Simple Normal Analysis: Basic Occupancy Progress (shown when data exists) */}
      {totalSlots > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">Occupancy Level</span>
            <span className="font-semibold text-slate-700">{occupancyRate}% in use ({occupiedSlots} of {totalSlots} bays)</span>
          </div>

          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-rose-500 transition-all duration-500"
              style={{ width: `${totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0}%` }}
              title="Occupied"
            />
            <div
              className="bg-amber-500 transition-all duration-500"
              style={{ width: `${totalSlots > 0 ? (reservedSlots / totalSlots) * 100 : 0}%` }}
              title="Reserved"
            />
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 0}%` }}
              title="Available"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Available: {availableSlots}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Occupied: {occupiedSlots}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Reserved: {reservedSlots}
            </span>
          </div>
        </div>
      )}

      {/* Main Section: Slots Grid or No Data Available */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 font-heading">
            Parking Bays
          </h3>
          {totalSlots > 0 && (
            <span className="text-xs text-slate-500 font-medium">
              Click a slot to view telemetry details
            </span>
          )}
        </div>

        {totalSlots > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {liveSlots.map(slot => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onSelect={s => setSelectedSlot(s)}
              />
            ))}
          </div>
        ) : (
          /* Prominent No Data Available Clean State */
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3 border border-slate-200">
              <CircleParking className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No data available</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              No parking slot documents found on Firebase. When your ESP32 sensors or backend write documents to the <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-[11px]">parkingSlots</code> collection, they will appear here in real time.
            </p>
          </div>
        )}
      </div>

      {/* Slot Details Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setSelectedSlot(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 z-10 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg font-mono">
                  {selectedSlot.slotCode}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-heading">
                    Bay {selectedSlot.slotCode} Details
                  </h3>
                  <p className="text-xs text-slate-500">ID: {selectedSlot.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-500">Occupancy</p>
                <p className="font-bold text-slate-900 mt-0.5 text-sm">
                  {selectedSlot.sensorOccupied ? 'Car Detected' : 'Bay Empty'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-500">Ultrasonic Distance</p>
                <p className="font-bold text-slate-900 mt-0.5 text-sm font-mono">
                  {selectedSlot.distanceCm} cm
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-500">Status</p>
                <p className="font-bold text-slate-900 mt-0.5 text-sm">
                  {selectedSlot.status}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-500">Last Telemetry</p>
                <p className="font-bold text-slate-900 mt-0.5 text-sm">
                  {formatRelativeTime(selectedSlot.sensorUpdatedAt)}
                </p>
              </div>
            </div>

            {selectedSlot.activeSessionId && (
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs">
                <p className="font-semibold text-indigo-900">Active Parking Session</p>
                <p className="text-indigo-700 font-mono mt-0.5">
                  Session ID: {selectedSlot.activeSessionId}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
