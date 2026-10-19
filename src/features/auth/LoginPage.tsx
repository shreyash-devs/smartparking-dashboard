import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  CircleParking,
  Mail,
  Lock,
  ArrowRight,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginAsDemo, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'user') => {
    loginAsDemo(role);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Left Hero / Brand Visual Section */}
      <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-r border-slate-800/80 relative overflow-hidden">
        {/* Subtle background ambient light */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
              <CircleParking className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-white text-xl tracking-tight font-heading">
                SmartPark <span className="text-cyan-400">IoT</span>
              </span>
              <p className="text-xs text-slate-400 font-mono">Telemetry & Vision Platform</p>
            </div>
          </div>

          <div className="mt-16 md:mt-24 space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              ESP32 & Ultrasonic HC-SR04 Powered
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-heading leading-tight">
              Intelligent Parking, Telemetry & Vision.
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Real-time ultrasonic bay detection, automated Plate Recognizer OCR gate release, live Firestore subscriptions, and FastAPI business logic.
            </p>
          </div>
        </div>

        {/* Feature bullets */}
        <div className="relative z-10 mt-12 grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>HC-SR04 Telemetry</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ESP32-CAM License OCR</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Firebase Authentication</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>FastAPI Cashier API</span>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="md:w-1/2 p-6 md:p-12 lg:p-16 flex items-center justify-center bg-white text-slate-900">
        <div className="max-w-md w-full space-y-6">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
              Operator Sign In
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Enter your credentials or use quick-demo access to open the dashboard.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@smartparking.iot"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In with Firebase'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                Or explore in Demo Mode
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-800 font-semibold text-xs transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Instant Demo: Station Admin</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('user')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-400" />
                <span>Instant Demo: Driver Alex</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Connected to Firebase project <code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">smartparking-d5ee3</code>
          </p>
        </div>
      </div>
    </div>
  );
};
