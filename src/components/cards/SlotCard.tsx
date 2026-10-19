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
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface SlotCardProps {
  slot: ParkingSlot;
  onSelect?: (slot: ParkingSlot) => void;
}

export const SlotCard: React.FC<SlotCardProps> = ({ slot, onSelect }) => {
  const statusMeta = getSlotStatusMeta(slot.status);
  const healthMeta = getHealthStatusMeta(slot.healthStatus);

  // Check if sensor reading is stale (> 30s)
  const isStale =
    slot.healthStatus === 'STALE' ||
    (slot.sensorUpdatedAt && Date.now() - new Date(slot.sensorUpdatedAt).getTime() > 30000);

  // Distance range for visual gauge (0 cm to 200 cm)
  const clampedDistance = Math.min(200, Math.max(0, slot.distanceCm));
  const distancePercentage = (clampedDistance / 200) * 100;

  return (
    <div
      onClick={() => onSelect?.(slot)}
      className={`relative bg-white rounded-2xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer ${
        slot.status === 'OCCUPIED'
          ? 'border-rose-200/90 hover:border-rose-300'
          : slot.status === 'AVAILABLE'
          ? 'border-emerald-200/90 hover:border-emerald-300'
          : slot.status === 'RESERVED'
          ? 'border-amber-200/90 hover:border-amber-300'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Top row: Slot Code + Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base font-mono shadow-xs">
            {slot.slotCode}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Bay {slot.slotCode}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${statusMeta.dotColor} ${slot.status === 'OCCUPIED' ? 'animate-pulse' : ''}`} />
              <span className={`text-xs font-bold ${statusMeta.textColor}`}>
                {statusMeta.label}
              </span>
            </div>
          </div>
        </div>

        {/* Health status badge */}
        <div
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${healthMeta.bgColor}`}
          title={`Sensor health: ${slot.healthStatus}`}
        >
          <Radio className="w-3 h-3 animate-pulse" />
          <span>{healthMeta.label}</span>
        </div>
      </div>

      {/* Visual Car Space Box */}
      <div className="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              slot.sensorOccupied
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <Car className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">HC-SR04 Sensor</p>
            <p className="text-sm font-bold text-slate-800 font-mono">
              {formatDistance(slot.distanceCm)}
            </p>
          </div>
        </div>

        {/* Sensor distance bar */}
        <div className="w-20">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
            <span>Range</span>
            <span>{Math.round(slot.distanceCm)}cm</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                slot.distanceCm < 30 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(5, distancePercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warning if stale data */}
      {isStale && (
        <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center gap-2 text-amber-800 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-[11px] font-medium leading-tight">
            Telemetry is delayed. Sensor reading may not reflect present state.
          </span>
        </div>
      )}

      {/* Active Session / Reservation Info */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
        {slot.activeSessionId ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-500" />
                Active Session:
              </span>
              <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[130px]">
                {slot.activeSessionId}
              </span>
            </div>
            {slot.activeVehiclePlate && (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-500 flex items-center gap-1">
                  <Car className="w-3 h-3 text-rose-500" />
                  Vehicle:
                </span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {slot.activeVehiclePlate}
                </span>
              </div>
            )}
          </>
        ) : slot.reservationId ? (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Bookmark className="w-3 h-3 text-amber-500" />
              Reservation:
            </span>
            <span className="font-mono font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              {slot.reservationId}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Allocation:
            </span>
            <span className="text-[11px] font-medium text-emerald-600">Free to allocate</span>
          </div>
        )}

        {/* Last sensor update time */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last telemetry:
          </span>
          <span className="font-mono text-slate-600 font-medium">
            {formatRelativeTime(slot.sensorUpdatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};
