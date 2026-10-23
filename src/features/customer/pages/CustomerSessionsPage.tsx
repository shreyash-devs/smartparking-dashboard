import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { slotsService } from '@/services/slots.service';
import type { ParkingSlot } from '@/types/domain';
import {
  CarFront,
  Clock,
  CircleParking,
  CreditCard,
  Radio,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface SessionItem {
  id: string;
  vehicleNumber: string;
  slotCode: string;
  entryTime: string;
  exitTime?: string;
  durationMinutes: number;
  amountDue: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAYMENT_PENDING';
  paymentStatus: string;
  paymentCode?: string;
}

export const CustomerSessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Subscribe to Firestore parkingSessions
  useEffect(() => {
    if (!db || !('type' in db)) {
      setLoading(false);
      return;
    }

    try {
      const q = collection(db, 'parkingSessions');
      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const list: SessionItem[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            const plate = data.vehicleNumber || data.plateNumber || data.plate || 'UNKNOWN';

            // Filter for current user's vehicle if available, or if demo session
            const matchesUser =
              !user?.defaultPlate ||
              plate.toUpperCase().includes(user.defaultPlate.toUpperCase()) ||
              data.userId === user?.uid ||
              data.userId === 'current-user';

            const entryTime = data.entryTime || data.entryAt || data.createdAt || new Date().toISOString();
            const exitTime = data.exitTime || data.exitAt;

            const duration = data.durationMinutes || (
              exitTime
                ? Math.round((new Date(exitTime).getTime() - new Date(entryTime).getTime()) / 60000)
                : Math.max(15, Math.round((Date.now() - new Date(entryTime).getTime()) / 60000))
            );

            const status = String(data.status || 'ACTIVE').toUpperCase() as any;

            list.push({
              id: doc.id,
              vehicleNumber: plate,
              slotCode: String(data.slotId || data.slotCode || 'S1').replace('slot-', '').toUpperCase(),
              entryTime,
              exitTime,
              durationMinutes: duration,
              amountDue: Number(data.amountDue || Math.max(2.5, Math.ceil(duration / 60) * 2.5)),
              status,
              paymentStatus: data.paymentStatus || (status === 'COMPLETED' ? 'SUCCEEDED' : 'PENDING'),
              paymentCode: data.paymentCode,
            });
          });

          // Sort newest first
          list.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
          setSessions(list);
          setLoading(false);
        },
        err => {
          console.warn('Sessions error:', err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, [user]);

  // 2. Subscribe to live slots to detect physical occupancy
  useEffect(() => {
    const unsubSlots = slotsService.subscribeToLiveSlots(data => {
      setSlots(data);
    });
    return () => unsubSlots();
  }, []);

  // Find active session
  const activeSession = sessions.find(s => s.status === 'ACTIVE');

  // Timer for active session live counter
  useEffect(() => {
    if (!activeSession) return;

    const entryMs = new Date(activeSession.entryTime).getTime();
    const updateTimer = () => {
      const diffSec = Math.max(0, Math.floor((Date.now() - entryMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  const completedSessions = sessions.filter(s => s.status === 'COMPLETED');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
          Parking Sessions & History
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Monitor your ongoing parking session duration in real time and review completed sessions.
        </p>
      </div>

      {/* Active Session Highlight Banner */}
      {activeSession ? (
        <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold font-mono tracking-wider text-emerald-400 uppercase">
                  Active Parking Session In Progress
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold font-mono text-xl flex items-center justify-center shadow-lg">
                  {activeSession.slotCode}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight font-heading">
                    Parked in Bay {activeSession.slotCode}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Plate: <span className="text-slate-200 uppercase font-bold">{activeSession.vehicleNumber}</span> • Ref: {activeSession.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400 block text-[11px]">Entry Time</span>
                  <span className="font-semibold text-white">
                    {new Date(activeSession.entryTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400 block text-[11px]">Live Elapsed Time</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[11px]">Estimated Accrued Bill</span>
                  <span className="font-mono font-bold text-slate-100">
                    ${(Math.max(1, Math.ceil(elapsedSeconds / 3600)) * 2.5).toFixed(2)} EUR
                  </span>
                </div>
              </div>
            </div>

            {/* Exit Instructions & Quick Pay */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-3 shrink-0 md:max-w-xs">
              <h3 className="font-bold text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Exit & Payment Instructions
              </h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Drive to the Exit Gate when departing. The ESP32-CAM will capture your vehicle plate and generate your 6-digit payment code.
              </p>
              <Link
                to="/parking/payments"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Go to Mock Cashier & Pay</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center space-y-3 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <CarFront className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">No Vehicle Currently Parked</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            When your vehicle enters the smart parking lot, the ESP32-CAM camera automatically identifies your plate and starts a real-time session.
          </p>
          <Link
            to="/parking/slots"
            className="inline-flex py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm items-center gap-2"
          >
            <CircleParking className="w-4 h-4" />
            <span>Find an Open Slot</span>
          </Link>
        </div>
      )}

      {/* Completed Sessions History */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-md space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          Previous Completed Sessions
        </h3>

        {completedSessions.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {completedSessions.map(session => (
              <div
                key={session.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-slate-300">
                    {session.slotCode}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        Bay {session.slotCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {session.paymentStatus}
                      </span>
                    </div>
                    <p className="text-slate-400 font-mono text-[11px] mt-0.5">
                      Plate: <span className="uppercase text-slate-200">{session.vehicleNumber}</span> • Duration: {session.durationMinutes} mins
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-mono font-bold text-slate-200">
                    ${session.amountDue.toFixed(2)} EUR
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(session.entryTime).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500 space-y-1">
            <p>No past parking sessions recorded yet.</p>
            <p className="text-[11px]">Completed sessions will be logged here with duration and receipts.</p>
          </div>
        )}
      </div>
    </div>
  );
};
