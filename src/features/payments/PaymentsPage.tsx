import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments.service';
import { useToast } from '@/components/feedback/ToastContext';
import type { ExitBillResponse, MockPaymentResponse } from '@/types/api';
import type { PaymentRecord } from '@/types/domain';
import {
  CreditCard,
  Upload,
  CheckCircle2,
  Euro,
  Clock,
  Car,
  ShieldCheck,
  Radio,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
} from '@/lib/formatters';

export const PaymentsPage: React.FC = () => {
  const { success, error, info } = useToast();

  const { data: paymentHistory = [], refetch } = useQuery<PaymentRecord[]>({
    queryKey: ['payment-history'],
    queryFn: () => paymentsService.getPaymentHistory(),
  });

  // Exit Camera Bill scan state
  const [exitFile, setExitFile] = useState<File | null>(null);
  const [activeBill, setActiveBill] = useState<ExitBillResponse | null>(null);
  const [lastPaymentResult, setLastPaymentResult] = useState<MockPaymentResponse | null>(null);

  // Calculate bill mutation
  const billMutation = useMutation({
    mutationFn: (file: File) => paymentsService.calculateExitBill(file),
    onSuccess: bill => {
      setActiveBill(bill);
      setLastPaymentResult(null);
      info('Exit Bill Calculated', `Vehicle ${bill.plateNumber} due: ${formatCurrency(bill.amountDue, bill.currency)}`);
    },
    onError: (err: any) => {
      error('Failed to Calculate Bill', err.message);
    },
  });

  // Process Mock Payment mutation
  const paymentMutation = useMutation({
    mutationFn: (sessionId: string) =>
      paymentsService.processMockPayment({
        sessionId,
        paymentMethod: 'MOCK',
      }),
    onSuccess: res => {
      setLastPaymentResult(res);
      refetch();
      if (activeBill) {
        setActiveBill({ ...activeBill, isPaid: true, paymentStatus: 'SUCCEEDED' });
      }
      success(
        'Payment Confirmed',
        `Charged ${formatCurrency(res.amount, res.currency)}. Gate command dispatched!`
      );
    },
    onError: (err: any) => {
      error('Payment Failed', err.message);
    },
  });

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitFile) {
      error('Missing File', 'Please select a photo taken at the exit barrier.');
      return;
    }
    billMutation.mutate(exitFile);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Exit Cashier Scan & Active Bill Processing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Exit Camera Capture Scanner */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Exit Barrier Cashier
              </h3>
              <p className="text-xs text-slate-500">
                Submit exit camera photo to trigger server billing calculation
              </p>
            </div>
          </div>

          <form onSubmit={handleScanSubmit} className="space-y-3.5">
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
              <input
                type="file"
                accept="image/*"
                id="exit-image-file"
                onChange={e => setExitFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="exit-image-file" className="cursor-pointer block space-y-2">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-600">
                  {exitFile ? (
                    <span className="font-bold text-indigo-600">{exitFile.name}</span>
                  ) : (
                    <>
                      <span className="font-semibold text-indigo-600">Choose exit photo</span> or sample capture
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Posts to /api/v1/payment/exit</p>
              </label>
            </div>

            <button
              type="submit"
              disabled={billMutation.isPending || !exitFile}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {billMutation.isPending ? 'Calculating Server Bill...' : 'Compute Exit Bill'}
            </button>
          </form>

          {/* Gate status advisory */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <Radio className="w-3.5 h-3.5 text-amber-600" />
              <span>Gate Safety Protocol</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Exit barrier remains strictly locked until FastAPI verifies payment and issues an authenticated MQTT servo command.
            </p>
          </div>
        </div>

        {/* Right: Authoritative Server Bill & Mock Payment Terminal */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Authoritative Session Bill
              </h3>
              {activeBill && (
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    activeBill.isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {activeBill.isPaid ? 'PAID & RELEASED' : 'PAYMENT PENDING'}
                </span>
              )}
            </div>

            {activeBill ? (
              <div className="my-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border">
                    <span className="text-slate-400 block">Plate</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {activeBill.plateNumber}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border">
                    <span className="text-slate-400 block">Duration</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {formatDuration(activeBill.durationMinutes)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border">
                    <span className="text-slate-400 block">Hourly Rate</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {formatCurrency(activeBill.hourlyRate, activeBill.currency)}/hr
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-indigo-700 font-medium">Authoritative Total Due</span>
                    <p className="text-3xl font-extrabold text-indigo-950 font-heading mt-0.5">
                      {formatCurrency(activeBill.amountDue, activeBill.currency)}
                    </p>
                  </div>

                  {!activeBill.isPaid && (
                    <button
                      onClick={() => paymentMutation.mutate(activeBill.sessionId)}
                      disabled={paymentMutation.isPending}
                      className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{paymentMutation.isPending ? 'Processing...' : 'Submit Mock Payment'}</span>
                    </button>
                  )}
                </div>

                {/* Gate Dispatched Confirmation */}
                {lastPaymentResult && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>FastAPI Payment Receipt Confirmed</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-tight">
                      {lastPaymentResult.message}
                    </p>
                    <div className="pt-1 flex items-center gap-3 font-mono text-[11px] text-emerald-800">
                      <span>Gate Command: {lastPaymentResult.gateCommandIssued ? 'DISPATCHED' : 'PENDING'}</span>
                      <span>Paid At: {formatDateTime(lastPaymentResult.paidAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="my-8 text-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No active bill scanned</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload an exit capture on the left to review parking duration and submit settlement.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Payment Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Settled Payment Ledger (FastAPI Records)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Plate</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Gate Servo Trigger</th>
                <th className="py-3 px-4">Settled At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No data available</p>
                    <p className="text-xs text-slate-400 mt-1">No payment documents found on Firebase.</p>
                  </td>
                </tr>
              ) : (
                paymentHistory.map(pay => (
                  <tr key={pay.paymentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{pay.paymentId}</td>
                    <td className="py-3.5 px-4 font-mono text-blue-600">{pay.sessionId}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {pay.plateNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                      {formatCurrency(pay.amount, pay.currency)}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-semibold text-slate-700">{pay.method}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Radio className="w-3 h-3 text-emerald-600" />
                        Command Issued
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {formatRelativeTime(pay.paidAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
