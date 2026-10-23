import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerNavbar } from './CustomerNavbar';
import { CustomerFooter } from './CustomerFooter';
import { slotsService } from '@/services/slots.service';
import type { ParkingSlot } from '@/types/domain';

export const CustomerLayout: React.FC = () => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);

  useEffect(() => {
    // Subscribe to live slots for real-time header count
    const unsubscribe = slotsService.subscribeToLiveSlots(updatedSlots => {
      setSlots(updatedSlots);
    });

    return () => unsubscribe();
  }, []);

  const totalSlotsCount = slots.length || 4;
  const availableSlotsCount = slots.filter(s => s.status === 'AVAILABLE').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <CustomerNavbar
        availableSlotsCount={availableSlotsCount}
        totalSlotsCount={totalSlotsCount}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Outlet />
      </main>
      <CustomerFooter />
    </div>
  );
};
