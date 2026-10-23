import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  paymentsService,
  type PendingBillLookupResult,
} from '@/services/payments.service';
import type { PaymentRecord } from '@/types/domain';
import { formatCurrency } from '@/lib/formatters';
import { PaymentCheckoutModal } from '../components/PaymentCheckoutModal';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Receipt,
  Radio,
  Clock,
  Car,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const CustomerPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentCodeInput, setPaymentCodeInput] = useState('');
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [lookupResult, setLookupResult] = useState<PendingBillLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Active checkout modal state
  const [activeCheckoutBill, setActiveCheckoutBill] = useState<PendingBillLookupResult | null>(null);

  useEffect(() => {
    // 1. Subscribe to payments
    const unsubscribe = paymentsService.subscribeToPayments(user?.uid, list => {
      setPayments(list);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = paymentCodeInput.trim();
    if (!code) return;

    setIsSearchingCode(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const bill = await paymentsService.lookupByCode(code);
      if (bill) {
        setLookupResult(bill);
      } else {
        setLookupError(`No unpaid bill found matching 6-digit code "${code}". Please check your exit ticket.`);
      }
    } catch (err: any) {
      setLookupError(err.message || 'Error looking up bill code.');
    } finally {
      setIsSearchingCode(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
          Parking Payments & Mock Cashier
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Pay exit bills with your 6-digit code, trigger the ESP32 gate barrier open command, and view payment receipts.
        </p>
      </div>

      {/* 6-Digit Payment Code Lookup Box */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Fast Exit Checkout
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-heading">
            Have a 6-Digit Code from the Gate Display?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            When the ESP32-CAM photographs your vehicle at the exit gate, your 6-digit code is displayed on the gate LCD or ticket. Enter it below to settle your parking fee and open the barrier.
          </p>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                maxLength={6}
                value={paymentCodeInput}
                onChange={e => setPaymentCodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code (e.g. 482910)"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-2xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingCode || paymentCodeInput.length < 3}
              className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSearchingCode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <span>Lookup Bill</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {lookupError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {/* Lookup Result Card */}
          {lookupResult && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-xs space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white text-sm">
                    Unpaid Bill Found #{lookupResult.paymentCode}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-base">
                  {formatCurrency(lookupResult.amount, lookupResult.currency)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Vehicle Plate:</span>
                  <span className="font-mono font-bold text-white uppercase">
                    {lookupResult.vehicleNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Allocated Slot:</span>
                  <span className="font-semibold text-slate-200">
                    Bay {lookupResult.slotCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Duration:</span>
                  <span className="text-slate-200">
                    {lookupResult.durationMinutes} minutes
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Billing Policy:</span>
                  <span className="text-slate-200">₹20 / hour (min 1 hr)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCheckoutBill(lookupResult)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Bill & Trigger Exit Gate</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Ledger / History */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Payment Ledger & Receipts
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {payments.length} Records
          </span>
        </div>

        {payments.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {payments.map(item => (
              <div
                key={item.paymentId}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">
                        {item.paymentId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300">
                        {item.status}
                      </span>
                      {item.gateCommandIssued && (
                        <span className="text-[10px] text-cyan-300 flex items-center gap-1 font-mono">
                          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                          Gate Opened
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Method: <span className="font-medium text-slate-300">{item.method}</span> • {item.message || 'Settled via mock checkout'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-mono font-bold text-emerald-400 text-sm">
                    {formatCurrency(item.amount, item.currency)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-slate-500 space-y-1">
            <p>No payment records found.</p>
            <p className="text-[11px]">When you pay parking exit bills, receipts will appear here.</p>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {activeCheckoutBill && (
        <PaymentCheckoutModal
          bill={activeCheckoutBill}
          onClose={() => setActiveCheckoutBill(null)}
          onPaymentSuccess={() => {
            setLookupResult(null);
            setPaymentCodeInput('');
          }}
        />
      )}
    </div>
  );
};
