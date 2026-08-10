import { useState } from 'react';
import { SoundwaveAnimation } from '../../components/layout/SoundwaveAnimation';
import { BookingSystem } from './BookingSystem';
import { TicketingSystem } from './TicketingSystem';
import { CalendarView } from './CalendarView';
import { ArtistEventListing } from './ArtistEventListing';
import { useArtists, useEvents } from '../../hooks/useApi';
import { cn } from '../../utils/cn';
import { SonicEvent } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { EventCreationModal } from '../events/EventCreationModal';
import { Plus } from 'lucide-react';

interface EventBookingPageProps {
  initialEvent?: SonicEvent | null;
}

export const EventBookingPage = ({ initialEvent }: EventBookingPageProps) => {
  const { user } = useAuth();
  const { data: artists = [] } = useArtists();
  const { data: events = [], refetch: refetchEvents } = useEvents();
  const [mode, setMode] = useState<'booking' | 'ticketing' | 'calendar' | 'my-shows'>(initialEvent ? 'ticketing' : 'ticketing');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Mock events for ticketing
  const mockEvents: SonicEvent[] = [
    {
      id: 'mock-1',
      artistId: 'artist-1',
      artistName: 'V12 Collective',
      title: 'Midnight Resonance',
      description: 'An immersive journey through sound and light.',
      date: '2024-05-24T20:00:00Z',
      venue: 'The Echo Chamber',
      city: 'London',
      price: 45,
      ticketsAvailable: 124,
      imageUrl: 'https://picsum.photos/seed/midnight/800/600',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mock-2',
      artistId: 'artist-2',
      artistName: 'Sonic Visionaries',
      title: 'Digital Horizon',
      description: 'Exploring the boundaries of electronic music.',
      date: '2024-06-12T21:00:00Z',
      venue: 'Sonic Garden',
      city: 'Berlin',
      price: 35,
      ticketsAvailable: 86,
      imageUrl: 'https://picsum.photos/seed/horizon/800/600',
      createdAt: new Date().toISOString()
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Artist-specific live concert background */}
      <div 
        className="fixed inset-0 z-0"
        style={{ 
          backgroundImage: `url('https://picsum.photos/seed/concert-stage/1920/1080')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/80" />
        {/* Soundwave overlay */}
        <SoundwaveAnimation />
      </div>

      {/* Booking form overlay */}
      <div className="relative z-10 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-8">
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent tracking-tighter uppercase">
              Live Experience
            </h1>
            
            <div className="flex justify-center">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 p-1 rounded-2xl flex">
                <button 
                  onClick={() => setMode('ticketing')}
                  className={cn(
                    "px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                    mode === 'ticketing' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Buy Tickets
                </button>
                <button 
                  onClick={() => setMode('calendar')}
                  className={cn(
                    "px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                    mode === 'calendar' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Calendar
                </button>
                <button 
                  onClick={() => setMode('booking')}
                  className={cn(
                    "px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                    mode === 'booking' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Book Artist
                </button>
                {user?.userType === 'artist' && (
                  <button 
                    onClick={() => setMode('my-shows')}
                    className={cn(
                      "px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                      mode === 'my-shows' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    My Shows
                  </button>
                )}
              </div>
            </div>

            {user?.userType === 'artist' && (
              <div className="flex justify-center">
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-2 hover:bg-zinc-200 shadow-xl"
                >
                  <Plus size={20} />
                  Create New Event
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-black/40 backdrop-blur-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl p-8 md:p-12">
            {mode === 'booking' ? (
              <BookingSystem artists={artists} />
            ) : mode === 'calendar' ? (
              <CalendarView events={events.length > 0 ? events : mockEvents} onSelectEvent={() => {
                setMode('ticketing');
                // In a real app, you'd pass the selected event to TicketingSystem
              }} />
            ) : mode === 'my-shows' ? (
              <ArtistEventListing />
            ) : (
              <TicketingSystem events={events.length > 0 ? events : mockEvents} initialEvent={initialEvent} />
            )}
          </div>
        </div>
      </div>

      <EventCreationModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetchEvents();
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
};
