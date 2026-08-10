import { cn } from '../../utils/cn';

interface ContentRatingFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const CONTENT_RATINGS = [
  { value: 'G', label: 'G - General Audience', description: 'Suitable for all ages', color: 'emerald' },
  { value: 'PG', label: 'PG - Parental Guidance', description: 'May contain mild content', color: 'yellow' },
  { value: 'PG13', label: 'PG-13', description: 'Parents strongly cautioned', color: 'orange' },
  { value: 'R', label: 'R - Restricted', description: '17+ unless accompanied by adult', color: 'red' },
  { value: 'NC17', label: 'NC-17', description: 'No one 17 and under admitted', color: 'rose' }
];

export const ContentRatingField = ({ value, onChange, className = '' }: ContentRatingFieldProps) => (
  <div className={cn("space-y-3", className)}>
    <label className="block text-sm font-bold uppercase tracking-wider text-zinc-300">
      Content Rating <span className="text-red-400">*</span>
    </label>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {CONTENT_RATINGS.map((rating) => (
        <label
          key={rating.value}
          className={cn(
            "group relative p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 h-full",
            value === rating.value
              ? `border-${rating.color}-400 bg-${rating.color}-500/10 shadow-lg shadow-${rating.color}-500/25`
              : "border-white/10 hover:border-white/30 hover:bg-white/5"
          )}
        >
          <input
            type="radio"
            name="content_rating"
            value={rating.value}
            checked={value === rating.value}
            onChange={() => onChange(rating.value)}
            className="sr-only"
          />
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mt-0.5 flex-shrink-0",
              value === rating.value ? `bg-${rating.color}-400 text-black shadow-lg` : "bg-zinc-800 text-zinc-400"
            )}>
              {rating.value}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn("font-bold text-sm leading-tight", value === rating.value ? "text-white" : "text-zinc-300")}>{rating.label}</div>
              <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                {rating.description}
              </div>
            </div>
          </div>
        </label>
      ))}
    </div>
    
    <div className="text-xs text-zinc-500 p-3 bg-zinc-900/50 rounded-xl border border-zinc-700">
      <strong>Impact:</strong> Determines age gates on Spotify/Vevo and other digital stores. 
      <strong>R</strong> = 17+ only. <strong>NC-17</strong> blocks minors completely.
    </div>
  </div>
);
