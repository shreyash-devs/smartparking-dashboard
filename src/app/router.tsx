import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { UnauthorizedPage } from '@/features/auth/UnauthorizedPage';
import { useAuth } from '@/features/auth/AuthContext';
import { Loader2 } from 'lucide-react';

// Admin pages
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { SlotsPage } from '@/features/slots/SlotsPage';
import { ReservationsPage } from '@/features/reservations/ReservationsPage';
import { RecognitionPage } from '@/features/recognition/RecognitionPage';
import { SessionsPage } from '@/features/sessions/SessionsPage';
import { PaymentsPage } from '@/features/payments/PaymentsPage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { DevicesPage } from '@/features/devices/DevicesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

// Customer pages & layout
import { CustomerLayout } from '@/features/customer/components/CustomerLayout';
import { CustomerHomePage } from '@/features/customer/pages/CustomerHomePage';
import { CustomerSlotsPage } from '@/features/customer/pages/CustomerSlotsPage';
import { CustomerBookingsPage } from '@/features/customer/pages/CustomerBookingsPage';
import { CustomerBookingDetailsPage } from '@/features/customer/pages/CustomerBookingDetailsPage';
import { CustomerSessionsPage } from '@/features/customer/pages/CustomerSessionsPage';
import { CustomerPaymentsPage } from '@/features/customer/pages/CustomerPaymentsPage';
import { CustomerProfilePage } from '@/features/customer/pages/CustomerProfilePage';

/**
 * Intelligent Root Redirect based on user authentication state and role
 */
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/parking" replace />;
};

export const router = createBrowserRouter([
  // Shared Authentication & Setup Routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },

  // Smart Root Redirect
  {
    path: '/',
    element: <RootRedirect />,
  },

  // Customer Parking Portal Experience (/parking/*)
  {
    path: '/parking',
    element: (
      <ProtectedRoute allowedRoles={['user', 'admin']}>
        <CustomerLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <CustomerHomePage />,
      },
      {
        path: 'slots',
        element: <CustomerSlotsPage />,
      },
      {
        path: 'bookings',
        element: <CustomerBookingsPage />,
      },
      {
        path: 'bookings/:bookingId',
        element: <CustomerBookingDetailsPage />,
      },
      {
        path: 'sessions',
        element: <CustomerSessionsPage />,
      },
      {
        path: 'payments',
        element: <CustomerPaymentsPage />,
      },
      {
        path: 'profile',
        element: <CustomerProfilePage />,
      },
    ],
  },

  // Admin Portal Experience (/admin/*)
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'slots',
        element: <SlotsPage />,
      },
      {
        path: 'reservations',
        element: <ReservationsPage />,
      },
      {
        path: 'recognition',
        element: <RecognitionPage />,
      },
      {
        path: 'sessions',
        element: <SessionsPage />,
      },
      {
        path: 'payments',
        element: <PaymentsPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'devices',
        element: <DevicesPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },

  // Preserved Legacy Admin Direct Routes (/dashboard, /slots, etc.)
  {
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/slots',
        element: <SlotsPage />,
      },
      {
        path: '/reservations',
        element: <ReservationsPage />,
      },
      {
        path: '/recognition',
        element: <RecognitionPage />,
      },
      {
        path: '/sessions',
        element: <SessionsPage />,
      },
      {
        path: '/payments',
        element: <PaymentsPage />,
      },
      {
        path: '/analytics',
        element: <AnalyticsPage />,
      },
      {
        path: '/devices',
        element: <DevicesPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <RootRedirect />,
  },
]);
