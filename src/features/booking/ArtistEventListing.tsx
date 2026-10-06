import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, Users, Plus, Trash2, CheckCircle, XCircle, Clock, Edit2 } from 'lucide-react';
import { useCreateEvent, useMyEvents, useArtistBookings, useUpdateEvent, useDeleteEvent } from '../../hooks/useApi';
import { format } from 'date-fns';
import { api } from '../../api';
import { toast } from '../../components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';

export const ArtistEventListing = () => {
  const queryClient = useQueryClient();
  const { data: myEvents = [], isLoading: eventsLoading } = useMyEvents();
  const { data: bookings = [], isLoading: bookingsLoading } = useArtistBookings();
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  
  const [activeTab, setActiveTab] = useState<'shows' | 'bookings'>('shows');
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    city: '',
    price: '',
    tickets_available: '',
    image_url: '',
    genre: ''
  });

  const handleConfirmBooking = async (id: string) => {
    try {
      await api.bookings.confirm(id);
      await queryClient.invalidateQueries({ queryKey: ['artist-bookings'] });
      toast.success('Booking confirmed!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm booking');
    }
  };

  const handleRejectBooking = async (id: string) => {
    try {
      await api.bookings.reject(id);
      await queryClient.invalidateQueries({ queryKey: ['artist-bookings'] });
      toast.success('Booking rejected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject booking');
    }
  };

  const handleEdit = (event: any) => {
    const eventDate = new Date(event.date);
    setFormData({
      title: event.title,
      description: event.description,
      date: format(eventDate, 'yyyy-MM-dd'),
      time: format(eventDate, 'HH:mm'),
      venue: event.venue,
      city: event.city,
      price: event.price.toString(),
      tickets_available: event.tickets_available.toString(),
      image_url: event.image_url || '',
      genre: event.genre || ''
    });
    setEditingEventId(event.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this show? This action cannot be undone.')) {
      deleteEventMutation.mutate(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventDate = new Date(`${formData.date}T${formData.time || '20:00'}`);
    
    const payload = {
      ...formData,
      date: eventDate.toISOString(),
      price: parseFloat(formData.price),
      tickets_available: parseInt(formData.tickets_available)
    };

    if (editingEventId) {
      updateEventMutation.mutate({ id: editingEventId, data: payload }, {
        onSuccess: () => {
          setShowForm(false);
          setEditingEventId(null);
          resetForm();
        }
      });
    } else {
      createEventMutation.mutate(payload, {
        onSuccess: () => {
          setShowForm(false);
          resetForm();
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      venue: '',
      city: '',
      price: '',
      tickets_available: '',
      image_url: '',
      genre: ''
    });
  };

  const filteredEvents = myEvents.filter((event: any) => {
    const matchesGenre = !filterGenre || event.genre?.toLowerCase().includes(filterGenre.toLowerCase());
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold">Artist Portal</h2>
          <p className="text-zinc-400">Manage your shows and private bookings.</p>
        </div>
        <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('shows')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'shows' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            My Shows
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'bookings' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Venue Bookings
          </button>
        </div>
      </div>

      {activeTab === 'shows' ? (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <input 
                type="text"
                placeholder="Search your shows..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-500 transition-colors w-full md:w-64"
              />
              <select 
                value={filterGenre}
                onChange={e => setFilterGenre(e.target.value)}
                className="bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-500 transition-colors w-full md:w-48"
              >
                <option value="">All Genres</option>
                <option value="Techno">Techno</option>
                <option value="House">House</option>
                <option value="Trance">Trance</option>
                <option value="Ambient">Ambient</option>
                <option value="Drum & Bass">Drum & Bass</option>
              </select>
            </div>
            <button 
              onClick={() => {
                if (showForm && editingEventId) {
                  setEditingEventId(null);
                  resetForm();
                } else {
                  setShowForm(!showForm);
                }
              }}
              className="bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-600 transition-colors w-full md:w-auto justify-center"
            >
              {showForm && editingEventId ? <XCircle size={20} /> : <Plus size={20} />}
              {showForm && editingEventId ? 'Cancel Edit' : 'List New Show'}
            </button>
          </div>

          {showForm && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase">Show Title</label>
                    <input 
                      required
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                      placeholder="e.g. Midnight Resonance Live"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase">Venue Name</label>
                    <input 
                      required
                      type="text"
                      value={formData.venue}
                      onChange={e => setFormData({...formData, venue: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                      placeholder="e.g. The Echo Chamber"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase">City</label>
                    <input 
                      required
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                      placeholder="e.g. London"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase">Genre</label>
                    <input 
                      type="text"
                      value={formData.genre}
                      onChange={e => setFormData({...formData, genre: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                      placeholder="e.g. Techno"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase">Date</label>
                    <input 
                      required
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase">Time</label>
                    <input 
                      required
                      type="time"
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase">Ticket Price ($)</label>
                    <input 
                      required
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase">Tickets Available</label>
                    <input 
                      required
                      type="number"
                      value={formData.tickets_available}
                      onChange={e => setFormData({...formData, tickets_available: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase">Cover Image URL</label>
                    <input 
                      type="url"
                      value={formData.image_url}
                      onChange={e => setFormData({...formData, image_url: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400 uppercase">Description</label>
                  <textarea 
                    required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors h-32 resize-none"
                    placeholder="Tell your fans what to expect..."
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEventId(null);
                      resetForm();
                    }}
                    className="px-6 py-3 rounded-xl font-bold text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={createEventMutation.isPending || updateEventMutation.isPending}
                    className="bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-600 transition-colors disabled:opacity-50"
                  >
                    {editingEventId ? 
                      (updateEventMutation.isPending ? 'Updating...' : 'Update Show') : 
                      (createEventMutation.isPending ? 'Listing...' : 'Confirm Show')
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {eventsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-12 text-center space-y-4">
                <Calendar className="mx-auto text-zinc-700" size={48} />
                <h3 className="text-xl font-bold">No shows found</h3>
                <p className="text-zinc-500">Try adjusting your filters or list a new show.</p>
              </div>
            ) : (
              filteredEvents.map((event: any) => (
                <div key={event.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden flex-shrink-0">
                    <img 
                      src={event.image_url || `https://picsum.photos/seed/${event.id}/400/400`} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-grow space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-bold">{event.title}</h3>
                        <div className="flex items-center gap-4 text-zinc-400 text-sm mt-1">
                          <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(event.date), 'PPP')}</span>
                          <span className="flex items-center gap-1"><MapPin size={14} /> {event.venue}, {event.city}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold text-xl">${event.price}</div>
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-widest">Per Ticket</div>
                      </div>
                    </div>
                    <p className="text-zinc-400 text-sm line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users size={16} className="text-zinc-500" />
                        <span className="font-bold">{event.tickets_available}</span>
                        <span className="text-zinc-500">Tickets Left</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={16} className="text-zinc-500" />
                        <span className="font-bold">0</span>
                        <span className="text-zinc-500">Sold</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => handleEdit(event)}
                      className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 size={14} /> Edit Details
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Cancel Show
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookingsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-12 text-center space-y-4">
              <Clock className="mx-auto text-zinc-700" size={48} />
              <h3 className="text-xl font-bold">No venue bookings yet</h3>
              <p className="text-zinc-500">When venues book you for private events, they will appear here.</p>
            </div>
          ) : (
            bookings.map((booking: any) => (
              <div key={booking.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                      booking.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {booking.status}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      booking.payment_status === 'paid' ? 'bg-blue-500/10 text-blue-400' :
                      booking.payment_status === 'deposit_paid' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {booking.payment_status.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{booking.customer_name}</h3>
                    <p className="text-zinc-400 text-sm">{booking.customer_email}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(booking.start_time), 'PPP')}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {format(new Date(booking.start_time), 'p')}</span>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">${booking.total_amount}</div>
                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Total Fee</div>
                  </div>
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRejectBooking(booking.id)}
                        className="px-6 py-2 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                      <button 
                        onClick={() => handleConfirmBooking(booking.id)}
                        className="px-6 py-2 rounded-xl bg-zinc-700 text-white font-bold hover:bg-zinc-600 transition-all flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Confirm
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
