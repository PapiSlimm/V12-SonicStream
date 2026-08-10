import { useState, useEffect } from 'react';
import { RefreshCw, X, ShieldAlert, Check, Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { Stats, Booking, EmailLog } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { AdminModeration } from './AdminModeration';
import { UserManagement } from './UserManagement';
import { PayoutManagement } from './PayoutManagement';
import { AdminArtistDashboard } from './AdminArtistDashboard';
import { TicketManagement } from './TicketManagement';
import { MetadataManager } from './MetadataManager';
import { Tabs } from '../../components/ui/Tabs';
import { SectionCard } from '../../components/ui/SectionCard';
import { Input, Select } from '../../components/ui/Form';
import { useAuth } from '../../context/AuthContext';
import { 
  connectGoogleCalendar, 
  disconnectGoogleCalendar, 
  isGoogleCalendarConnected, 
  getConnectedEmail, 
  fetchUpcomingEvents, 
  addEventToCalendar, 
  GoogleCalendarEvent 
} from '../../services/googleCalendar';

interface AdminPanelProps {
  stats: Stats | null;
  bookings: Booking[];
  emailLogs: EmailLog[];
  onRunReminders: () => Promise<void>;
}

export const AdminPanel = ({ 
  stats, 
  bookings, 
  emailLogs, 
  onRunReminders,
}: AdminPanelProps) => {
  const { isAdmin } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const [googleConnected, setGoogleConnected] = useState(isGoogleCalendarConnected());
  const [googleEmail, setGoogleEmail] = useState(getConnectedEmail());
  const [upcomingEvents, setUpcomingEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncedBookings, setSyncedBookings] = useState<string[]>([]);

  useEffect(() => {
    if (googleConnected) {
      loadGCalEvents();
    }
  }, [googleConnected]);

  const loadGCalEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const events = await fetchUpcomingEvents();
      setUpcomingEvents(events);
    } catch (err: any) {
      console.error('Failed to load Google Calendar events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const result = await connectGoogleCalendar();
      if (result) {
        setGoogleConnected(true);
        setGoogleEmail(result.email);
      }
    } catch (err: any) {
      alert(`Connection failed: ${err.message || err}`);
    }
  };

  const handleDisconnectGoogle = () => {
    const confirmDisconnect = window.confirm('Are you sure you want to disconnect Google Calendar? This will stop real-time synchronization.');
    if (!confirmDisconnect) return;
    disconnectGoogleCalendar();
    setGoogleConnected(false);
    setGoogleEmail(null);
    setUpcomingEvents([]);
    setSyncMessage(null);
  };

  const handleSyncBooking = async (booking: Booking) => {
    const isConfirmed = window.confirm(
      `Confirm Action: Do you authorize SonicStream to add the booking "${booking.customerName} - Event" on ${new Date(booking.startTime).toLocaleDateString()} to your Google Calendar?`
    );
    if (!isConfirmed) return;

    try {
      setSyncMessage(`Syncing ${booking.customerName} booking...`);
      await addEventToCalendar(
        `SonicStream Slot: ${booking.customerName}`,
        `Upcoming gig booking organized via SonicStream.\n\nCustomer Email: ${booking.customerEmail}\nCommission: $${booking.commissionAmount}\nTotal Amount: $${booking.totalAmount}\nStatus: ${booking.status.toUpperCase()}`,
        'SonicStream Concert Hall',
        booking.startTime,
        booking.endTime
      );
      setSyncedBookings(prev => [...prev, booking.id]);
      setSyncMessage('Successfully added to Google Calendar!');
      setTimeout(() => setSyncMessage(null), 3000);
      loadGCalEvents();
    } catch (err: any) {
      alert(`Sync failed: ${err.message || err}`);
      setSyncMessage(null);
    }
  };

  const handleSyncAllBookings = async () => {
    const unsynced = bookings.filter(b => !syncedBookings.includes(b.id));
    if (unsynced.length === 0) {
      alert('All bookings are already synced!');
      return;
    }

    const isConfirmed = window.confirm(
      `Confirm Action: Do you authorize SonicStream to add ${unsynced.length} pending bookings to your Google Calendar?`
    );
    if (!isConfirmed) return;

    setIsSyncing(true);
    let count = 0;
    try {
      for (const booking of unsynced) {
        setSyncMessage(`Syncing booking ${++count} of ${unsynced.length}...`);
        await addEventToCalendar(
          `SonicStream Slot: ${booking.customerName}`,
          `Upcoming gig booking organized via SonicStream.\n\nCustomer Email: ${booking.customerEmail}\nCommission: $${booking.commissionAmount}\nTotal Amount: $${booking.totalAmount}\nStatus: ${booking.status.toUpperCase()}`,
          'SonicStream Concert Hall',
          booking.startTime,
          booking.endTime
        );
        setSyncedBookings(prev => [...prev, booking.id]);
      }
      setSyncMessage(`Successfully synced ${unsynced.length} bookings to Google Calendar!`);
      setTimeout(() => setSyncMessage(null), 4000);
      loadGCalEvents();
    } catch (err: any) {
      alert(`Sync error: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-zinc-500">You do not have permission to view the Admin Panel.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'availability', label: 'Availability & Buffers' },
    { id: 'calendar', label: 'Calendar Sync' },
    { id: 'moderation', label: 'Moderation Queue' },
    { id: 'payouts', label: 'Payout Requests' },
    { id: 'artist-dashboard', label: 'Artist Dashboard' },
    { id: 'users', label: 'User Management' },
    { id: 'tickets', label: 'Support Tickets' },
    { id: 'metadata', label: 'Metadata Management' }
  ];

  return (
    <div className="space-y-8">
      <Tabs tabs={tabs} activeTab={activeSubTab} onChange={setActiveSubTab} />

      {activeSubTab === 'moderation' && <AdminModeration />}
      {activeSubTab === 'payouts' && <PayoutManagement />}
      {activeSubTab === 'artist-dashboard' && <AdminArtistDashboard />}
      {activeSubTab === 'users' && <UserManagement />}
      {activeSubTab === 'tickets' && <TicketManagement />}
      {activeSubTab === 'metadata' && <MetadataManager />}

      {activeSubTab === 'overview' && (
        <AdminDashboard 
          stats={stats} 
          bookings={bookings} 
          emailLogs={emailLogs}
          onRunReminders={onRunReminders}
        />
      )}

      {activeSubTab === 'availability' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SectionCard title="Global Working Hours">
              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{day}</span>
                    <div className="flex items-center gap-3">
                      <Input type="text" defaultValue="09:00" className="w-20 text-center py-1 px-2" />
                      <span className="text-zinc-600">-</span>
                      <Input type="text" defaultValue="18:00" className="w-20 text-center py-1 px-2" />
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full bg-zinc-700 text-white py-3 rounded-xl font-bold text-sm mt-6">
                Save Global Hours
              </button>
            </SectionCard>
            <div className="space-y-8">
              <SectionCard title="Buffer Times">
                <p className="text-sm text-zinc-500 mb-4">Add automatic downtime between bookings to prevent scheduling conflicts.</p>
                <div className="flex items-center gap-4">
                  <Select 
                    containerClassName="flex-1"
                    options={[
                      { value: '15', label: '15 Minutes' },
                      { value: '30', label: '30 Minutes' },
                      { value: '60', label: '60 Minutes' },
                      { value: '0', label: 'No Buffer' },
                    ]}
                  />
                  <button className="bg-zinc-800 px-6 py-3 rounded-xl font-bold text-sm">Update</button>
                </div>
              </SectionCard>
              <SectionCard title="Specific Days Off">
                <div className="flex gap-2 mb-4">
                  <Input type="date" containerClassName="flex-1" />
                  <button className="bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['2026-03-15', '2026-04-01'].map(date => (
                    <span key={date} className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                      {date} <button aria-label={`Remove ${date}`} className="hover:text-white"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'calendar' && (
        <div className="max-w-4xl mx-auto space-y-8 py-8">
          <div className="text-center space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
              googleConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800/80 text-zinc-400'
            }`}>
              <CalendarIcon size={40} />
            </div>
            <h3 className="text-2xl font-bold uppercase tracking-tight">Real-Time Calendar Sync</h3>
            <p className="text-zinc-500 max-w-lg mx-auto text-sm">
              Connect your professional calendar to automatically prevent schedule conflicts and sync booking milestones with your Google Calendar.
            </p>
          </div>

          {syncMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono rounded-2xl flex items-center gap-3 animate-pulse">
              <Loader2 className="animate-spin shrink-0" size={16} />
              <span>{syncMessage}</span>
            </div>
          )}

          {!googleConnected ? (
            <div className="space-y-4 max-w-md mx-auto font-sans">
              <button 
                type="button"
                onClick={handleConnectGoogle}
                className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all cursor-pointer"
              >
                <img src="https://www.google.com/favicon.ico" className="w-[18px] h-[18px]" alt="Google" />
                Connect Google Calendar
              </button>
              <button 
                type="button"
                className="w-full bg-zinc-900 border border-white/10 text-white/50 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all cursor-not-allowed"
                disabled
              >
                <img src="https://www.microsoft.com/favicon.ico" className="w-[18px] h-[18px] opacity-50" alt="Outlook" />
                Connect Outlook (Enterprise Tier)
              </button>
              <button 
                type="button"
                className="w-full bg-zinc-900 border border-white/10 text-white/50 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all cursor-not-allowed"
                disabled
              >
                <img src="https://www.apple.com/favicon.ico" className="w-[18px] h-[18px] opacity-50" alt="Apple" />
                Connect Apple Calendar (Enterprise Tier)
              </button>
              <p className="text-zinc-650 text-center text-[10px] uppercase font-black tracking-widest pt-2">
                Requires calendar authentication to access calendars with permissions
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
              {/* Connected details and syncing controls */}
              <div className="space-y-6">
                <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[32px] space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full">
                        Connected Status
                      </span>
                      <h4 className="text-lg font-bold text-white mt-4 truncate">{googleEmail || 'Linked Google Account'}</h4>
                      <p className="text-zinc-500 text-xs mt-1">Google Calendar integration is active.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className="px-4 py-2 border border-red-500/20 text-red-500 hover:text-white hover:bg-red-500 rounded-xl text-xs font-bold uppercase transition-all shrink-0 cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>

                  <div className="border-t border-white/5 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black uppercase tracking-wider text-zinc-400">SonicStream Gig Bookings</h5>
                      <button
                        type="button"
                        onClick={handleSyncAllBookings}
                        disabled={isSyncing || bookings.filter(b => !syncedBookings.includes(b.id)).length === 0}
                        className="px-4 py-2 bg-zinc-700 text-white rounded-xl text-xs font-black uppercase hover:bg-zinc-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                      >
                        {isSyncing ? 'Syncing...' : 'Sync All Pending'}
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                      {bookings.length > 0 ? (
                        bookings.map(booking => {
                          const isSynced = syncedBookings.includes(booking.id);
                          return (
                            <div key={booking.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <h6 className="text-xs font-bold text-white truncate">{booking.customerName}</h6>
                                <p className="text-[10px] text-zinc-500 mt-0.5">
                                  {new Date(booking.startTime).toLocaleDateString()} @ {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSyncBooking(booking)}
                                disabled={isSynced}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 ${
                                  isSynced 
                                    ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400'
                                    : 'bg-zinc-805 text-zinc-200 border border-white/5 hover:bg-zinc-700 cursor-pointer'
                                }`}
                              >
                                {isSynced ? (
                                  <>
                                    <Check size={10} /> Synced
                                  </>
                                ) : (
                                  'Sync To GCal'
                                )}
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-zinc-500 text-center py-6">No gig bookings found to sync.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time events from Google Calendar */}
              <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[32px] space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h4 className="text-sm font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                    Live Google Calendar Feed
                  </h4>
                  <button
                    type="button"
                    onClick={loadGCalEvents}
                    disabled={isLoadingEvents}
                    className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all shrink-0 cursor-pointer"
                    title="Reload Calendar Events"
                  >
                    <RefreshCw size={14} className={isLoadingEvents ? 'animate-spin' : ''} />
                  </button>
                </div>

                {isLoadingEvents ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="animate-spin text-emerald-400" size={24} />
                    <p className="text-xs text-zinc-500">Retrieving official calendar feed...</p>
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                    {upcomingEvents.map((event, index) => {
                      const eventDate = event.start.dateTime 
                        ? new Date(event.start.dateTime) 
                        : null;
                      return (
                        <div key={event.id || index} className="p-4 bg-zinc-950/85 rounded-2xl border border-white/5 space-y-2">
                          <h5 className="text-xs font-black text-white leading-tight uppercase tracking-tight">{event.summary || '(No Title)'}</h5>
                          <div className="flex items-center gap-4 text-[9px] font-black tracking-widest uppercase text-zinc-550">
                            {eventDate && (
                              <span>
                                {eventDate.toLocaleDateString()} @ {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {event.location && (
                              <span className="truncate max-w-[120px] text-emerald-400">
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 border border-dashed border-white/5 rounded-2xl">
                    <AlertCircle className="text-zinc-650" size={24} />
                    <p className="text-xs text-zinc-500">No upcoming events found on your primary calendar.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
            <p className="text-xs text-emerald-400 text-center leading-relaxed font-semibold">
              Bidirectional real-time syncing coordinates other gigs effortlessly. We ask for authorization to access and sync event bookings, working securely using temporary scoped tokens.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
