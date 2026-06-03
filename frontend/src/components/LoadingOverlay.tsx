import React from 'react';

export const LoadingOverlay: React.FC<{ small?: boolean }> = ({ small = false }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`flex items-center gap-3 ${small ? 'p-2' : 'p-4'} rounded-xl bg-black/30`}>
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <span className="text-sm text-white">Loading{small ? '…' : ' please wait…'}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
