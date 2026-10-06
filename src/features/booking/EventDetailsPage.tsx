import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Zap, 
  Info, 
  Share2, 
  Heart,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SonicEvent } from '../../types';
import { Link, useNavigate } from 'react-router-dom';

interface EventDetailsPageProps {
  event: SonicEvent;
}

export const EventDetailsPage: React.FC<EventDetailsPageProps> = ({ event }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <img 
          src={event.imageUrl || `https://picsum.photos/seed/${event.id}/1920/1080`} 
          alt={event.title}
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              <span>Back to Events</span>
            </button>
            
            <div className="space-y-2">
              <p className="text-emerald-400 font-black uppercase tracking-[0.2em] text-sm">
                Live Experience • {event.artistName}
              </p>
              <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                {event.title}
              </h1>
            </div>

            <div className="flex flex-wrap gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Calendar className="text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Date</p>
                  <p className="font-bold">{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Clock className="text-purple-400" size={24} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Time</p>
                  <p className="font-bold">{event.time || '20:00'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <MapPin className="text-blue-400" size={24} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Venue</p>
                  <p className="font-bold">{event.venue}, {event.city}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-16 grid lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-tight">About the Event</h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              {event.description}
            </p>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Join us for an unforgettable night of music and visual artistry. This exclusive performance by {event.artistName} pushes the boundaries of live sound, featuring state-of-the-art production and immersive acoustics.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-tight">Location</h2>
            <div className="aspect-video bg-zinc-900 rounded-[32px] overflow-hidden border border-white/5 relative group">
              {/* Mock Map View */}
              <div 
                className="absolute inset-0 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700"
                style={{ 
                  backgroundImage: `url('https://picsum.photos/seed/map-${event.city}/1200/800')`,
                  backgroundSize: 'cover'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute -inset-4 bg-emerald-500/20 rounded-full animate-ping" />
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50 relative">
                    <MapPin className="text-black" size={24} />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 p-6 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 flex justify-between items-center">
                <div>
                  <p className="font-bold">{event.venue}</p>
                  <p className="text-xs text-zinc-400">{event.city}</p>
                </div>
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all">
                  Get Directions
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Ticket Information Card */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-8 space-y-8 sticky top-24">
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight">Ticket Information</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <Users size={14} className="text-purple-500" />
                <span>{event.ticketsAvailable} Tickets Remaining</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">General Admission</span>
                  <span className="text-2xl font-black text-emerald-400">${event.price}</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Includes full access to the main floor and standard amenities.
                </p>
              </div>
              <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs">VIP SonicPass</span>
                  <span className="text-2xl font-black text-white">${(event.price * 2.5).toFixed(0)}</span>
                </div>
                <p className="text-xs text-emerald-400/60 leading-relaxed">
                  Includes backstage access, priority entry, and exclusive merchandise.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button className="w-full h-16 bg-zinc-700 text-white rounded-2xl font-black text-lg hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3">
                <Zap size={20} fill="currentColor" />
                Buy Tickets
              </button>
              <Link 
                to="/booking" 
                className="w-full h-16 bg-white/5 text-white rounded-2xl font-black text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3 border border-white/5"
              >
                Book Artist
              </Link>
            </div>

            <div className="flex justify-center gap-6 pt-4 border-t border-white/5">
              <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors">
                <Share2 size={16} />
                <span>Share</span>
              </button>
              <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-red-500 transition-colors">
                <Heart size={16} />
                <span>Save</span>
              </button>
              <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors">
                <Info size={16} />
                <span>Policy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
