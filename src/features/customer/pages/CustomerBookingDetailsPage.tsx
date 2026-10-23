import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { reservationsService } from '@/services/reservations.service';
import type { Reservation } from '@/types/domain';
import {
  ArrowLeft,
  CalendarCheck2,
  Car,
  Clock,
  Compass,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Share2,
  Loader2,
  Camera,
} from 'lucide-react';

export const CustomerBookingDetailsPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (bookingId) {
      reservationsService.getReservationById(bookingId).then(res => {
        setReservation(res);
        setLoading(false);
      });
    }
  }, [bookingId]);

  const handleCancel = async () => {
    if (!reservation) return;
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    setIsCancelling(true);
    try {
      await reservationsService.cancelReservation(reservation.id);
      const updated = await reservationsService.getReservationById(reservation.id);
      setReservation(updated);
    } catch (err: any) {
      alert(err.message || 'Could not cancel reservation.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400">Loading reservation details...</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">Reservation Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested booking ID could not be retrieved from Cloud Firestore.
        </p>
        <Link
          to="/parking/bookings"
          className="inline-flex py-2 px-4 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          Back to My Bookings
        </Link>
      </div>
    );
  }

  const isConfirmed = reservation.status === 'CONFIRMED' || reservation.status === 'PENDING';
  const isCheckedIn = reservation.status === 'CHECKED_IN';
  const isCompleted = reservation.status === 'COMPLETED';
  const isCancelled = reservation.status === 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <Link
          to="/parking/bookings"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </Link>
      </div>

      {/* Digital Parking Pass Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden relative">
        {/* Pass Top Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase mb-2">
              Digital Parking Pass
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              Bay {reservation.slotCode || 'S1'}
            </h1>
            <p className="text-xs text-slate-300">
              Smart Parking Facility • Ground Floor North
            </p>
          </div>

          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono inline-block ${
                isCheckedIn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : isConfirmed
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : isCancelled
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {reservation.status}
            </span>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Ref: {reservation.id}
            </p>
          </div>
        </div>

        {/* Pass Details Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* QR Code / Barcode Simulation */}
          <div className="p-5 rounded-2xl bg-white text-slate-950 flex flex-col items-center justify-center space-y-3 shadow-inner">
            <div className="w-36 h-36 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-2 flex flex-col items-center justify-center">
              <QrCode className="w-24 h-24 text-slate-900" />
            </div>
            <p className="font-mono text-xs font-bold tracking-widest text-slate-800 uppercase">
              *{reservation.id}*
            </p>
            <p className="text-[11px] text-slate-500 text-center max-w-xs">
              ESP32-CAM will scan your vehicle plate directly. This QR pass serves as manual barcode backup.
            </p>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Car className="w-3.5 h-3.5 text-indigo-400" />
                Vehicle License Plate:
              </span>
              <p className="text-base font-bold text-white font-mono uppercase">
                {reservation.plateNumber}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Reserved Slot:
              </span>
              <p className="text-base font-bold text-white font-mono">
                Bay {reservation.slotCode}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Start Time:
              </span>
              <p className="font-semibold text-slate-200">
                {new Date(reservation.startAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                End Time:
              </span>
              <p className="font-semibold text-slate-200">
                {new Date(reservation.endAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Automated Entry Gate Guidance */}
          <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              Automated Gate Access Instructions
            </h4>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Drive up to the Entry Gate camera zone (ESP32-CAM).</li>
              <li>The camera recognizes your plate <span className="font-mono text-emerald-300 font-bold uppercase">{reservation.plateNumber}</span>.</li>
              <li>FastAPI verifies your active reservation and sends an MQTT gate-open signal.</li>
              <li>Park in your designated bay: <span className="font-bold text-white">Bay {reservation.slotCode}</span>.</li>
            </ol>
          </div>

          {/* Cancellation Action */}
          {isConfirmed && (
            <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
              <p className="text-[11px] text-slate-400">
                Plans changed? You can cancel before your reservation start time.
              </p>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancel}
                className="py-2 px-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Reservation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
