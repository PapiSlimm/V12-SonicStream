import { useParams, Link } from 'react-router-dom';
import { Meta } from '../../components/SEO/Meta';
import { MusicRecordingSchema } from '../../components/SEO/JsonLd';
import { motion } from 'framer-motion';
import { Play, Heart, ListMusic, User } from 'lucide-react';
import { ShareButtons } from '../../components/social/ShareButtons';
import { DownloadButton } from '../../components/music/DownloadButton';

export const TrackSEOPage = () => {
  const { slug } = useParams();

  // In a real app, fetch track data by slug
  const track = {
    title: slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown Track',
    artistName: 'V12 Collective',
    artistSlug: 'v12-collective',
    description: `Stream ${slug} by V12 Collective on SonicStream. High-fidelity audio, exclusive content, and more.`,
    cover: `https://picsum.photos/seed/${slug}/1000/1000`,
    duration: 'PT3M45S',
    genre: 'Electronic',
    releaseDate: '2026-04-01',
    url: `https://sonicstream.com/tracks/${slug}`
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Meta 
        title={`${track.title} - ${track.artistName}`}
        description={track.description}
        image={track.cover}
        url={track.url}
        type="music.song"
        artist={track.artistName}
      />
      
      <MusicRecordingSchema 
        name={track.title}
        url={track.url}
        duration={track.duration}
        datePublished={track.releaseDate}
        artistName={track.artistName}
        image={track.cover}
      />

      <div className="max-w-7xl mx-auto px-12 py-24 flex flex-col lg:flex-row gap-16 items-center lg:items-end">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md aspect-square rounded-[60px] overflow-hidden shadow-2xl shadow-emerald-500/20 border border-white/10"
        >
          <img 
            src={track.cover} 
            alt={track.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <span className="px-4 py-1.5 bg-zinc-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                New Release
              </span>
            </div>
            <h1 className="text-7xl font-black tracking-tighter uppercase leading-none">{track.title}</h1>
            <Link 
              to={`/artists/${track.artistSlug}`}
              className="flex items-center justify-center lg:justify-start gap-3 text-2xl font-bold text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              <User size={24} />
              {track.artistName}
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button className="bg-zinc-700 hover:bg-zinc-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 shadow-xl shadow-black/20 transition-all">
              <Play size={20} fill="currentColor" />
              Play Now
            </button>
            <button className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all">
              <Heart size={20} />
            </button>
            <button className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all">
              <ListMusic size={20} />
            </button>
            <DownloadButton trackId={slug || 'track'} trackTitle={track.title} artistName={track.artistName} />
            <ShareButtons url={track.url} title={`Listen to ${track.title} by ${track.artistName} on SonicStream!`} />
          </div>

          <div className="pt-8 border-t border-white/5">
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xl">{track.description}</p>
          </div>

          <div className="flex gap-4">
            <Link 
              to={`/discovery/genre/${track.genre.toLowerCase()}`}
              className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
            >
              # {track.genre}
            </Link>
            <Link 
              to="/discovery/trending"
              className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
            >
              # Trending
            </Link>
          </div>

          <div className="pt-12 space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight">Lyrics</h3>
            <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 text-zinc-400 leading-relaxed font-medium italic whitespace-pre-wrap">
              [Verse 1]
              Synthesized dreams in a digital space
              Tracing the lines of a neon embrace
              Pulses of light in a binary stream
              Lost in the static, or just in a dream...
              
              [Chorus]
              V12 engine, sonic frequency
              Breaking the locks of the legacy
              Higher we climb in the sonic gold rush
              Leaving the silence, leaving the hush...
            </div>
          </div>

          <div className="pt-12 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Related Tracks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Sonic Pulse 2', 'Cyber Rhythm', 'Neon Flow'].map((t, i) => (
                <Link 
                  key={i} 
                  to={`/tracks/${t.toLowerCase().replace(' ', '-')}`}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden">
                    <img src={`https://picsum.photos/seed/track-${i}/100/100`} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{t}</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{track.artistName}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
