import { useParams, Link } from 'react-router-dom';
import { Meta } from '../../components/SEO/Meta';
import { EventSchema } from '../../components/SEO/JsonLd';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, Clock, Info, User } from 'lucide-react';
import { ShareButtons } from '../../components/social/ShareButtons';

export const EventSEOPage = () => {
  const { id } = useParams();

  // In a real app, fetch event data by id
  const event = {
    title: 'Sonic Summer Fest 2026',
    artistName: 'V12 Collective',
    artistSlug: 'v12-collective',
    description: `Buy tickets for Sonic Summer Fest 2026 at The Grand Arena. Experience the future of sound with V12 Collective.`,
    date: '2026-07-15',
    time: '18:00',
    venue: 'The Grand Arena',
    city: 'Los Angeles',
    address: '123 Music Way, Los Angeles, CA 90001',
    price: 85,
    image: `https://picsum.photos/seed/${id}/1920/1080`,
    url: `https://sonicstream.com/events/${id}`
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Meta 
        title={`${event.title} Tickets | ${event.city}`}
        description={event.description}
        image={event.image}
        url={event.url}
        type="event"
      />
      
      <EventSchema 
        name={event.title}
        startDate={`${event.date}T${event.time}`}
        locationName={event.venue}
        locationAddress={event.address}
        description={event.description}
        image={event.image}
        url={event.url}
        offers={{
          url: event.url,
          price: event.price,
          currency: 'USD'
        }}
      />

      <div className="relative h-[60vh] overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-zinc-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                Live Event
              </span>
            </div>
            <h1 className="text-7xl font-black tracking-tighter uppercase leading-none">{event.title}</h1>
            <Link 
              to={`/artists/${event.artistSlug}`}
              className="flex items-center gap-3 text-2xl font-bold text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              <User size={24} />
              {event.artistName}
            </Link>
            <div className="flex flex-wrap items-center gap-8 text-zinc-300">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-emerald-400" />
                <span className="font-bold">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-emerald-400" />
                <span className="font-bold">{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-emerald-400" />
                <span className="font-bold">{event.venue}, {event.city}</span>
              </div>
              <ShareButtons url={event.url} title={`Join me at ${event.title} on SonicStream!`} />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-12 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <h2 className="text-3xl font-black uppercase flex items-center gap-3">
              <Info className="text-emerald-400" />
              About the Event
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">{event.description}</p>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 sticky top-24">
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tickets from</p>
                <p className="text-4xl font-black text-white">${event.price}</p>
              </div>
              <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl shadow-black/20 transition-all">
                <Ticket size={20} />
                Get Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
