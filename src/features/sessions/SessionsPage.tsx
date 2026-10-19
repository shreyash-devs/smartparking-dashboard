import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { ParkingSession } from '@/types/domain';
import {
  Car,
  Search,
} from 'lucide-react';
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatFirestoreDate,
} from '@/lib/formatters';

export const SessionsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: sessions = [], isLoading } = useQuery<ParkingSession[]>({
    queryKey: ['parking-sessions'],
    queryFn: async () => {
      // Fetch directly from Firestore (supports both parkingSessions and sessions collection)
      try {
        if (db && 'type' in db) {
          let snap = await getDocs(collection(db, 'parkingSessions'));
          if (snap.empty) {
            snap = await getDocs(collection(db, 'sessions'));
          }
          const list: ParkingSession[] = [];
          snap.forEach(d => {
            const data = d.data();
            const entryAt = formatFirestoreDate(data.entryTime || data.entryAt || data.createdAt);
            const exitAt = data.exitTime ? formatFirestoreDate(data.exitTime) : data.exitAt ? formatFirestoreDate(data.exitAt) : null;
            const entryDate = entryAt ? new Date(entryAt) : null;
            const durationMinutes = Number(data.durationMinutes) || (entryDate && !isNaN(entryDate.getTime()) ? Math.max(1, Math.round((Date.now() - entryDate.getTime()) / 60000)) : 0);
            const rawStatus = String(data.status || 'active').toUpperCase();
            const status = rawStatus === 'ACTIVE' ? 'ACTIVE' : rawStatus === 'COMPLETED' ? 'COMPLETED' : 'PAYMENT_PENDING';

            list.push({
              sessionId: data.sessionId || d.id,
              plateNumber: data.vehicleNumber || data.plateNumber || data.plate || '',
              slotId: data.slotId || '',
              slotCode: data.slotId || data.slotCode || '',
              entryAt,
              exitAt,
              durationMinutes,
              status,
              amountDue: Number(data.amountDue || (Math.ceil(durationMinutes / 60) * 30)),
              currency: data.currency || 'INR',
              paymentStatus: data.paymentStatus || (rawStatus === 'COMPLETED' ? 'PAID' : 'PENDING'),
            });
          });
          return list;
        }
      } catch (e) {
        console.warn('Error reading sessions from Firestore:', e);
      }

      return [];
    },
  });

  const filtered = sessions.filter(sess => {
    const matchesSearch =
      sess.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sess.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sess.slotCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || sess.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900">
            Parking Sessions
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tracking active vehicle stays, bay allocations, duration timers, and billing status.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search plate or session..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Sessions</option>
            <option value="ACTIVE">Active Stays</option>
            <option value="PAYMENT_PENDING">Payment Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Sessions Grid or No Data Available */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3 border border-slate-200">
            <Car className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No data available</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            No active or historical parking sessions found on Firebase.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 shadow-xs">
          <Car className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700">No sessions match your filter</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(sess => (
            <div
              key={sess.sessionId}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base font-mono">
                    {sess.slotCode}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Bay {sess.slotCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {sess.sessionId}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sess.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : sess.status === 'COMPLETED'
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {sess.status}
                </span>
              </div>

              {/* License Plate Display */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500">Vehicle</span>
                </div>
                <span className="font-mono font-bold text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {sess.plateNumber}
                </span>
              </div>

              {/* Duration & Fee Row */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Duration</span>
                  <span className="font-bold text-slate-800 font-mono mt-0.5 block">
                    {formatDuration(sess.durationMinutes)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Current Fee</span>
                  <span className="font-bold text-emerald-600 font-mono mt-0.5 block">
                    {formatCurrency(sess.amountDue, sess.currency)}
                  </span>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Entry:</span>
                  <span className="font-mono text-slate-700 font-medium">
                    {formatDateTime(sess.entryAt)}
                  </span>
                </div>
                {sess.exitAt && (
                  <div className="flex justify-between">
                    <span>Exit:</span>
                    <span className="font-mono text-slate-700 font-medium">
                      {formatDateTime(sess.exitAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
