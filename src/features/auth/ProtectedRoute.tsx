import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/types/domain';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-200 tracking-wide">
            Verifying security & role authorization...
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Synchronizing with Firebase Firestore
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, verify user's role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // If customer tries to access admin route, redirect to unauthorized
      if (user.role === 'user') {
        return <Navigate to="/unauthorized" replace />;
      }
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
