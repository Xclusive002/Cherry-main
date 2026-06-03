import React from 'react';

export const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-secondary/50 rounded-lg h-48 animate-pulse"
      />
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="bg-secondary/50 rounded-lg aspect-video animate-pulse" />
        <div className="bg-secondary/50 rounded h-4 w-3/4 animate-pulse" />
        <div className="bg-secondary/50 rounded h-3 w-1/2 animate-pulse" />
      </div>
    ))}
  </div>
);
