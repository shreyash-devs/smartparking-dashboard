import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`} />;
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <Skeleton className="w-24 h-4 mt-2" />
      <Skeleton className="w-32 h-8" />
    </div>
  );
};
