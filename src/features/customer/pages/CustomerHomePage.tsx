import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { slotsService } from '@/services/slots.service';
import { reservationsService } from '@/services/reservations.service';
import { paymentsService } from '@/services/payments.service';
import type { ParkingSlot, Reservation, PaymentRecord } from '@/types/domain';
import {
  CircleParking,
  Compass,
  CalendarCheck2,
  CarFront,
  CreditCard,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Radio,
  Clock,
  Car,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const CustomerHomePage: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe to live slots
    const unsubSlots = slotsService.subscribeToLiveSlots(data => {
      setSlots(data);
      setLoading(false);
    });

    // 2. Subscribe to user's reservations
    const unsubReservations = reservationsService.subscribeToReservations(
      user?.uid,
      data => {
        setReservations(data);
      }
    );

    // 3. Fetch recent payments
    paymentsService.getPaymentHistory(user?.uid).then(pays => {
      setRecentPayments(pays.slice(0, 3));
    });

    return () => {
      unsubSlots();
      unsubReservations();
    };
  }, [user?.uid]);

  // Derived counts
  const totalSlots = slots.length || 4;
  const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
  const occupiedSlots = slots.filter(s => s.status === 'OCCUPIED').length;
  const reservedSlots = slots.filter(s => s.status === 'RESERVED').length;

  // Find user's upcoming reservation
  const upcomingReservation = reservations.find(
    r => r.status === 'CONFIRMED' || r.status === 'PENDING'
  );

  // Find user's active session
  // Match by vehicle plate or active session doc
  const activeSessionSlot = slots.find(
    s => s.status === 'OCCUPIED' && (
      (user?.defaultPlate && s.activeVehiclePlate?.toUpperCase() === user.defaultPlate.toUpperCase()) ||
      Boolean(s.activeSessionId)
    )
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Welcome Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Smart Driver Portal
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-heading">
              Welcome back, {user?.displayName?.split(' ')[0] || 'Driver'}!
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Check real-time slot occupancy powered by ultrasonic telemetry, reserve your bay in advance, and enjoy automated touchless camera gate access.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/parking/slots"
                className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-98"
              >
                <CircleParking className="w-4 h-4" />
                <span>Find & Reserve a Slot</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/parking/payments"
                className="py-3 px-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Pay Exit Bill (Code)</span>
              </Link>
            </div>
          </div>

          {/* Quick Availability Stat Ring */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-inner flex flex-col items-center text-center shrink-0 min-w-[200px]">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Live Bay Capacity
            </span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-4xl font-extrabold text-emerald-400 font-heading">
                {availableSlots}
              </span>
              <span className="text-xl text-slate-500 font-bold">/{totalSlots}</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">Bays Available Now</p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(availableSlots / Math.max(1, totalSlots)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Live Availability Overview Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Live Facility Status
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Cloud Firestore Synchronized
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Slots */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Capacity</span>
              <CircleParking className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-extrabold text-white mt-2 font-heading">
              {totalSlots} <span className="text-xs text-slate-500 font-normal">bays</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Ground Floor Covered</p>
          </div>

          {/* Available Slots */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-md relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-medium">Available</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-400 mt-2 font-heading">
              {availableSlots} <span className="text-xs text-emerald-500/80 font-normal">open</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Ready for immediate parking</p>
          </div>

          {/* Occupied Slots */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-400 font-medium">Occupied</span>
              <CarFront className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-extrabold text-white mt-2 font-heading">
              {occupiedSlots} <span className="text-xs text-slate-500 font-normal">parked</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Ultrasonic HC-SR04 verified</p>
          </div>

          {/* Reserved Slots */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400 font-medium">Reserved</span>
              <CalendarCheck2 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-white mt-2 font-heading">
              {reservedSlots} <span className="text-xs text-slate-500 font-normal">held</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Booked for upcoming arrival</p>
          </div>
        </div>
      </div>

      {/* 3. Upcoming Booking or Active Session Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Booking Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-indigo-400" />
                Upcoming Reservation
              </span>
              {upcomingReservation && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {upcomingReservation.status}
                </span>
              )}
            </div>

            {upcomingReservation ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 font-bold text-base flex items-center justify-center font-mono">
                      {upcomingReservation.slotCode || 'BAY'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Bay {upcomingReservation.slotCode}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        Plate: <span className="text-slate-200">{upcomingReservation.plateNumber}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-200">
                      {new Date(upcomingReservation.startAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(upcomingReservation.startAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  The ESP32-CAM OCR gate recognizes your plate automatically upon arrival.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-300">No active upcoming reservations</p>
                <p className="text-[11px] text-slate-500">
                  Need a guaranteed parking spot? Reserve in seconds before driving over.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            {upcomingReservation ? (
              <Link
                to={`/parking/bookings/${upcomingReservation.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>View Digital Pass & Directions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/parking/slots"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Browse Available Slots</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Current Active Session Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CarFront className="w-4 h-4 text-emerald-400" />
                Current Parking Session
              </span>
              {activeSessionSlot && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  VEHICLE PARKED
                </span>
              )}
            </div>

            {activeSessionSlot ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 font-bold text-base flex items-center justify-center font-mono">
                      {activeSessionSlot.slotCode}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Parked in Bay {activeSessionSlot.slotCode}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        Plate: {activeSessionSlot.activeVehiclePlate || user?.defaultPlate || 'Vehicle'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-emerald-400">
                      $2.50 / hr
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Ultrasonic distance: {activeSessionSlot.distanceCm.toFixed(1)} cm
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 text-[11px] text-slate-400 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    When ready to depart, drive to the Exit Gate. The camera recognizes your plate and calculates your mock payment.
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                  <Car className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-300">No vehicle currently parked</p>
                <p className="text-[11px] text-slate-500">
                  Drive into the facility to initiate automated ESP32 session tracking.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <Link
              to="/parking/sessions"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>View Sessions History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Recent Activity and Payment Records */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Recent Activity & Bills
            </h3>
          </div>
          <Link
            to="/parking/payments"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>All Payments</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentPayments.length > 0 ? (
          <div className="space-y-2.5">
            {recentPayments.map(p => (
              <div
                key={p.paymentId}
                className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      Parking Session Settled
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Ref: {p.paymentId} • Method: {p.method}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold font-mono text-emerald-400">
                    ${p.amount.toFixed(2)} {p.currency}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <p className="text-xs text-slate-400">No payment records found yet.</p>
            <p className="text-[11px] text-slate-500">
              Completed parking sessions and exit bills will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
