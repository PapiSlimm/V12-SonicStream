import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Artist, ArtistAnalytics } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Music, Users, DollarSign, Calendar } from 'lucide-react';

export const AdminArtistDashboard = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ArtistAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const data = await api.artist.getArtists();
        if (data && Array.isArray(data)) {
          setArtists(data);
          if (data.length > 0) setSelectedArtistId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArtists();
  }, []);

  useEffect(() => {
    if (selectedArtistId) {
      const fetchAnalytics = async () => {
        try {
          // In a real app, we'd fetch analytics for the specific artist
          const data = await api.artist.getAnalytics();
          if (data) {
            setAnalytics(data);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchAnalytics();
    }
  }, [selectedArtistId]);

  if (isLoading) return <div className="p-20 text-center animate-pulse">Loading artist data...</div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Artist Performance Dashboard</h2>
          <p className="text-zinc-500">Monitor streaming, gigs, and financial health across the platform.</p>
        </div>
        <select 
          value={selectedArtistId || ''} 
          onChange={(e) => setSelectedArtistId(e.target.value)}
          className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
        >
          {artists.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </header>

      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-2">
              <div className="flex items-center gap-2 text-zinc-500">
                <Music size={16} />
                <span className="text-xs font-bold uppercase">Total Streams</span>
              </div>
              <p className="text-3xl font-bold">{analytics.totalStreams.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-2">
              <div className="flex items-center gap-2 text-zinc-500">
                <Users size={16} />
                <span className="text-xs font-bold uppercase">Monthly Listeners</span>
              </div>
              <p className="text-3xl font-bold">{analytics.monthlyListeners.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-500">
                <DollarSign size={16} />
                <span className="text-xs font-bold uppercase">Artist Revenue</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400">${analytics.revenue.artistShare.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-2">
              <div className="flex items-center gap-2 text-zinc-500">
                <Calendar size={16} />
                <span className="text-xs font-bold uppercase">Upcoming Gigs</span>
              </div>
              <p className="text-3xl font-bold">12</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
              <h3 className="font-bold">Streaming Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.platformDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                      itemStyle={{ color: '#c81e3a' }}
                    />
                    <Bar dataKey="streams" fill="#c81e3a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
              <h3 className="font-bold">Revenue Growth</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { month: 'Jan', revenue: 400 },
                    { month: 'Feb', revenue: 600 },
                    { month: 'Mar', revenue: 550 },
                    { month: 'Apr', revenue: 900 },
                    { month: 'May', revenue: 1100 },
                    { month: 'Jun', revenue: 875 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#c81e3a" strokeWidth={3} dot={{ fill: '#c81e3a' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
