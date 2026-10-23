import React from 'react';
import { NavLink, Link } from 'react-router-dom';

import {
  LayoutDashboard,
  CircleParking,
  CalendarCheck2,
  Camera,
  CarFront,
  CreditCard,
  BarChart3,
  Cpu,
  Settings,
  Radio,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Parking Slots', path: '/slots', icon: CircleParking },
  { name: 'Reservations', path: '/reservations', icon: CalendarCheck2 },
  { name: 'Plate OCR Camera', path: '/recognition', icon: Camera },
  { name: 'Parking Sessions', path: '/sessions', icon: CarFront },
  { name: 'Billing & Gate', path: '/payments', icon: CreditCard },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'IoT Devices', path: '/devices', icon: Cpu },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 h-full flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <CircleParking className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight font-heading flex items-center gap-1.5">
            SmartPark <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-semibold border border-indigo-500/30">IoT</span>
          </span>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ESP32 & Cloud OCR
          </p>
        </div>
      </div>

      {/* Hardware Telemetry Badge */}
      <div className="px-4 py-3">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div>
              <p className="text-[11px] font-semibold text-slate-200">ESP32 Controller</p>
              <p className="text-[10px] text-slate-400">Telemetry Active (MQTT/HTTP)</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-semibold">
            LIVE
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          );
        })}
      </nav>

      {/* Switch to Customer Portal */}
      <div className="px-3 pb-2">
        <Link
          to="/parking"
          onClick={onCloseMobile}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 hover:bg-cyan-900/40 transition-all"
        >
          <div className="flex items-center gap-2">
            <CircleParking className="w-4 h-4 text-cyan-400" />
            <span>Driver Portal View</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </Link>
      </div>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.displayName ? user.displayName.slice(0, 2) : 'OP'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                {user?.displayName || 'Station Operator'}
                {user?.isAdmin && (
                  <span title="Administrator" className="inline-flex items-center">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  </span>
                )}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'driver@smartpark.iot'}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
