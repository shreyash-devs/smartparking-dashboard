import React from 'react';
import { CircleParking, Radio, ShieldCheck, Heart } from 'lucide-react';

export const CustomerFooter: React.FC = () => {
  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <CircleParking className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-200">SmartPark IoT Portal</span>
            <p className="text-[11px] text-slate-500">Autonomous Bay Telemetry & Cloud OCR</p>
          </div>
        </div>

        {/* Center telemetry status indicator */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ESP32 HC-SR04 Active
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono">Rate: $2.50 / hr</span>
          <span className="text-slate-600">•</span>
          <span className="text-cyan-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Mock Payment
          </span>
        </div>

        {/* Right copyright */}
        <div className="text-center md:text-right text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} SmartPark IoT. Live Cloud Firestore.</p>
        </div>
      </div>
    </footer>
  );
};
