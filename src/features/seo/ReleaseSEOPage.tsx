import { useParams, Link } from 'react-router-dom';
import { Meta } from '../../components/SEO/Meta';
import { MusicAlbumSchema } from '../../components/SEO/JsonLd';
import { motion } from 'framer-motion';
import { Play, Share2, Heart, User, Disc } from 'lucide-react';

export const ReleaseSEOPage = () => {
  const { slug } = useParams();

  // In a real app, fetch release data by slug
  const release = {
    title: slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown Release',
    artistName: 'V12 Collective',
    artistSlug: 'v12-collective',
    description: `Stream the official release ${slug} by V12 Collective on SonicStream. Includes exclusive bonus tracks and high-fidelity audio.`,
    cover: `https://picsum.photos/seed/release-${slug}/1000/1000`,
    genre: 'Electronic / Future Bass',
    releaseDate: '2026-04-10',
    tracks: [
      { title: 'Sonic Pulse', duration: '3:45' },
      { title: 'Cyber Rhythm', duration: '4:12' },
      { title: 'Neon Flow', duration: '3:58' }
    ],
    url: `https://sonicstream.com/release/${slug}`
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Meta 
        title={`${release.title} - ${release.artistName}`}
        description={release.description}
        image={release.cover}
        url={release.url}
        type="music.album"
        artist={release.artistName}
      />
      
      <MusicAlbumSchema 
        name={release.title}
        artistName={release.artistName}
        url={release.url}
        image={release.cover}
        genre={release.genre}
        datePublished={release.releaseDate}
        numTracks={release.tracks.length}
      />

      <div className="max-w-7xl mx-auto px-12 py-24">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full lg:w-1/3 aspect-square rounded-[60px] overflow-hidden shadow-2xl shadow-emerald-500/20 border border-white/10 sticky top-24"
          >
            <img 
              src={release.cover} 
              alt={release.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="flex-1 space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Disc className="text-emerald-400" size={20} />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Album Release</span>
              </div>
              <h1 className="text-7xl font-black tracking-tighter uppercase leading-none">{release.title}</h1>
              <Link 
                to={`/artists/${release.artistSlug}`}
                className="flex items-center gap-3 text-2xl font-bold text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                <User size={24} />
                {release.artistName}
              </Link>
            </div>

            <div className="flex flex-wrap gap-4">
              <button className="bg-zinc-700 hover:bg-zinc-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 shadow-xl shadow-black/20 transition-all">
                <Play size={20} fill="currentColor" />
                Play Album
              </button>
              <button className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all">
                <Heart size={20} />
              </button>
              <button className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all">
                <Share2 size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tight">Tracklist</h2>
              <div className="space-y-2">
                {release.tracks.map((track, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-600 font-black w-4">{i + 1}</span>
                      <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{track.title}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-xs text-zinc-500 font-black tracking-widest">{track.duration}</span>
                      <Play size={16} className="text-zinc-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-12 border-t border-white/5">
              <h3 className="text-sm font-black uppercase tracking-tight mb-4">About this release</h3>
              <p className="text-zinc-500 text-lg leading-relaxed">{release.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
