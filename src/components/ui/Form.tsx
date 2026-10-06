import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, containerClassName, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && <label className="text-sm font-bold text-zinc-400">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  options: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, containerClassName, className, options, ...props }, ref) => {
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && <label className="text-sm font-bold text-zinc-400">{label}</label>}
        <select
          ref={ref}
          className={cn(
            "w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none",
            error && "border-red-500 focus:border-red-500",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, containerClassName, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && <label className="text-sm font-bold text-zinc-400">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[100px]",
            error && "border-red-500 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
