import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue' | 'slate';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  badge,
}) => {
  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badge: 'bg-indigo-100 text-indigo-700',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badge: 'bg-emerald-100 text-emerald-700',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      badge: 'bg-rose-100 text-rose-700',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badge: 'bg-amber-100 text-amber-700',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      badge: 'bg-blue-100 text-blue-700',
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
      badge: 'bg-slate-200 text-slate-700',
    },
  }[color];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl border ${colorStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colorStyles.badge}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight font-heading">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1 font-normal">{subtitle}</p>}
      </div>
    </div>
  );
};
