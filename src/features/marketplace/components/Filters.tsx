import React from 'react';
import { cn } from '../../../utils/cn';

type FilterType = 'all' | 'digital_download' | 'webinar' | 'membership' | 'physical_good' | 'ticket';

interface FiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const Filters: React.FC<FiltersProps> = ({ activeFilter, onFilterChange }) => {
  const filters: FilterType[] = ['all', 'digital_download', 'webinar', 'membership', 'physical_good', 'ticket'];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((t) => (
        <button
          key={t}
          onClick={() => onFilterChange(t)}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeFilter === t ? "bg-zinc-700 text-white" : "bg-white/5 text-zinc-500 hover:bg-white/10"
          )}
        >
          {t.replace('_', ' ')}
        </button>
      ))}
    </div>
  );
};
