import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { reservationsService } from '@/services/reservations.service';
import type { ParkingSlot } from '@/types/domain';
import {
  X,
  Calendar,
  Clock,
  Car,
  CircleCheck,
  ShieldAlert,
  Loader2,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

interface BookingModalProps {
  slot: ParkingSlot;
  onClose: () => void;
  onSuccess?: (reservationId: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  slot,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Helper to format local date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to format current time HH:MM
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(Math.ceil(now.getMinutes() / 15) * 15 % 60).padStart(2, '0');
  const defaultStartTime = `${currentHours}:${currentMinutes}`;

  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [plateNumber, setPlateNumber] = useState(user?.defaultPlate || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedReservationId, setConfirmedReservationId] = useState<string | null>(null);

  const hourlyRate = 2.5;
  const estimatedCost = (durationHours * hourlyRate).toFixed(2);

  // Compute calculated end time
  const calculateEndTime = () => {
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const start = new Date(`${date}T${startTime}:00`);
      const end = new Date(start.getTime() + durationHours * 3600 * 1000);
      return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPlate = plateNumber.trim().toUpperCase();
    if (!cleanPlate || cleanPlate.length < 3) {
      setError('Please enter a valid vehicle license plate number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 3600 * 1000);

      const reservation = await reservationsService.createReservation(
        {
          slotId: slot.id,
          plateNumber: cleanPlate,
          startAt: startDateTime.toISOString(),
          endAt: endDateTime.toISOString(),
        },
        user?.uid || 'current-user'
      );

      setConfirmedReservationId(reservation.id);
      if (onSuccess) {
        onSuccess(reservation.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedReservationId ? (
          // Success State View
          <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CircleCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Reservation Confirmed!
              </h3>
              <p className="text-xs text-slate-400">
                Your parking slot has been reserved in Cloud Firestore.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Reservation Reference:</span>
                <span className="font-mono font-bold text-indigo-400">
                  {confirmedReservationId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Allocated Slot:</span>
                <span className="font-bold text-white">Bay {slot.slotCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle Plate:</span>
                <span className="font-mono font-semibold text-slate-200 uppercase">
                  {plateNumber.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reserved Window:</span>
                <span className="text-slate-200">
                  {startTime} to {calculateEndTime()} ({durationHours} hrs)
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2 font-semibold">
                <span className="text-slate-300">Estimated Total:</span>
                <span className="text-emerald-400">${estimatedCost} EUR</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => navigate(`/parking/bookings/${confirmedReservationId}`)}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <span>View Digital Pass</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-xs transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // Reservation Form
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-lg font-mono">
                {slot.slotCode}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Reserve Parking Slot {slot.slotCode}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Currently Available • $2.50 / hour
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Vehicle License Plate */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Vehicle License Plate
                </label>
                <div className="relative">
                  <Car className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={plateNumber}
                    onChange={e => setPlateNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. MH12AB1234"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm font-mono uppercase text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:normal-case placeholder:font-sans placeholder:text-slate-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Required for automated ESP32-CAM license OCR entry gate recognition.
                </p>
              </div>

              {/* Date & Start Time Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Duration Options */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Duration (Hours)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(hours => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDurationHours(hours)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        durationHours === hours
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                          : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {hours} hr{hours > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Box */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Reserved Period:</span>
                  <span className="text-slate-200 font-medium">
                    {startTime} — {calculateEndTime()} ({durationHours} hours)
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Parking Rate:</span>
                  <span className="text-slate-200 font-mono">$2.50 / hour</span>
                </div>
                <div className="flex justify-between border-t border-indigo-500/20 pt-1.5 font-bold">
                  <span className="text-slate-200">Estimated Total:</span>
                  <span className="text-emerald-400 text-sm font-mono">
                    ${estimatedCost} EUR
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming Reservation...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Reservation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
