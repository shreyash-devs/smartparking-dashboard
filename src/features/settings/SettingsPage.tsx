import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/components/feedback/ToastContext';
import {
  Settings,
  User,
  ShieldCheck,
  Server,
  Database,
  Sliders,
  LogOut,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { success, info } = useToast();

  const [currency, setCurrency] = useState('EUR');
  const [telemetryFrequency, setTelemetryFrequency] = useState('5s');
  const [distanceThreshold, setDistanceThreshold] = useState('30');

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    success('Settings Saved', 'Operator preferences updated successfully.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <h2 className="text-xl font-bold font-heading text-slate-900">
          Operator & System Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage operator authentication, API integration endpoints, and telemetry parameters.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg font-mono">
            {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'OP'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{user?.displayName || 'Station Operator'}</span>
              {user?.isAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                  <ShieldCheck className="w-3 h-3 text-cyan-600" />
                  Admin
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">{user?.email || 'driver@smartpark.iot'}</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>

      {/* Backend & Firebase Connectivity Specifications */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Server className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Live Service Integrations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">FastAPI Backend</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            </div>
            <p className="font-mono text-slate-500 text-[11px]">
              {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Cloud Firestore</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Registered
              </span>
            </div>
            <p className="font-mono text-slate-500 text-[11px]">
              Project: {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'smartparking-d5ee3'}
            </p>
          </div>
        </div>
      </div>

      {/* Hardware Threshold Preferences */}
      <form onSubmit={handleSavePreferences} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Hardware Sensor Parameters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Currency Format
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Telemetry Polling Frequency
            </label>
            <select
              value={telemetryFrequency}
              onChange={e => setTelemetryFrequency(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="3s">High (3 seconds)</option>
              <option value="5s">Standard (5 seconds)</option>
              <option value="15s">Low Bandwidth (15s)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              HC-SR04 Occupied Threshold
            </label>
            <div className="relative">
              <input
                type="number"
                value={distanceThreshold}
                onChange={e => setDistanceThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                cm
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
