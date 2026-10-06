import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, User, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    artistName: string;
    date: string | Date;
    venue: string;
    city: string;
    price: number;
    imageUrl?: string;
  };
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({ event, className }) => {
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link to={`/events/${event.id}`}>
      <motion.div
        whileHover={{ y: -5 }}
        className={cn(
          "group relative bg-zinc-900/40 border border-white/5 rounded-[32px] overflow-hidden hover:bg-zinc-900 transition-all hover:shadow-2xl hover:shadow-emerald-500/5",
          className
        )}
      >
      <div className="aspect-[16/9] relative overflow-hidden">
        <img
          src={event.imageUrl || `https://picsum.photos/seed/${event.id}/800/450`}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5">
          <Calendar size={12} className="text-emerald-400" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {formattedDate}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white tracking-tight truncate">{event.title}</h3>
          <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
            <User size={14} className="text-emerald-500" />
            <span>{event.artistName}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <MapPin size={14} />
            <span>{event.venue}, {event.city}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="text-lg font-black text-white">
            ${event.price}
          </div>
          <button className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
            <Ticket size={14} />
            Get Tickets
          </button>
        </div>
      </div>
    </motion.div>
    </Link>
  );
};
