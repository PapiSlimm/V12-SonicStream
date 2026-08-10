import React from 'react';
import { cn } from '../../utils/cn';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export const SectionCard = ({ title, subtitle, children, className, headerActions }: SectionCardProps) => {
  return (
    <div className={cn("bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden", className)}>
      {title && (
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className="p-8">
        {children}
      </div>
    </div>
  );
};
