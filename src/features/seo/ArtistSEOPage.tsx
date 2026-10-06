import { useParams, Link } from 'react-router-dom';
import { Meta } from '../../components/SEO/Meta';
import { MusicGroupSchema } from '../../components/SEO/JsonLd';
import { motion } from 'framer-motion';
import { Music, Users, MapPin, Zap } from 'lucide-react';
import { ShareButtons } from '../../components/social/ShareButtons';

export const ArtistSEOPage = () => {
  const { slug } = useParams();

  // In a real app, fetch artist data by slug
  const artist = {
    name: slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown Artist',
    bio: `Official SonicStream profile for ${slug}. Discover the latest tracks, albums, and upcoming events.`,
    image: `https://picsum.photos/seed/${slug}/800/800`,
    genre: 'Electronic / Future Bass',
    location: 'Los Angeles, CA',
    followers: '12.4K',
    tracksCount: 24,
    url: `https://sonicstream.com/artists/${slug}`,
    releases: [
      { title: 'Neon Nights', slug: 'neon-nights', year: '2026' },
      { title: 'Cyber Pulse', slug: 'cyber-pulse', year: '2025' }
    ],
    events: [
      { id: 'v12-live-experience', title: 'V12 Live Experience', date: 'July 15, 2026', venue: 'The Grand Arena', city: 'LA' }
    ]
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Meta 
        title={`${artist.name} | SonicStream`}
        description={artist.bio}
        image={artist.image}
        url={artist.url}
        type="profile"
      />
      
      <MusicGroupSchema 
        name={artist.name}
        description={artist.bio}
        image={artist.image}
        url={artist.url}
        genre={artist.genre}
        location={artist.location}
      />
      
      {/* Dynamic Breadcrumbs */}
      <nav className="bg-zinc-900/40 border-b border-white/5 px-12 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
          <span className="opacity-30">/</span>
          <Link to="/discovery/creators" className="hover:text-emerald-400 transition-colors">Creators</Link>
          <span className="opacity-30">/</span>
          <Link to={`/discovery/${artist.location.split(',')[0].toLowerCase().trim()}`} className="hover:text-emerald-400 transition-colors">{artist.location.split(',')[0]}</Link>
          <span className="opacity-30">/</span>
          <span className="text-zinc-300">{artist.name}</span>
        </div>
      </nav>
      
      {/* Localized SEO Banner */}
      <div className="bg-zinc-700 text-white px-12 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest italic">Featured Spotlight</span>
          <span className="text-xs font-black uppercase tracking-tight">Best {artist.genre.split('/')[0]} Artist in {artist.location}</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[40vh] overflow-hidden">
        <img 
          src={artist.image} 
          alt={artist.name}
          className="w-full h-full object-cover opacity-40 blur-sm"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 flex items-end gap-8">
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={artist.image}
            className="w-48 h-48 rounded-[40px] border-4 border-white/10 shadow-2xl"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter uppercase">{artist.name}</h1>
            <div className="flex items-center gap-6 text-zinc-400 font-bold text-sm uppercase tracking-widest">
              <span className="flex items-center gap-2"><Music size={16} className="text-emerald-400" /> {artist.tracksCount} Tracks</span>
              <span className="flex items-center gap-2"><Users size={16} className="text-emerald-400" /> {artist.followers} Followers</span>
              <span className="flex items-center gap-2"><MapPin size={16} className="text-emerald-400" /> {artist.location}</span>
              <ShareButtons url={artist.url} title={`Check out ${artist.name} on SonicStream!`} />
              <button 
                onClick={() => {
                  const embedCode = `<iframe src="https://sonicstream.com/embed/artist/${slug}" width="100%" height="450" frameborder="0"></iframe>`;
                  navigator.clipboard.writeText(embedCode);
                  // Using toast or alert
                  alert('Embed code copied to clipboard!');
                }}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all border border-white/5 group/embed"
              >
                <Zap size={14} className="text-emerald-400 group-hover/embed:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover/embed:text-white transition-colors">Embed</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-12 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight">Biography</h2>
            <p className="text-zinc-400 text-lg leading-relaxed">{artist.bio}</p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight">Top Tracks</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Link 
                  key={i} 
                  to={`/tracks/sonic-pulse-${i}`}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-600 font-black w-4">{i}</span>
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl" />
                    <div>
                      <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">Sonic Pulse {i}</div>
                      <div className="text-xs text-zinc-500 uppercase font-black tracking-widest">3:45</div>
                    </div>
                  </div>
                  <button className="p-2 text-zinc-500 hover:text-white"><Music size={20} /></button>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight">Recent Releases</h2>
            <div className="grid grid-cols-2 gap-6">
              {artist.releases.map((release, i) => (
                <Link 
                  key={i} 
                  to={`/release/${release.slug}`}
                  className="bg-white/5 border border-white/5 rounded-[32px] p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="aspect-square bg-zinc-800 rounded-2xl mb-4 overflow-hidden">
                    <img src={`https://picsum.photos/seed/${release.slug}/400/400`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{release.title}</h3>
                  <p className="text-xs text-zinc-500 font-black uppercase tracking-widest mt-1">{release.year}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight">Upcoming Events</h3>
            <div className="space-y-4">
              {artist.events.map(event => (
                <Link 
                  key={event.id} 
                  to={`/events/${event.id}`}
                  className="block p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2 hover:border-emerald-500/30 transition-all"
                >
                  <div className="text-xs font-black text-emerald-400 uppercase tracking-widest">{event.date}</div>
                  <div className="font-bold text-white">{event.title}</div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1"><MapPin size={12} /> {event.venue}, {event.city}</div>
                </Link>
              ))}
            </div>
            <Link 
              to="/events"
              className="block w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest transition-all"
            >
              View All Events
            </Link>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight">Similar Artists</h3>
            <div className="grid grid-cols-2 gap-4">
              {['Vortex', 'Starlight', 'Gravity', 'Lumina'].map(name => (
                <Link 
                  key={name}
                  to={`/artists/${name.toLowerCase()}`}
                  className="group block space-y-2"
                >
                  <div className="aspect-square bg-zinc-800 rounded-2xl overflow-hidden border border-white/5 group-hover:border-emerald-500/30 transition-all">
                    <img src={`https://picsum.photos/seed/${name}/200/200`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-center text-zinc-500 group-hover:text-emerald-400">{name}</div>
                </Link>
              ))}
            </div>
            <Link 
              to="/discovery/creators"
              className="block w-full text-center text-[10px] font-black uppercase tracking-widest text-emerald-400/60 hover:text-emerald-400 transition-colors"
            >
              Discover More Like This
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
