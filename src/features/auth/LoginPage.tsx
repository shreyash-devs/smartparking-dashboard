import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  CircleParking,
  Mail,
  Lock,
  User,
  Car,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [defaultPlate, setDefaultPlate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read URL query params or path for initial mode
  useEffect(() => {
    if (location.pathname === '/register' || location.search.includes('register')) {
      setMode('register');
    }
  }, [location]);

  // If already logged in, redirect to correct role destination
  useEffect(() => {
    if (user) {
      const fromPath = (location.state as any)?.from?.pathname;
      if (fromPath && fromPath !== '/login' && fromPath !== '/register') {
        navigate(fromPath, { replace: true });
      } else {
        if (user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/parking', { replace: true });
        }
      }
    }
  }, [user, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (mode === 'register' && !displayName.trim()) {
      setErrorMessage('Please enter your full name for registration.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        const profile = await login(email, password);
        if (profile.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/parking', { replace: true });
        }
      } else {
        await register(
          email,
          password,
          displayName.trim(),
          defaultPlate.trim().toUpperCase()
        );
        navigate('/parking', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Left Hero / Brand Visual Section */}
      <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-r border-slate-800/80 relative overflow-hidden">
        {/* Ambient lighting */}
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

          <div className="mt-12 md:mt-24 space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              ESP32 & Ultrasonic HC-SR04 Powered
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-heading leading-tight">
              Intelligent Parking, Telemetry & Vision.
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Real-time ultrasonic bay detection, automated Plate Recognizer OCR gate release, live Firestore subscriptions, and secure role-based access.
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
            <span>Role-Based Authentication</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Live Firestore Realtime</span>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="md:w-1/2 p-6 md:p-12 lg:p-16 flex items-center justify-center bg-white text-slate-900">
        <div className="max-w-md w-full space-y-6">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
              {mode === 'signin' ? 'Sign In to Your Account' : 'Create Customer Account'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'signin'
                ? 'Enter your Firebase email and password to access your role dashboard.'
                : 'Register as a parking customer to book slots and pay parking bills.'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Customer Registration
            </button>
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
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Vehicle License Plate <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={defaultPlate}
                      onChange={e => setDefaultPlate(e.target.value.toUpperCase())}
                      placeholder="e.g. MH12AB1234"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 transition-all uppercase placeholder:normal-case placeholder:text-slate-400 font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
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
                  required
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
              <span>
                {isSubmitting
                  ? 'Authenticating...'
                  : mode === 'signin'
                  ? 'Sign In with Firebase'
                  : 'Register Customer Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign-ins are securely validated against Firebase Authentication and Firestore role permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
