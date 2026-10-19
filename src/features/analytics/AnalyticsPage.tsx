import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  CircleParking,
  Car,
  CheckCircle2,
} from 'lucide-react';
import { StatCard } from '@/components/cards/StatCard';

export const AnalyticsPage: React.FC = () => {
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['slots-analytics'],
    queryFn: () => dashboardService.getAllSlots(),
  });

  const totalSlots = slots.length;
  const occupiedSlots = slots.filter(s => s.status === 'OCCUPIED').length;
  const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
  const reservedSlots = slots.filter(s => s.status === 'RESERVED').length;

  const chartData = [
    { name: 'Available', count: availableSlots, fill: '#10b981' },
    { name: 'Occupied', count: occupiedSlots, fill: '#f43f5e' },
    { name: 'Reserved', count: reservedSlots, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900">
            Parking Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Basic slot occupancy and availability analysis based on live telemetry.
          </p>
        </div>
      </div>

      {/* When no documents exist in Firebase */}
      {totalSlots === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3 border border-slate-200">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No data available</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            No parking slot documents found on Firebase. When documents are available in Firestore, basic occupancy analysis will display here.
          </p>
        </div>
      ) : (
        <>
          {/* Simple Basic Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Bays"
              value={totalSlots}
              subtitle="Registered slots"
              icon={CircleParking}
              color="indigo"
            />
            <StatCard
              title="Available Bays"
              value={availableSlots}
              subtitle="Currently free"
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Occupied Bays"
              value={occupiedSlots}
              subtitle="Currently in use"
              icon={Car}
              color="rose"
            />
          </div>

          {/* Simple Basic Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Current Bay Distribution
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
