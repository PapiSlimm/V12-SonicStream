import { cn } from '../../utils/cn';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: LucideIcon;
  color?: 'emerald' | 'blue';
}

export const StatCard = ({ label, value, trend, icon: Icon, color = "emerald" }: StatCardProps) => (
  <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2 rounded-lg", color === "emerald" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400")}>
        <Icon size={20} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  </div>
);
