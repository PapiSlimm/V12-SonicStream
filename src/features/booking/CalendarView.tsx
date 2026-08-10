import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Search
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval 
} from 'date-fns';
import { SonicEvent } from '../../types';
import { cn } from '../../utils/cn';

interface CalendarViewProps {
  events: SonicEvent[];
  onSelectEvent: (event: SonicEvent) => void;
}

export const CalendarView = ({ events, onSelectEvent }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const eventsOnSelectedDate = events.filter(event => 
    isSameDay(new Date(event.date), selectedDate)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-black uppercase tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
              {events.filter(e => isSameMonth(new Date(e.date), currentMonth)).length} Events this month
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={prevMonth}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextMonth}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-zinc-900 p-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {day}
            </div>
          ))}
          {calendarDays.map((day, i) => {
            const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "bg-zinc-900 min-h-[100px] p-4 text-left transition-all hover:bg-zinc-800 relative group",
                  !isCurrentMonth && "opacity-20",
                  isSelected && "bg-zinc-800 ring-2 ring-inset ring-emerald-500/50"
                )}
              >
                <span className={cn(
                  "text-sm font-bold",
                  isSelected ? "text-emerald-400" : "text-zinc-400"
                )}>
                  {format(day, 'd')}
                </span>
                
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div 
                      key={event.id}
                      className="text-[9px] font-bold uppercase tracking-tighter bg-emerald-500/10 text-emerald-400 p-1 rounded border border-emerald-500/20 truncate"
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[8px] font-black text-zinc-600 uppercase">
                      + {dayEvents.length - 2} more
                    </div>
                  )}
                </div>

                {dayEvents.length > 0 && (
                  <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Details */}
      <div className="space-y-6">
        <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-8">
          <div className="space-y-2">
            <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Schedule for</h4>
            <h3 className="text-3xl font-black uppercase tracking-tight">
              {format(selectedDate, 'EEE, MMM d')}
            </h3>
          </div>

          <div className="space-y-4">
            {eventsOnSelectedDate.length > 0 ? (
              eventsOnSelectedDate.map(event => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4 cursor-pointer hover:bg-white/10 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h5 className="font-bold text-lg group-hover:text-emerald-400 transition-colors">{event.title}</h5>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{event.artistName}</p>
                    </div>
                    <div className="text-emerald-400 font-mono text-xs">${event.price}</div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-emerald-500" />
                      {format(new Date(event.date), 'p')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-emerald-500" />
                      {event.venue}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <CalendarIcon className="text-zinc-700" size={24} />
                </div>
                <p className="text-zinc-500 text-sm font-medium">No events scheduled for this day.</p>
                <button className="text-xs font-black uppercase tracking-widest text-emerald-400 hover:underline">
                  Browse All Events
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Search */}
        <div className="bg-zinc-700 rounded-[40px] p-8 space-y-6 text-white">
          <h4 className="text-xl font-black uppercase tracking-tight leading-none">Find your next live experience</h4>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
            <input 
              type="text" 
              placeholder="Search by artist or city..."
              className="w-full bg-white/20 border border-black/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder:text-black/40 outline-none focus:bg-white/30 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
