import React from 'react';
import { Search, ShoppingCart } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  itemCount: number;
  onOpenCart: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, itemCount, onOpenCart }) => {
  return (
    <div className="flex items-center gap-4 w-full md:w-auto">
      <div className="relative flex-1 md:w-64">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
        <input 
          type="text" 
          placeholder="Search products..." 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
        />
      </div>
      <button 
        onClick={onOpenCart}
        className="relative p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"
      >
        <ShoppingCart size={20} />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-zinc-700 text-white text-[10px] font-black rounded-full flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>
    </div>
  );
};
