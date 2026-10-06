import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "flex h-12 w-full rounded-xl border border-white/5 bg-black/40 px-4 py-2 text-sm font-bold text-white ring-offset-black file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            error && "border-red-500/50 focus-visible:ring-red-500/20 focus-visible:border-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[10px] font-bold text-red-500 mt-1 ml-1 uppercase">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
