import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  RefreshCw,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/feedback/ToastContext';

interface HeaderProps {
  onOpenMobileNav: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Operations Dashboard',
    subtitle: 'Real-time telemetry, ultrasonic slot tracking, and barrier status',
  },
  '/slots': {
    title: 'Parking Slots & Sensors',
    subtitle: 'Ultrasonic HC-SR04 telemetry, physical occupancy, and allocations',
  },
  '/reservations': {
    title: 'Smart Reservations',
    subtitle: 'Pre-book slots, check in with plate number, and manage booking windows',
  },
  '/recognition': {
    title: 'ESP32-CAM & OCR Recognition',
    subtitle: 'Plate Recognizer Cloud OCR events, confidence scores, and manual snapshot testing',
  },
  '/sessions': {
    title: 'Active & Historical Sessions',
    subtitle: 'Real-time vehicle presence tracking, billing duration, and slot assignments',
  },
  '/payments': {
    title: 'Cashier & Gate Release',
    subtitle: 'Exit billing calculation, mock payments, and MQTT gate servo actuation',
  },
  '/analytics': {
    title: 'Historical Analytics',
    subtitle: 'Occupancy patterns, entry/exit vehicle volume, revenue, and sensor trends',
  },
  '/devices': {
    title: 'IoT Devices & Heartbeats',
    subtitle: 'ESP32 microcontroller, ESP32-CAMs, HC-SR04 sensors, and servo motors',
  },
  '/settings': {
    title: 'System Settings',
    subtitle: 'API endpoints, hardware thresholds, and environment configuration',
  },
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobileNav }) => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { info, success } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentPath = location.pathname;
  const meta = PAGE_TITLES[currentPath] || {
    title: 'Smart Parking System',
    subtitle: 'Intelligent IoT parking platform',
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      success('Telemetry Refreshed', 'Latest sensor and session records loaded.');
    }, 400);
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {meta.title}
          </h1>
          <p className="hidden md:block text-xs text-slate-500 font-normal">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">

        {/* Live Firestore indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Firestore Live</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:scale-95 transition-all"
          title="Refresh real-time data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>
    </header>
  );
};
