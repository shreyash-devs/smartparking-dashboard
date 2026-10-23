import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { reservationsService } from '@/services/reservations.service';
import type { Reservation, ReservationStatus } from '@/types/domain';
import {
  CalendarCheck2,
  Car,
  Clock,
  ArrowRight,
  XCircle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  QrCode,
  Loader2,
  CircleParking,
  Ban,
} from 'lucide-react';

export const CustomerBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Filter tab
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Cancel dialog state
  const [cancellingReservation, setCancellingReservation] = useState<Reservation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = reservationsService.subscribeToReservations(
      user?.uid,
      data => {
        setReservations(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleConfirmCancel = async () => {
    if (!cancellingReservation) return;

    setIsCancelling(true);
    try {
      await reservationsService.cancelReservation(cancellingReservation.id);
      setCancelMessage('Reservation cancelled successfully.');
      setTimeout(() => {
        setCancellingReservation(null);
        setCancelMessage(null);
      }, 1500);
    } catch (err: any) {
      setCancelMessage(err.message || 'Could not cancel reservation.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Filter reservations based on tab
  const filteredReservations = reservations.filter(res => {
    if (activeTab === 'UPCOMING') {
      return res.status === 'CONFIRMED' || res.status === 'PENDING' || res.status === 'CHECKED_IN';
    }
    if (activeTab === 'COMPLETED') {
      return res.status === 'COMPLETED';
    }
    if (activeTab === 'CANCELLED') {
      return res.status === 'CANCELLED' || res.status === 'EXPIRED';
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            My Parking Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your slot reservations, retrieve digital gate passes, and check reservation status.
          </p>
        </div>

        <Link
          to="/parking/slots"
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <CircleParking className="w-4 h-4" />
          <span>New Reservation</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {(['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === tab
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab === 'ALL'
              ? 'All Bookings'
              : tab === 'UPCOMING'
              ? 'Upcoming & Active'
              : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredReservations.length > 0 ? (
        <div className="space-y-4">
          {filteredReservations.map(res => {
            const isConfirmed = res.status === 'CONFIRMED' || res.status === 'PENDING';
            const isCheckedIn = res.status === 'CHECKED_IN';
            const isCompleted = res.status === 'COMPLETED';
            const isCancelled = res.status === 'CANCELLED';

            let statusBadge = (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                {res.status}
              </span>
            );

            if (isCheckedIn) {
              statusBadge = (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                  CHECKED IN
                </span>
              );
            } else if (isCompleted) {
              statusBadge = (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  COMPLETED
                </span>
              );
            } else if (isCancelled) {
              statusBadge = (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono">
                  CANCELLED
                </span>
              );
            }

            return (
              <div
                key={res.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left: Bay badge & details */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold font-mono text-lg flex items-center justify-center shrink-0">
                    {res.slotCode || 'S1'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-base">
                        Bay {res.slotCode || 'S1'}
                      </h3>
                      {statusBadge}
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-3">
                      <span className="font-mono text-slate-200 uppercase font-semibold">
                        {res.plateNumber}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">Ref: {res.id}</span>
                    </p>

                    <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {new Date(res.startAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        to{' '}
                        {new Date(res.endAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <Link
                    to={`/parking/bookings/${res.id}`}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-all flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Digital Pass</span>
                  </Link>

                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={() => setCancellingReservation(res)}
                      className="py-2.5 px-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl bg-slate-900 border border-slate-800 p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto">
            <CalendarCheck2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven&apos;t reserved any parking bays under this category yet. Browse available slots to secure your space.
            </p>
          </div>
          <Link
            to="/parking/slots"
            className="inline-flex py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 items-center gap-2"
          >
            <CircleParking className="w-4 h-4" />
            <span>Find Available Parking</span>
          </Link>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Ban className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">Cancel Reservation?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to cancel your reservation for{' '}
                <span className="font-bold text-white">Bay {cancellingReservation.slotCode}</span>{' '}
                (Plate: {cancellingReservation.plateNumber})?
              </p>
            </div>

            {cancelMessage && (
              <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200">
                {cancelMessage}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel Reservation</span>
                )}
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancellingReservation(null)}
                className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-xs transition-all"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
