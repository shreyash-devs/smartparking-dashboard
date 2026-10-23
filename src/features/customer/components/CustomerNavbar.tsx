import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import {
  CircleParking,
  Compass,
  CalendarCheck2,
  CarFront,
  CreditCard,
  User,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Radio,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface CustomerNavbarProps {
  availableSlotsCount?: number;
  totalSlotsCount?: number;
}

export const CustomerNavbar: React.FC<CustomerNavbarProps> = ({
  availableSlotsCount = 3,
  totalSlotsCount = 4,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/parking', icon: Compass },
    { name: 'Find Parking', path: '/parking/slots', icon: CircleParking },
    { name: 'My Bookings', path: '/parking/bookings', icon: CalendarCheck2 },
    { name: 'Sessions', path: '/parking/sessions', icon: CarFront },
    { name: 'Payments', path: '/parking/payments', icon: CreditCard },
    { name: 'Profile', path: '/parking/profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/parking" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <CircleParking className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <span className="font-bold text-white text-base tracking-tight font-heading flex items-center gap-1.5">
                  SmartPark <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-semibold border border-cyan-500/30">PORTAL</span>
                </span>
                <p className="text-[10px] text-slate-400 font-mono">Driver & Reservation Hub</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/parking'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Live Availability Pill */}
            <Link
              to="/parking/slots"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs text-slate-200 hover:border-emerald-500/50 transition-colors"
              title="Click to browse available slots"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">
                <span className="text-emerald-400 font-bold">{availableSlotsCount}</span>
                /{totalSlotsCount} Available
              </span>
            </Link>

            {/* Admin Switcher (Only visible to admin) */}
            {user?.isAdmin && (
              <Link
                to="/admin/dashboard"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/25 text-xs font-medium transition-all"
                title="Switch to Station Admin View"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Admin View</span>
              </Link>
            )}

            {/* User Account Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {user?.displayName ? user.displayName.slice(0, 2) : 'CU'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">
                    {user?.displayName || 'Customer'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono capitalize">
                    {user?.role || 'user'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl py-2 z-50 text-xs divide-y divide-slate-800">
                    <div className="px-4 py-2.5">
                      <p className="font-semibold text-white truncate">
                        {user?.displayName || 'Customer'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">
                        {user?.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                        Verified Customer
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/parking/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Account Profile</span>
                      </Link>
                      <Link
                        to="/parking/bookings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80"
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>My Reservations</span>
                      </Link>
                      <Link
                        to="/parking/payments"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>Payment History & Bills</span>
                      </Link>
                      {user?.isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-950/40 font-medium"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Switch to Admin Station</span>
                        </Link>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-1">
          {navLinks.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/parking'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}

          {user?.isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-cyan-300 bg-indigo-950/40 border border-indigo-500/30"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Switch to Admin Station</span>
            </Link>
          )}

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
