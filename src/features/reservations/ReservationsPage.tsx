import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsService } from '@/services/reservations.service';
import { dashboardService } from '@/services/dashboard.service';
import { useToast } from '@/components/feedback/ToastContext';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import type { Reservation, ReservationStatus } from '@/types/domain';
import {
  CalendarCheck2,
  Plus,
  Car,
  Clock,
  XCircle,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  LogIn,
} from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

export const ReservationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error, info } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Form states
  const [selectedSlotId, setSelectedSlotId] = useState('slot-s2');
  const [plateNumber, setPlateNumber] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');

  // Checkin states
  const [checkingInRes, setCheckingInRes] = useState<Reservation | null>(null);
  const [checkinPlate, setCheckinPlate] = useState('');

  // 1. Fetch Reservations
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => reservationsService.listMyReservations(),
  });

  // 2. Fetch Available Slots for creation dropdown
  const { data: slots = [] } = useQuery({
    queryKey: ['slots-list'],
    queryFn: () => dashboardService.getAllSlots(),
  });

  // 3. Create Reservation Mutation
  const createMutation = useMutation({
    mutationFn: (data: { slotId: string; plateNumber: string; startAt: string; endAt: string }) =>
      reservationsService.createReservation(data),
    onSuccess: newRes => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['slots-list'] });
      setIsModalOpen(false);
      setPlateNumber('');
      success('Reservation Created', `Hold placed on bay ${newRes.slotCode} for ${newRes.plateNumber}`);
    },
    onError: (err: any) => {
      error('Failed to create reservation', err.message || 'Slot may have conflicting bookings');
    },
  });

  // 4. Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => reservationsService.cancelReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['slots-list'] });
      setCancellingId(null);
      info('Reservation Cancelled', 'Slot hold has been released back to availability pool.');
    },
    onError: (err: any) => {
      error('Cancellation Failed', err.message);
    },
  });

  // 5. Check-in Mutation
  const checkinMutation = useMutation({
    mutationFn: ({ id, plate }: { id: string; plate: string }) =>
      reservationsService.checkinReservation(id, plate),
    onSuccess: res => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['slots-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setCheckingInRes(null);
      setCheckinPlate('');
      success('Checked In', `${res.message}. Session ${res.sessionId} active.`);
    },
    onError: (err: any) => {
      error('Check-in Failed', err.message);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !startDateTime || !endDateTime) {
      error('Validation Error', 'Please complete all reservation fields.');
      return;
    }

    createMutation.mutate({
      slotId: selectedSlotId,
      plateNumber: plateNumber.toUpperCase(),
      startAt: new Date(startDateTime).toISOString(),
      endAt: new Date(endDateTime).toISOString(),
    });
  };

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CHECKED_IN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'COMPLETED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900">
            Parking Reservations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Reserve parking slots ahead of time. Fast check-in at barrier with camera plate recognition.
          </p>
        </div>

        <button
          onClick={() => {
            // Pre-fill default dates
            const now = new Date();
            const oneHourLater = new Date(now.getTime() + 3600000);
            const twoHoursLater = new Date(now.getTime() + 7200000);
            setStartDateTime(oneHourLater.toISOString().slice(0, 16));
            setEndDateTime(twoHoursLater.toISOString().slice(0, 16));
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Reservations List */}
      {reservations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3 border border-slate-200">
            <CalendarCheck2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No data available</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            No reservation documents found on Firebase. You can create a new reservation using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reservations.map(res => {
          const isEligibleCancel = res.status === 'CONFIRMED' || res.status === 'PENDING';
          const isEligibleCheckin = res.status === 'CONFIRMED';

          return (
            <div
              key={res.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm font-mono">
                    {res.slotCode}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Bay {res.slotCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {res.id}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                    res.status
                  )}`}
                >
                  {res.status}
                </span>
              </div>

              {/* License Plate Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500">Reserved Vehicle</span>
                </div>
                <span className="font-mono font-bold text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {res.plateNumber}
                </span>
              </div>

              {/* Booking Window Timestamps */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Start:
                  </span>
                  <span className="font-mono text-slate-800 font-medium">
                    {formatDateTime(res.startAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> End:
                  </span>
                  <span className="font-mono text-slate-800 font-medium">
                    {formatDateTime(res.endAt)}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                {isEligibleCheckin && (
                  <button
                    onClick={() => {
                      setCheckingInRes(res);
                      setCheckinPlate(res.plateNumber);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Check In</span>
                  </button>
                )}

                {isEligibleCancel && (
                  <button
                    onClick={() => setCancellingId(res.id)}
                    className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Create Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 z-10 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 font-heading text-base flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-indigo-600" />
                <span>Reserve a Parking Slot</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Slot picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Parking Bay
                </label>
                <select
                  value={selectedSlotId}
                  onChange={e => setSelectedSlotId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {slots.map(s => (
                    <option key={s.id} value={s.id}>
                      Bay {s.slotCode} — Currently {s.status} (Ultrasonic {s.distanceCm}cm)
                    </option>
                  ))}
                </select>
              </div>

              {/* License Plate Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Vehicle License Plate
                </label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={e => setPlateNumber(e.target.value)}
                  placeholder="e.g. MH12AB1234"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              {/* Start Window */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Arrival Time (Start)
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={e => setStartDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              {/* End Window */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Departure Time (End)
                </label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={e => setEndDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Confirming...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check In Confirmation Modal */}
      {checkingInRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setCheckingInRes(null)} />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 z-10 space-y-4">
            <h3 className="font-bold text-slate-900 font-heading text-base flex items-center gap-2">
              <LogIn className="w-5 h-5 text-emerald-600" />
              <span>Check In Reservation</span>
            </h3>
            <p className="text-xs text-slate-500">
              Confirm arrival for Bay {checkingInRes.slotCode}. This will activate the session and open the entrance gate.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Plate Number Verification
              </label>
              <input
                type="text"
                value={checkinPlate}
                onChange={e => setCheckinPlate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setCheckingInRes(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600"
              >
                Dismiss
              </button>
              <button
                onClick={() =>
                  checkinMutation.mutate({
                    id: checkingInRes.id,
                    plate: checkinPlate,
                  })
                }
                disabled={checkinMutation.isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
              >
                {checkinMutation.isPending ? 'Opening Gate...' : 'Verify & Open Gate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancellingId)}
        title="Cancel Reservation?"
        message="Are you sure you want to cancel this booking? The slot will be released back to the general parking pool."
        confirmLabel="Yes, Cancel Booking"
        danger
        onConfirm={() => {
          if (cancellingId) cancelMutation.mutate(cancellingId);
        }}
        onCancel={() => setCancellingId(null)}
      />
    </div>
  );
};
