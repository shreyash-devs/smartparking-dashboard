import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { slotsService } from '@/services/slots.service';
import { formatRelativeTime } from '@/lib/formatters';
import { Loader2, Clock, QrCode } from 'lucide-react';

// Helper to map slot status to colour classes
const statusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'OCCUPIED':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'RESERVED':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'OUT_OF_SERVICE':
    case 'UNKNOWN':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export const DisplaySlotPage: React.FC = () => {
  const [slots, setSlots] = useState<any[]>([]);
  const [paymentCode, setPaymentCode] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [clock, setClock] = useState(new Date());

  // Live clock ticker
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to real‑time slot updates
  useEffect(() => {
    const unsub = slotsService.subscribeToLiveSlots((liveSlots) => {
      setSlots(liveSlots);
      setLastUpdate(new Date());
      setLoadingSlots(false);
    }, (err) => {
      console.warn('Slot subscription error', err);
      setLoadingSlots(false);
    });
    return () => unsub && unsub();
  }, []);

  // Subscribe strictly to Firestore `payments` collection — show the paymentCode from payments document ONLY
  useEffect(() => {
    if (!db || !('type' in db)) return;

    // Listen only to `payments` collection
    const paymentsQ = query(
      collection(db, 'payments'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubPayments = onSnapshot(paymentsQ, (snapshot) => {
      let foundCode: string | null = null;
      for (const d of snapshot.docs) {
        const data = d.data();
        const code = data.paymentCode || data.code;
        if (code && String(code).trim()) {
          foundCode = String(code).trim();
          break;
        }
      }
      setPaymentCode(foundCode);
    }, (err) => {
      console.warn('Payment code listener error', err);
    });

    return () => unsubPayments();
  }, []);

  const total = slots.length;
  const available = slots.filter((s) => s.status === 'AVAILABLE').length;
  const occupied = slots.filter((s) => s.status === 'OCCUPIED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-bold font-heading">SMART PARKING</h1>
        <div className="flex items-center gap-2 text-lg">
          <Clock className="w-6 h-6" />
          {clock.toLocaleDateString()} {clock.toLocaleTimeString()}
        </div>
      </header>

      {/* Summary */}
      <section className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-slate-800 p-4 rounded-xl">
          <div className="text-sm uppercase opacity-70">Total Slots</div>
          <div className="text-3xl font-bold">{total}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <div className="text-sm uppercase opacity-70">Available</div>
          <div className="text-3xl font-bold text-emerald-400">{available}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl">
          <div className="text-sm uppercase opacity-70">Occupied</div>
          <div className="text-3xl font-bold text-rose-400">{occupied}</div>
        </div>
      </section>

      {/* Slot boxes (2×2 grid) */}
      <main className="flex-1 grid grid-cols-2 gap-6 mb-6">
        {loadingSlots ? (
          <div className="col-span-2 flex items-center justify-center">
            <Loader2 className="animate-spin w-12 h-12 text-indigo-400 mr-3" /> Loading slots…
          </div>
        ) : (
          slots.slice(0, 4).map((slot) => (
            <div
              key={slot.id}
              className={`border-2 rounded-xl p-8 text-center text-5xl font-bold ${statusColor(slot.status)}`}
            >
              <div className="text-2xl mb-2">{slot.slotCode || slot.id}</div>
              <div>{slot.status}</div>
            </div>
          ))
        )}
      </main>

      {/* Connection indicator */}
      <footer className="flex justify-between items-center text-sm mb-4">
        <div>{lastUpdate ? `Last update: ${formatRelativeTime(lastUpdate.toISOString())}` : 'No data yet'}</div>
        <div className={`flex items-center gap-2 ${slots.length ? 'text-emerald-400' : 'text-rose-400'}`}>
          <span className="w-3 h-3 rounded-full bg-current" />
          {slots.length ? 'Live' : 'Disconnected'}
        </div>
      </footer>

      {/* ── Payment Code Display (Customer Portal) ── */}
      <section className="mt-4 bg-slate-900 border border-indigo-500/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold uppercase tracking-widest">
          <QrCode className="w-4 h-4" />
          Your Exit Payment Code
        </div>

        {paymentCode ? (
          <>
            <div className="text-7xl font-extrabold font-mono tracking-[0.3em] text-white bg-indigo-600/20 border border-indigo-500/50 rounded-2xl px-10 py-6 select-all">
              {paymentCode}
            </div>
            <p className="text-slate-400 text-sm max-w-xs">
              Enter this code on the customer portal under <span className="text-indigo-300 font-semibold">Payments</span> to settle your bill and open the exit gate.
            </p>
          </>
        ) : (
          <div className="text-slate-500 text-sm py-4">
            No payment code active right now.
          </div>
        )}
      </section>
    </div>
  );
};
