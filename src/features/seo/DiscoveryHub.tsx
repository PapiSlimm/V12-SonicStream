import { useParams, Link, useLocation } from 'react-router-dom';
import { Meta } from '../../components/SEO/Meta';
import { JsonLd } from '../../components/SEO/JsonLd';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, Music, Zap, Calendar, ListMusic } from 'lucide-react';

export const DiscoveryHub = () => {
  const { city, genre } = useParams();
  const location = useLocation();
  const path = location.pathname;

  let title = `New ${genre || ''} Music Releases This Week`;
  let description = `Stay ahead of the curve with the latest ${genre || ''} releases from independent artists worldwide.`;
  let schemaType = 'ItemList';

  if (city && !path.includes('/events')) {
    title = `Top Creators in ${city}`;
    description = `Discover the best independent ${genre || 'music'} artists and creators in ${city}. Support local talent on SonicStream.`;
  }

  if (path.includes('/discovery/events')) {
    title = city ? `Upcoming Events in ${city}` : `Upcoming ${genre || ''} Events Near You`;
    description = `Find the most exciting live music experiences and ${genre || ''} events happening soon.`;
    schemaType = 'Event';
  }

  if (path.includes('/discovery/trending')) {
    title = `Trending ${genre || ''} Playlists`;
    description = `The most popular ${genre || ''} sounds on SonicStream right now, curated by the community and AI.`;
    schemaType = 'CreativeWorkSeries';
  }

  if (path.includes('/discovery/releases')) {
    title = `New Music Releases This Week`;
    description = `Fresh sounds from the SonicStream community. Updated daily with the best new independent music.`;
  }

  // Mock data for structured data
  const items = [1, 2, 3, 4, 5, 6].map(i => ({
    '@type': 'ListItem',
    'position': i,
    'url': `https://sonicstream.com/artists/artist-${i}`,
    'name': `Artist Name ${i}`
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-20 px-12">
      <Meta 
        title={`${title} | SonicStream Discovery`}
        description={description}
      />

      <JsonLd data={{
        '@type': schemaType === 'ItemList' ? 'ItemList' : 'WebPage',
        'name': title,
        'description': description,
        'itemListElement': schemaType === 'ItemList' ? items : undefined
      }} />

      <div className="max-w-7xl mx-auto space-y-16">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            {city ? <MapPin size={24} /> : <Zap size={24} />}
            <span className="text-xs font-black uppercase tracking-[0.3em]">Discovery Hub</span>
          </div>
          <h1 className="text-7xl font-black tracking-tighter uppercase leading-none">{title}</h1>
          <p className="text-zinc-500 text-xl max-w-2xl">{description}</p>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Top Creators', icon: Zap, path: '/discovery/creators' },
            { label: 'New Releases', icon: Music, path: '/discovery/releases' },
            { label: 'Upcoming Events', icon: Calendar, path: '/discovery/events' },
            { label: 'Trending Playlists', icon: ListMusic, path: '/discovery/trending' },
          ].map(filter => (
            <Link 
              key={filter.label}
              to={filter.path}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
            >
              <filter.icon size={16} />
              {filter.label}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="bg-zinc-900/50 border border-white/5 rounded-[40px] overflow-hidden group"
            >
              <div className="aspect-video bg-zinc-800 relative">
                <img 
                  src={`https://picsum.photos/seed/hub-${i}/800/450`} 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <div className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Trending Now</div>
                  <div className="text-xl font-black text-white uppercase">Artist Name {i}</div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Music size={14} /> 12 Tracks</span>
                  <span className="flex items-center gap-1"><TrendingUp size={14} /> 98% Growth</span>
                </div>
                <Link 
                  to="/artists/artist-slug"
                  className="block w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  View Profile
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Internal Linking Section */}
        <div className="pt-20 border-t border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-8">Related Discovery Hubs</h3>
          <div className="flex flex-wrap gap-4">
            {['Los Angeles', 'New York', 'London', 'Berlin', 'Tokyo'].map(c => (
              <Link 
                key={c}
                to={`/discovery/${c.toLowerCase().replace(' ', '-')}`}
                className="px-6 py-3 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-full text-xs font-bold text-zinc-400 hover:text-emerald-400 transition-all"
              >
                Artists in {c}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
