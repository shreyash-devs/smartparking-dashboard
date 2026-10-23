import React from 'react';
import type { ParkingSlot } from '@/types/domain';
import {
  formatRelativeTime,
  formatDistance,
  getSlotStatusMeta,
  getHealthStatusMeta,
} from '@/lib/formatters';
import {
  Car,
  AlertTriangle,
  Radio,
  Clock,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';

interface SlotCardProps {
  slot: ParkingSlot;
  onSelect?: (slot: ParkingSlot) => void;
}

export const SlotCard: React.FC<SlotCardProps> = ({ slot, onSelect }) => {
  const statusMeta = getSlotStatusMeta(slot.status);
  const healthMeta = getHealthStatusMeta(slot.healthStatus);

  // Check if sensor telemetry is delayed (> 30s)
  const isStale =
    slot.healthStatus === 'STALE' ||
    (slot.sensorUpdatedAt && Date.now() - new Date(slot.sensorUpdatedAt).getTime() > 30000);

  // Distance range for visual gauge (0 cm to 200 cm)
  const clampedDistance = Math.min(200, Math.max(0, slot.distanceCm));
  const distancePercentage = (clampedDistance / 200) * 100;

  const isOccupied = slot.status === 'OCCUPIED' || slot.sensorOccupied;
  const isAvailable = slot.status === 'AVAILABLE';
  const isReserved = slot.status === 'RESERVED';

  return (
    <div
      onClick={() => onSelect?.(slot)}
      className={`group relative bg-white rounded-2xl border p-4.5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between ${
        isOccupied
          ? 'border-rose-200/80 hover:border-rose-300'
          : isAvailable
          ? 'border-emerald-200/80 hover:border-emerald-300'
          : isReserved
          ? 'border-amber-200/80 hover:border-amber-300'
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      {/* 1. Header: Bay ID, Status Pill, and Telemetry Delayed Notice */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm font-mono shadow-xs group-hover:scale-105 transition-transform">
              {slot.slotCode}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">
                  Bay {slot.slotCode}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor} ${
                    isOccupied ? 'animate-pulse' : ''
                  }`}
                />
              </div>
              <span className={`text-[11px] font-semibold ${statusMeta.textColor}`}>
                {statusMeta.label}
              </span>
            </div>
          </div>

          {/* Stale Warning Pill (Concise 2-word badge) or Health Indicator */}
          {isStale ? (
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-medium"
              title="Sensor telemetry is delayed"
            >
              <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
              <span>Telemetry delayed</span>
            </div>
          ) : (
            <div
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${healthMeta.bgColor}`}
              title={`Sensor health: ${slot.healthStatus}`}
            >
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>{healthMeta.label}</span>
            </div>
          )}
        </div>

        {/* 2. Minimal Sensor Distance Display */}
        <div className="my-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isOccupied
                  ? 'bg-rose-100/80 text-rose-600'
                  : 'bg-emerald-100/80 text-emerald-600'
              }`}
            >
              <Car className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Ultrasonic Distance</p>
              <p className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">
                {formatDistance(slot.distanceCm)}
              </p>
            </div>
          </div>

          {/* Compact visual gauge bar */}
          <div className="w-16 text-right">
            <span className="text-[10px] font-mono text-slate-400">
              {Math.round(clampedDistance)}cm
            </span>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  slot.distanceCm < 30 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(8, distancePercentage)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Footer: Vehicle Tag / Reservation & Timestamp */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {slot.activeVehiclePlate ? (
          <div className="flex items-center gap-1 font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[10px]">
            <Car className="w-3 h-3 text-slate-500" />
            <span>{slot.activeVehiclePlate}</span>
          </div>
        ) : slot.reservationId ? (
          <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-medium border border-amber-200/60">
            <Bookmark className="w-3 h-3 text-amber-500" />
            <span>Reserved</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Available</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
          <Clock className="w-2.5 h-2.5 text-slate-400" />
          <span>{formatRelativeTime(slot.sensorUpdatedAt)}</span>
        </div>
      </div>
    </div>
  );
};
