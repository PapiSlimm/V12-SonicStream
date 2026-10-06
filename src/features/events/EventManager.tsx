import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Ticket, 
  Users, 
  Plus, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Activity,
  DollarSign,
  LayoutDashboard,
  Building2,
  CalendarDays,
  Check,
  Search as SearchIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import { TicketManager } from './TicketManager';
import { api } from '../../api';
import { Venue, SonicEvent } from '../../types';
import { toast } from 'react-hot-toast';

type View = 'dashboard' | 'calendar' | 'venues' | 'tickets';

export const EventManager: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<SonicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVenue, setNewVenue] = useState<Partial<Venue>>({ isVerified: false });
  const [newEvent, setNewEvent] = useState<Partial<SonicEvent>>({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    city: '',
    price: 0,
    ticketsAvailable: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [venuesData, eventsData] = await Promise.all([
        api.venues.getAll(),
        api.events.getMyEvents()
      ]);
      setVenues(venuesData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching event data:', error);
      toast.error('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    // For now, status is derived or simplified
    const matchesStatus = statusFilter === 'All' || (event.ticketsAvailable > 0 ? 'On Sale' : 'Sold Out') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddVenue = async () => {
    if (newVenue.name && newVenue.address) {
      try {
        await api.venues.create(newVenue);
        toast.success('Venue registered successfully!');
        setIsVenueModalOpen(false);
        setNewVenue({ isVerified: false });
        fetchData();
      } catch (error) {
        console.error('Error adding venue:', error);
        toast.error('Failed to register venue');
      }
    }
  };

  const handleCreateEvent = async () => {
    if (newEvent.title && newEvent.date && newEvent.venue) {
      try {
        await api.events.create(newEvent);
        toast.success('Event created successfully!');
        setIsCreateEventModalOpen(false);
        setNewEvent({
          title: '',
          description: '',
          date: '',
          time: '',
          venue: '',
          city: '',
          price: 0,
          ticketsAvailable: 0
        });
        fetchData();
      } catch (error) {
        console.error('Error creating event:', error);
        toast.error('Failed to create event');
      }
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  return (
    <div className="space-y-12 pb-24 font-sans">
      {/* Header - Oversized Typographic Style */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b-4 border-emerald-500 pb-16">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-700 text-white text-[12px] font-black uppercase tracking-widest">
            <CalendarIcon size={14} />
            Event Logistics v4.2
          </div>
          <h2 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85]">
            Event <span className="text-emerald-500 italic">Manager</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl text-xl font-medium leading-relaxed">
            End-to-end event orchestration. From venue scouting to ticket fulfillment.
          </p>
        </div>

        <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'calendar', label: 'Calendar', icon: CalendarDays },
            { id: 'venues', label: 'Venues', icon: Building2 },
            { id: 'tickets', label: 'Tickets', icon: Ticket }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveView(tab.id as View)}
              className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeView === tab.id ? "bg-zinc-700 text-white shadow-lg shadow-black/20" : "text-zinc-500 hover:text-white"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeView === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-white/10 rounded-[40px] overflow-hidden divide-x divide-y md:divide-y-0 divide-white/10">
              {[
                { label: 'Total Revenue', value: '$990,200', trend: '+15.4%', icon: DollarSign, color: 'text-emerald-400' },
                { label: 'Tickets Sold', value: '14,700', trend: '+8.2%', icon: Ticket, color: 'text-blue-400' },
                { label: 'Active Events', value: events.length.toString(), trend: '+2', icon: Activity, color: 'text-purple-400' },
                { label: 'Capacity Utilization', value: '84.2%', trend: '+3.1%', icon: Zap, color: 'text-orange-400' },
              ].map((stat) => (
                <div key={stat.label} className="p-10 space-y-6 group hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className={cn("w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5", stat.color)}>
                      <stat.icon size={20} />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-black/40 border border-white/5",
                      stat.trend.startsWith('+') ? "text-emerald-400" : "text-red-400"
                    )}>
                      {stat.trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {stat.trend}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">{stat.label}</p>
                    <p className="text-4xl font-black tracking-tight font-mono">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming Events - Oversized Typographic Style */}
            <div className="space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <h3 className="text-4xl font-black uppercase tracking-tight">Upcoming <span className="text-emerald-500">Logistics</span></h3>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                    <input 
                      type="text"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-zinc-900 border-2 border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm outline-none focus:border-emerald-500 transition-all w-full md:w-64"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-zinc-900 border-2 border-white/5 rounded-2xl px-6 py-4 text-sm outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer pr-12"
                  >
                    <option value="All">All Status</option>
                    <option value="On Sale">On Sale</option>
                    <option value="Sold Out">Sold Out</option>
                  </select>
                  <button 
                    onClick={() => setIsCreateEventModalOpen(true)}
                    className="px-8 py-4 bg-zinc-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-600 shadow-xl shadow-black/20 transition-all flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Create Event
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-32 bg-zinc-900/50 rounded-[40px] animate-pulse border-2 border-white/5" />
                    ))}
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="bg-zinc-900/30 border-2 border-dashed border-white/5 rounded-[40px] p-20 text-center">
                    <p className="text-zinc-500 font-black uppercase tracking-widest italic">No events match your criteria</p>
                  </div>
                ) : (
                  filteredEvents.map((event, i) => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative bg-zinc-900/50 border-2 border-white/5 hover:border-emerald-500/50 rounded-[40px] p-10 flex flex-col md:flex-row md:items-center gap-12 overflow-hidden"
                    >
                      {/* Oversized Number - Recipe 9 */}
                      <div className="absolute -top-10 -left-6 text-9xl font-black text-white/[0.03] pointer-events-none select-none italic">
                        {event.date.split('-')[2]}
                      </div>

                      <div className="relative z-10 flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {event.ticketsAvailable > 0 ? 'On Sale' : 'Sold Out'}
                          </span>
                          <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                            {format(new Date(event.date), 'MMMM yyyy')}
                          </span>
                        </div>
                        <h4 className="text-4xl font-black uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{event.title}</h4>
                        <div className="flex items-center gap-6 text-zinc-400">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-emerald-500" />
                            <span className="text-sm font-medium">{event.venue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-emerald-500" />
                            <span className="text-sm font-medium">{event.ticketsAvailable} Tickets Available</span>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 flex flex-col items-end gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">Ticket Price</p>
                          <p className="text-3xl font-black font-mono text-emerald-400">${event.price.toLocaleString()}</p>
                        </div>
                        <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                          <ChevronRight size={24} className="text-zinc-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'calendar' && (
          <motion.div 
            key="calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-zinc-900/50 border-2 border-white/5 rounded-[40px] p-12"
          >
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-4xl font-black uppercase tracking-tight">Public <span className="text-emerald-500 italic">Calendar</span></h3>
              <div className="flex gap-4">
                <button className="px-6 py-2 bg-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">Previous</button>
                <button className="px-6 py-2 bg-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">Next</button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">{day}</div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const day = i - 3; // Mock offset
                const dateStr = `2026-03-${day < 10 ? '0' + day : day}`;
                const dayEvents = events.filter(e => e.date === dateStr);
                
                return (
                  <div key={i} className={cn(
                    "aspect-square border border-white/5 rounded-2xl p-4 space-y-2 transition-all hover:border-emerald-500/30",
                    day < 1 || day > 31 ? "opacity-20" : "bg-black/20"
                  )}>
                    <span className="text-xs font-black text-zinc-500">{day > 0 && day <= 31 ? day : ''}</span>
                    <div className="space-y-1">
                      {dayEvents.map(e => (
                        <div key={e.id} className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <p className="text-[8px] font-black uppercase truncate text-emerald-400">{e.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeView === 'venues' && (
          <motion.div 
            key="venues"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-4xl font-black uppercase tracking-tight">Venue <span className="text-emerald-500">Catalog</span></h3>
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic font-serif">Authorized performance spaces and technical specs</p>
              </div>
              <button 
                onClick={() => setIsVenueModalOpen(true)}
                className="px-8 py-4 bg-zinc-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-600 shadow-xl shadow-black/20 transition-all flex items-center gap-2"
              >
                <Plus size={16} />
                Register Venue
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-zinc-900/50 rounded-[40px] animate-pulse border-2 border-white/5" />
                ))
              ) : venues.map((venue, i) => (
                <motion.div 
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-zinc-900/50 border-2 border-white/5 hover:border-emerald-500/50 rounded-[40px] p-10 space-y-8 group transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                      <Building2 size={32} className="text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      venue.isVerified ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-500"
                    )}>
                      {venue.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-3xl font-black uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{venue.name}</h4>
                      <p className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-500" />
                        {venue.city || venue.address}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">Capacity</p>
                        <p className="text-xl font-black font-mono text-white">{venue.capacity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">Verified</p>
                        <p className="text-xl font-black font-mono text-white">{venue.isVerified ? 'YES' : 'NO'}</p>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
                    View Technical Specs
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeView === 'tickets' && (
          <motion.div 
            key="tickets"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TicketManager />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
      <AnimatePresence>
        {isCreateEventModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full bg-zinc-900 border-4 border-emerald-500 p-12 rounded-[48px] space-y-12 relative overflow-y-auto max-h-[90vh]"
            >
              <div className="space-y-6">
                <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">
                  Create <span className="text-emerald-500 italic">Event</span>
                </h3>
                <p className="text-zinc-400 text-lg font-medium">Schedule a new live performance on the global calendar.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Event Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Midnight Sonic Session"
                      className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 outline-none transition-all font-bold"
                      value={newEvent.title || ''}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Description</label>
                    <textarea 
                      placeholder="Tell your fans what to expect..."
                      className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 outline-none transition-all font-bold h-32 resize-none"
                      value={newEvent.description || ''}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 outline-none transition-all font-bold"
                        value={newEvent.date || ''}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Time</label>
                      <input 
                        type="time" 
                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 outline-none transition-all font-bold"
                        value={newEvent.time || ''}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Venue</label>
                    <select 
                      className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 outline-none transition-all font-bold"
                      value={newEvent.venue || ''}
                      onChange={(e) => {
                        const v = venues.find(v => v.name === e.target.value);
                        setNewEvent({ ...newEvent, venue: e.target.value, city: v?.city || '' });
                      }}
                    >
                      <option value="">Select Venue</option>
                      {venues.map(v => (
                        <option key={v.id} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">City</label>
                    <input 
                      type="text" 
                      placeholder="Berlin"
                      className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 outline-none transition-all font-bold"
                      value={newEvent.city || ''}
                      onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Price ($)</label>
                      <input 
                        type="number" 
                        placeholder="25"
                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 outline-none transition-all font-mono font-bold"
                        value={newEvent.price || ''}
                        onChange={(e) => setNewEvent({ ...newEvent, price: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Tickets</label>
                      <input 
                        type="number" 
                        placeholder="500"
                        className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 outline-none transition-all font-mono font-bold"
                        value={newEvent.ticketsAvailable || ''}
                        onChange={(e) => setNewEvent({ ...newEvent, ticketsAvailable: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => setIsCreateEventModalOpen(false)}
                  className="py-6 border-4 border-white/10 rounded-3xl text-[12px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateEvent}
                  className="py-6 bg-zinc-700 text-white rounded-3xl text-[12px] font-black uppercase tracking-widest hover:bg-zinc-600 shadow-2xl shadow-black/30 transition-all flex items-center justify-center gap-3"
                >
                  Confirm Event
                  <Check size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Venue Registration Modal */}
      <AnimatePresence>
        {isVenueModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-xl w-full bg-zinc-900 border-4 border-emerald-500 p-12 rounded-[48px] space-y-12 relative overflow-hidden"
            >
              <div className="space-y-6">
                <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">
                  Register <span className="text-emerald-500 italic">Venue</span>
                </h3>
                <p className="text-zinc-400 text-lg font-medium">Add a new performance space to the global network.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Venue Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. The Sonic Dome"
                    className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 outline-none transition-all font-bold"
                    value={newVenue.name || ''}
                    onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Address</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 123 Sonic Way, Berlin"
                    className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 outline-none transition-all font-bold"
                    value={newVenue.address || ''}
                    onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Capacity</label>
                    <input 
                      type="number" 
                      placeholder="5000"
                      className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 outline-none transition-all font-mono font-bold"
                      value={newVenue.capacity || ''}
                      onChange={(e) => setNewVenue({ ...newVenue, capacity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">City</label>
                    <input 
                      type="text" 
                      placeholder="Berlin"
                      className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-emerald-500 outline-none transition-all font-bold"
                      value={newVenue.city || ''}
                      onChange={(e) => setNewVenue({ ...newVenue, city: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => setIsVenueModalOpen(false)}
                  className="py-6 border-4 border-white/10 rounded-3xl text-[12px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddVenue}
                  className="py-6 bg-zinc-700 text-white rounded-3xl text-[12px] font-black uppercase tracking-widest hover:bg-zinc-600 shadow-2xl shadow-black/30 transition-all flex items-center justify-center gap-3"
                >
                  Confirm Registration
                  <Check size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
