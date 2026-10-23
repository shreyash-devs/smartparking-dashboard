import React, { useState, useEffect } from 'react';
import { slotsService } from '@/services/slots.service';
import type { ParkingSlot, SlotStatus } from '@/types/domain';
import { BookingModal } from '../components/BookingModal';
import {
  CircleParking,
  Radio,
  Search,
  Filter,
  Car,
  CalendarCheck2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  Clock,
  Compass,
} from 'lucide-react';

export const CustomerSlotsPage: React.FC = () => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<ParkingSlot | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = slotsService.subscribeToLiveSlots(updatedSlots => {
      setSlots(updatedSlots);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter slots
  const filteredSlots = slots.filter(slot => {
    if (statusFilter !== 'ALL' && slot.status !== statusFilter) {
      return false;
    }
    if (
      searchQuery &&
      !slot.slotCode.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const availableCount = slots.filter(s => s.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Live ESP32 Telemetry
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            Parking Slot Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse bays in real time, view ultrasonic sensor status, and book an available spot.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">{availableCount}</span> of{' '}
            <span className="font-semibold text-white">{slots.length}</span> Slots Free
          </div>
        </div>
      </div>

      {/* Visual Status Legend */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            <span className="text-slate-200 font-medium">Available (Click to Book)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50" />
            <span className="text-slate-300">Occupied (Car Parked)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50" />
            <span className="text-slate-300">Reserved (Upcoming Arrival)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-600" />
            <span className="text-slate-400">Out of Service / Stale</span>
          </div>
        </div>

        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
          Standard Rate: $2.50 / hour
        </span>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search bay ID (e.g. S1)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'] as const).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {status === 'ALL'
                ? 'All Bays'
                : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Parking Lot Bay Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredSlots.map(slot => {
          const isAvailable = slot.status === 'AVAILABLE';
          const isOccupied = slot.status === 'OCCUPIED';
          const isReserved = slot.status === 'RESERVED';

          let borderClass = 'border-slate-800';
          let statusBadgeClass = 'bg-slate-800 text-slate-400';
          let statusLabel = 'Unavailable';

          if (isAvailable) {
            borderClass = 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/10 hover:shadow-xl cursor-pointer';
            statusBadgeClass = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
            statusLabel = 'Available';
          } else if (isOccupied) {
            borderClass = 'border-rose-500/30 bg-rose-950/10';
            statusBadgeClass = 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
            statusLabel = 'Occupied';
          } else if (isReserved) {
            borderClass = 'border-amber-500/30 bg-amber-950/10';
            statusBadgeClass = 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
            statusLabel = 'Reserved';
          }

          return (
            <div
              key={slot.id}
              onClick={() => {
                if (isAvailable) {
                  setSelectedSlotForBooking(slot);
                }
              }}
              className={`rounded-3xl bg-slate-900 border p-5 shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden ${borderClass}`}
            >
              {/* Subtle slot bay glow on hover for available */}
              {isAvailable && (
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all" />
              )}

              <div>
                {/* Header: Bay code and status badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-xl font-bold font-mono text-base flex items-center justify-center ${
                        isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 group-hover:scale-110 transition-transform'
                          : isOccupied
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {slot.slotCode}
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm">
                        Bay {slot.slotCode}
                      </span>
                      <p className="text-[10px] text-slate-400">Ground Floor A</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadgeClass}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* Sensor distance and details */}
                <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Telemetry Distance:</span>
                    <span className="font-mono text-slate-200 font-medium">
                      {slot.distanceCm > 0 ? `${slot.distanceCm.toFixed(1)} cm` : 'Online'}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Parking Rate:</span>
                    <span className="font-mono text-emerald-400 font-medium">
                      $2.50 / hr
                    </span>
                  </div>

                  {slot.activeVehiclePlate && (
                    <div className="flex justify-between text-slate-400">
                      <span>Vehicle Plate:</span>
                      <span className="font-mono text-slate-200 font-semibold uppercase">
                        {slot.activeVehiclePlate}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-2">
                {isAvailable ? (
                  <button
                    type="button"
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 group-hover:translate-y-[-1px]"
                  >
                    <span>Reserve Bay {slot.slotCode}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : isOccupied ? (
                  <div className="text-center py-2 text-[11px] font-medium text-rose-400/80 bg-rose-950/20 rounded-xl border border-rose-900/30">
                    Vehicle Parked
                  </div>
                ) : (
                  <div className="text-center py-2 text-[11px] font-medium text-amber-400/80 bg-amber-950/20 rounded-xl border border-amber-900/30">
                    Reserved for Booking
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredSlots.length === 0 && (
        <div className="text-center py-12 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <CircleParking className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No parking slots matched criteria</p>
          <p className="text-xs text-slate-500">
            Try clearing filters or search term to view all bays.
          </p>
        </div>
      )}

      {/* Booking Form Modal */}
      {selectedSlotForBooking && (
        <BookingModal
          slot={selectedSlotForBooking}
          onClose={() => setSelectedSlotForBooking(null)}
          onSuccess={() => {
            // Success handler
          }}
        />
      )}
    </div>
  );
};
