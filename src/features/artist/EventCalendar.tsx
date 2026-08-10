import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  MapPin, 
  Clock, 
  Ticket, 
  Edit2, 
  Trash2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { useMyEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../hooks/useApi';
import { SonicEvent } from '../../types';
import { cn } from '../../utils/cn';

export const EventCalendar: React.FC = () => {
  const { data: events = [], isLoading } = useMyEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SonicEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    venue: '',
    city: '',
    price: 0,
    ticketsAvailable: 100,
    imageUrl: ''
  });

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const handleOpenModal = (event?: SonicEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description,
        date: event.date.slice(0, 16),
        venue: event.venue,
        city: event.city,
        price: event.price,
        ticketsAvailable: event.ticketsAvailable,
        imageUrl: event.imageUrl || ''
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        venue: '',
        city: '',
        price: 0,
        ticketsAvailable: 100,
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent.id, data: formData });
      } else {
        await createEvent.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    // Avoid window.confirm in iframe
    try {
      await deleteEvent.mutateAsync(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <CalendarIcon size={12} />
            Live Performance
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tight">Event Calendar</h2>
          <p className="text-zinc-400 max-w-2xl">
            Manage your upcoming shows, tours, and live sessions. Sync with ticketing platforms and track sales.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-8 py-4 bg-zinc-700 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-zinc-600 transition-all shadow-xl shadow-black/20"
        >
          <Plus size={20} />
          List New Event
        </button>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black uppercase tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-600 py-2">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
              return (
                <div 
                  key={day.toString()}
                  className={cn(
                    "aspect-square p-2 rounded-2xl border transition-all group relative",
                    isSameDay(day, new Date()) ? "bg-emerald-500/10 border-emerald-500/20" : "bg-black/20 border-white/5 hover:border-white/10"
                  )}
                >
                  <span className={cn(
                    "text-xs font-bold",
                    isSameDay(day, new Date()) ? "text-emerald-400" : "text-zinc-500"
                  )}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map(e => (
                      <div 
                        key={e.id} 
                        className="w-full h-1.5 bg-emerald-500 rounded-full cursor-pointer"
                        title={e.title}
                        onClick={() => handleOpenModal(e)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tight">Upcoming Shows</h3>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {events.length} Total
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="p-12 text-center text-zinc-500">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center bg-zinc-900/20 border border-dashed border-white/10 rounded-[32px] space-y-4">
                <CalendarIcon size={40} className="mx-auto text-zinc-800" />
                <p className="text-sm text-zinc-500">No events listed yet.</p>
              </div>
            ) : (
              events.map((event) => (
                <motion.div 
                  key={event.id}
                  layout
                  className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl space-y-4 group hover:border-white/10 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {format(parseISO(event.date), 'MMM d, h:mm a')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {event.city}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(event)}
                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(event.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Ticket size={14} className="text-emerald-500" />
                      <span className="text-xs font-bold text-white">${event.price}</span>
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                        {event.ticketsAvailable} Left
                      </span>
                    </div>
                    <button className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
                      View Page
                      <ExternalLink size={10} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black uppercase tracking-tight">
                    {editingEvent ? 'Edit Event' : 'List New Event'}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <Plus size={24} className="rotate-45" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Event Title</label>
                    <input 
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-emerald-500/50 outline-none transition-all"
                      placeholder="e.g. Summer Solstice Live"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Date & Time</label>
                    <input 
                      required
                      type="datetime-local"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Venue</label>
                    <input 
                      required
                      value={formData.venue}
                      onChange={e => setFormData({...formData, venue: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-emerald-500/50 outline-none transition-all"
                      placeholder="e.g. The Blue Room"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">City</label>
                    <input 
                      required
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-emerald-500/50 outline-none transition-all"
                      placeholder="e.g. Los Angeles"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ticket Price ($)</label>
                    <input 
                      required
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tickets Available</label>
                    <input 
                      required
                      type="number"
                      value={formData.ticketsAvailable}
                      onChange={e => setFormData({...formData, ticketsAvailable: parseInt(e.target.value)})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-emerald-500/50 outline-none transition-all h-32 resize-none"
                    placeholder="Tell your fans about the show..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={createEvent.isPending || updateEvent.isPending}
                  className="w-full py-5 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 disabled:opacity-50"
                >
                  {editingEvent ? 'Update Event' : 'List Event'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
