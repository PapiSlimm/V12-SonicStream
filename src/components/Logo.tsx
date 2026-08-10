import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeMap = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-20',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/brand/v12-logo.png"
        alt="V12 Multimedia — Urban Visions Enterprises"
        className={`${sizeMap[size]} w-auto drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]`}
      />
      <div className="flex flex-col">
        <span className="font-bold tracking-tighter text-white leading-none">V12</span>
        <span className="text-[10px] font-medium tracking-[0.2em] text-v12-gray-400 leading-none uppercase">Multimedia</span>
      </div>
    </div>
  );
}
