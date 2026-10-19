import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { SlotCard } from '@/components/cards/SlotCard';
import type { ParkingSlot } from '@/types/domain';
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  Radio,
  Car,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  formatDistance,
  formatRelativeTime,
  getSlotStatusMeta,
  getHealthStatusMeta,
} from '@/lib/formatters';

export const SlotsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [healthFilter, setHealthFilter] = useState<string>('ALL');

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['slots-full-list'],
    queryFn: () => dashboardService.getAllSlots(),
    refetchInterval: 5000,
  });

  // Filter logic
  const filteredSlots = slots.filter(slot => {
    const matchesSearch =
      slot.slotCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (slot.activeSessionId && slot.activeSessionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (slot.reservationId && slot.reservationId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || slot.status === statusFilter;
    const matchesHealth = healthFilter === 'ALL' || slot.healthStatus === healthFilter;

    return matchesSearch && matchesStatus && matchesHealth;
  });

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search, Filters, View Mode Toggle */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search slot code (e.g. S1, S2)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 transition-all"
          />
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="RESERVED">Reserved</option>
              <option value="ALLOCATED">Allocated</option>
            </select>
          </div>

          {/* Health filter */}
          <select
            value={healthFilter}
            onChange={e => setHealthFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Health</option>
            <option value="HEALTHY">Healthy</option>
            <option value="STALE">Stale Reading</option>
            <option value="OFFLINE">Offline</option>
          </select>

          {/* Grid / Table toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {slots.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3 border border-slate-200">
            <Car className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No data available</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            No parking slot documents found on Firebase. Once your ESP32 sensors or backend initialize slots in the <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-[11px]">parkingSlots</code> collection, they will appear here.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSlots.map(slot => (
            <SlotCard key={slot.id} slot={slot} />
          ))}
          {filteredSlots.length === 0 && (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
              <Car className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">No parking slots matched your filters</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or search query.</p>
            </div>
          )}
        </div>
      ) : (
        /* Table Display Mode */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Bay Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Ultrasonic Distance</th>
                  <th className="py-3 px-4">Occupancy Flag</th>
                  <th className="py-3 px-4">Telemetry Health</th>
                  <th className="py-3 px-4">Session / Reservation</th>
                  <th className="py-3 px-4">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSlots.map(slot => {
                  const statusMeta = getSlotStatusMeta(slot.status);
                  const healthMeta = getHealthStatusMeta(slot.healthStatus);

                  return (
                    <tr key={slot.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                        {slot.slotCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] border ${statusMeta.bgColor}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {formatDistance(slot.distanceCm)}
                      </td>
                      <td className="py-3.5 px-4">
                        {slot.sensorOccupied ? (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <Car className="w-3.5 h-3.5" /> Detected
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Empty
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${healthMeta.bgColor}`}
                        >
                          <Radio className="w-3 h-3" />
                          {healthMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {slot.activeSessionId ? (
                          <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
                            {slot.activeSessionId}
                          </span>
                        ) : slot.reservationId ? (
                          <span className="font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">
                            {slot.reservationId}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {formatRelativeTime(slot.sensorUpdatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
