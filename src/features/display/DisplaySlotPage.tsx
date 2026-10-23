import React, { useEffect, useState } from 'react';
import { slotsService } from '@/services/slots.service';
import { paymentsService } from '@/services/payments.service';
import { formatRelativeTime } from '@/lib/formatters';
import { Loader2, Clock } from 'lucide-react';

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
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
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

  // Load pending public‑safe payments once
  useEffect(() => {
    const load = async () => {
      try {
        const pending = await paymentsService.listPendingBills();
        setPayments(pending);
      } catch (e) {
        console.warn('Failed to fetch pending payments', e);
      } finally {
        setLoadingPayments(false);
      }
    };
    load();
  }, []);

  const total = slots.length;
  const available = slots.filter((s) => s.status === 'AVAILABLE').length;
  const occupied = slots.filter((s) => s.status === 'OCCUPIED').length;
  const unknown = total - available - occupied;

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
            <Loader2 className="animate-spin w-12 h-12 text-indigo-400" /> Loading slots…
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

      {/* Payment notification panel */}
      <section className="mt-4 bg-slate-800 p-4 rounded-xl max-h-48 overflow-y-auto">
        <h2 className="text-xl font-heading mb-2">Pending Payments</h2>
        {loadingPayments ? (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin w-5 h-5" /> Loading…
          </div>
        ) : payments.length === 0 ? (
          <p className="opacity-70">No pending payments.</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((p) => (
              <li key={p.paymentId} className="border-b border-slate-600 pb-2">
                <div className="flex justify-between text-sm">
                  <span className="font-mono">Code: {p.paymentCode}</span>
                  <span className="font-mono">ID: {p.paymentId}</span>
                </div>
                <div className="flex justify-between text-xs opacity-80 mt-1">
                  <span>Amount: {p.amount} {p.currency}</span>
                  <span>Status: {p.status}</span>
                </div>
                {p.message && <div className="text-xs opacity-60 mt-1">{p.message}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
