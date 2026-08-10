import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-white/5 border border-white/10", className)} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-v12-gray-900 p-8 space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export function MarketingSkeleton() {
  return (
    <div className="min-h-screen bg-v12-gray-900">
      <div className="h-20 border-b border-white/10 flex items-center px-8 justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-8">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto py-24 px-8 space-y-12">
        <Skeleton className="h-24 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <Skeleton className="h-16 w-48 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-24">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
