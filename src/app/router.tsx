import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { SlotsPage } from '@/features/slots/SlotsPage';
import { ReservationsPage } from '@/features/reservations/ReservationsPage';
import { RecognitionPage } from '@/features/recognition/RecognitionPage';
import { SessionsPage } from '@/features/sessions/SessionsPage';
import { PaymentsPage } from '@/features/payments/PaymentsPage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { DevicesPage } from '@/features/devices/DevicesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
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
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
