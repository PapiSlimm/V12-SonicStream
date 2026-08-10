import { cn } from '../../utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: any;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, activeTab, onChange, className }: TabsProps) => {
  return (
    <div className={cn("flex gap-4 border-b border-white/5 pb-4 overflow-x-auto no-scrollbar", className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 text-sm font-bold transition-colors whitespace-nowrap px-2 py-1 rounded-lg",
              activeTab === tab.id 
                ? "text-emerald-400 bg-emerald-400/5" 
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
          >
            {Icon && <Icon size={16} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
