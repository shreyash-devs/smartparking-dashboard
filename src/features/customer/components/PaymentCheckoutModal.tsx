import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { paymentsService, type PendingBillLookupResult } from '@/services/payments.service';
import { formatCurrency } from '@/lib/formatters';
import {
  X,
  CreditCard,
  CheckCircle2,
  Radio,
  ShieldCheck,
  Loader2,
  Car,
  Clock,
  ArrowRight,
  Receipt,
  QrCode,
  Banknote,
  AlertTriangle,
} from 'lucide-react';

interface PaymentCheckoutModalProps {
  bill: PendingBillLookupResult;
  onClose: () => void;
  onPaymentSuccess?: (paymentId: string) => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  bill,
  onClose,
  onPaymentSuccess,
}) => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'MOCK' | 'CREDIT_CARD' | 'RFID' | 'FASTAG'>('MOCK');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await paymentsService.processMockPayment(
        bill.paymentId,
        bill.amount,
        bill.sessionId || `sess-${bill.paymentCode}`,
        bill.vehicleNumber,
        selectedMethod,
        user?.uid || 'current-user',
        bill.slotId
      );

      setSuccessResult(res);
      if (onPaymentSuccess) {
        onPaymentSuccess(res.paymentId);
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {successResult ? (
          // Success Receipt View
          <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Payment Succeeded!
              </h3>
              <p className="text-xs text-slate-400">
                Mock payment processed and recorded in Cloud Firestore.
              </p>
            </div>

            {/* Exit Gate Banner */}
            {successResult.gateCommandSent || successResult.openGate ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-emerald-300">
                      Exit Barrier Authorized
                    </p>
                    <p className="text-[10px] text-slate-300">
                      MQTT &apos;OPEN&apos; command sent to ESP32 exit gate
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  OPEN
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5 text-left">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-300">
                    Exit Barrier Servo Not Triggered
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {successResult.message || "FastAPI backend did not dispatch MQTT command (serviceAccountKey.json error on server)."}
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  LOCKED
                </span>
              </div>
            )}

            {/* Receipt Summary */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono font-medium text-slate-200">
                  {successResult.paymentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle Plate:</span>
                <span className="font-mono font-bold text-white uppercase">
                  {bill.vehicleNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bay Occupied:</span>
                <span className="font-semibold text-slate-200">
                  Slot {bill.slotCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="text-slate-200">{bill.durationMinutes} mins</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2 font-bold text-sm">
                <span className="text-slate-300">Amount Paid:</span>
                <span className="text-emerald-400 font-mono">
                  {formatCurrency(bill.amount, bill.currency)}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20"
            >
              Close Receipt
            </button>
          </div>
        ) : (
          // Checkout Form
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Settle Exit Parking Bill
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Code: #{bill.paymentCode} • Bay {bill.slotCode}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Bill Details Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-500" />
                  Vehicle Plate:
                </span>
                <span className="font-mono font-bold text-white bg-slate-700/50 px-2 py-0.5 rounded uppercase">
                  {bill.vehicleNumber}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Parking Duration:
                </span>
                <span className="font-medium text-slate-200">
                  {bill.durationMinutes} minutes
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-700/60 pt-2 font-bold text-sm">
                <span className="text-slate-300">Total Amount Due:</span>
                <span className="text-emerald-400 font-mono text-base">
                  {formatCurrency(bill.amount, bill.currency)}
                </span>
              </div>
            </div>

            {/* Mock Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Mock Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('MOCK')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                    selectedMethod === 'MOCK'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold">Mock Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('FASTAG')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                    selectedMethod === 'FASTAG'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80'
                  }`}
                >
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold">Fastag RFID</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Demonstration Mock Cashier. No actual funds are charged. Submitting triggers FastAPI business logic and publishes the MQTT exit gate servo command.
              </span>
            </div>

            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing with FastAPI...</span>
                </>
              ) : (
                <>
                  <span>Pay {formatCurrency(bill.amount, bill.currency)} & Open Gate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
