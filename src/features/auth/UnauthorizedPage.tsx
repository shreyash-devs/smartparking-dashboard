import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ShieldX, ArrowLeft, LogOut, Car } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <ShieldX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your current account role does not have authorization to view this area.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-xs text-left space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Signed in as:</span>
            <span className="text-slate-200 font-mono font-medium">{user?.email || 'Guest'}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Current Role:</span>
            <span className="uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              {user?.role || 'user'}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            to="/parking"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            <Car className="w-4 h-4" />
            <span>Go to Customer Parking Portal</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account / Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
