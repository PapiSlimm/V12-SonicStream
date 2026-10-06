import { useState, useEffect } from 'react';
import { Search, Filter, Calendar as CalendarIcon, TrendingUp, Music2 } from 'lucide-react';
import { EventCard } from './EventCard';
import { BookingPlatformHub } from '../booking/BookingPlatformHub';

export const EventListingPage = () => {
  const [mainView, setMainView] = useState<'marketplace' | 'concerts'>('marketplace');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    genre: 'all',
    popularity: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    // Mock fetching events
    const fetchEvents = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setEvents([
        { id: '1', title: 'Sonic Summer Fest', artistName: 'V12 Collective', date: '2026-07-15', venue: 'The Grand Arena', city: 'Los Angeles', price: 85, genre: 'Electronic', popularity: 95 },
        { id: '2', title: 'Underground Beats', artistName: 'DJ Shadow', date: '2026-05-20', venue: 'Warehouse 9', city: 'Berlin', price: 45, genre: 'Techno', popularity: 80 },
        { id: '3', title: 'Acoustic Nights', artistName: 'Luna Ray', date: '2026-06-10', venue: 'The Jazz Room', city: 'New York', price: 30, genre: 'Acoustic', popularity: 70 },
        { id: '4', title: 'Metal Mayhem', artistName: 'Iron Pulse', date: '2026-08-05', venue: 'Rock Stadium', city: 'London', price: 65, genre: 'Metal', popularity: 88 },
      ]);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    // Genre Filter
    if (filters.genre !== 'all' && event.genre !== filters.genre) return false;

    // Popularity Filter
    if (filters.popularity !== 'all') {
      if (filters.popularity === 'high' && event.popularity < 90) return false;
      if (filters.popularity === 'medium' && (event.popularity < 75 || event.popularity >= 90)) return false;
    }

    // Date Range Filter
    if (filters.dateRange !== 'all') {
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filters.dateRange === 'today') {
        const isToday = eventDate.toDateString() === today.toDateString();
        if (!isToday) return false;
      }

      if (filters.dateRange === 'this-week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        if (eventDate < today || eventDate > nextWeek) return false;
      }

      if (filters.dateRange === 'this-month') {
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        if (eventDate < today || eventDate > nextMonth) return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12 px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Core Multi-View Switcher Controls */}
        <div className="flex bg-zinc-900/60 p-2 rounded-2xl border border-white/5 w-fit">
          <button 
            onClick={() => setMainView('marketplace')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              mainView === 'marketplace' ? 'bg-zinc-700 text-white shadow-lg shadow-black/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Gig & Booking Marketplace
          </button>
          <button 
            onClick={() => setMainView('concerts')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              mainView === 'concerts' ? 'bg-zinc-700 text-white shadow-lg shadow-black/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Explore Public Concerts
          </button>
        </div>

        {mainView === 'marketplace' ? (
          <BookingPlatformHub />
        ) : (
          <div className="space-y-12 animate-fade-in">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-6xl font-black tracking-tighter uppercase">Live Events</h1>
              <p className="text-zinc-500 text-lg max-w-2xl">Discover the best live music experiences across the globe. Filter by your favorite genres and find your next show.</p>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-zinc-900/50 p-4 rounded-[32px] border border-white/5">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search events, artists, cities..." 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={16} className="text-zinc-500" />
                <select 
                  value={filters.genre}
                  onChange={(e) => setFilters({...filters, genre: e.target.value})}
                  className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none"
                >
                  <option value="all">All Genres</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Techno">Techno</option>
                  <option value="Acoustic">Acoustic</option>
                  <option value="Metal">Metal</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-zinc-500" />
                <select 
                  value={filters.popularity}
                  onChange={(e) => setFilters({...filters, popularity: e.target.value})}
                  className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none"
                >
                  <option value="all">Any Popularity</option>
                  <option value="high">High Demand</option>
                  <option value="medium">Trending</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-zinc-500" />
                <select 
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                  className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                </select>
              </div>
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-96 bg-zinc-900/50 rounded-[32px] animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            {filteredEvents.length === 0 && !loading && (
              <div className="text-center py-32 space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-zinc-700">
                  <Music2 size={40} />
                </div>
                <p className="text-zinc-500 font-medium">No events found matching your criteria.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
