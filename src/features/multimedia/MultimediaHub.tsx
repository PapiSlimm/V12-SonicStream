import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Maximize2, 
  Download, 
  Share2, 
  Heart, 
  Search, 
  Video, 
  Music, 
  Image as ImageIcon, 
  MoreVertical,
  X,
  Eye,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface MediaItem {
  id: string;
  title: string;
  artist: string;
  type: 'video' | 'audio' | 'image';
  thumbnail: string;
  duration?: string;
  views: string;
  likes: string;
  url: string;
  category: string;
}

const MOCK_MEDIA: MediaItem[] = [
  {
    id: '1',
    title: 'Neon Nights Live',
    artist: 'SonicStream Collective',
    type: 'video',
    thumbnail: 'https://picsum.photos/seed/video1/800/450',
    duration: '12:45',
    views: '1.2M',
    likes: '45K',
    url: '#',
    category: 'Live Performance'
  },
  {
    id: '2',
    title: 'Midnight Echoes',
    artist: 'Luna Ray',
    type: 'audio',
    thumbnail: 'https://picsum.photos/seed/audio1/800/800',
    duration: '03:42',
    views: '850K',
    likes: '12K',
    url: '#',
    category: 'Electronic'
  },
  {
    id: '3',
    title: 'Studio Session #42',
    artist: 'The Producers',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/image1/800/600',
    views: '120K',
    likes: '8K',
    url: '#',
    category: 'Behind the Scenes'
  },
  {
    id: '4',
    title: 'Future Bass Masterclass',
    artist: 'DJ Pulse',
    type: 'video',
    thumbnail: 'https://picsum.photos/seed/video2/800/450',
    duration: '45:20',
    views: '2.4M',
    likes: '120K',
    url: '#',
    category: 'Tutorial'
  },
  {
    id: '5',
    title: 'Acoustic Dreams',
    artist: 'Sarah Miles',
    type: 'audio',
    thumbnail: 'https://picsum.photos/seed/audio2/800/800',
    duration: '04:15',
    views: '420K',
    likes: '32K',
    url: '#',
    category: 'Acoustic'
  },
  {
    id: '6',
    title: 'World Tour 2025',
    artist: 'Global Beats',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/image2/800/600',
    views: '2.1M',
    likes: '450K',
    url: '#',
    category: 'Tour'
  }
];

export const MultimediaHub: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress] = useState(35);

  const filteredMedia = MOCK_MEDIA.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-12 pb-24">
      {/* Header Section - Editorial Style */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <Zap size={12} />
            Content Engine v2.0
          </div>
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
            Multimedia <span className="text-emerald-500 italic">Hub</span>
          </h2>
          <p className="text-zinc-400 max-w-xl text-lg font-medium leading-relaxed">
            Your centralized command center for all creative assets. Stream, manage, and distribute your content globally with precision.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold outline-none focus:border-emerald-500/50 transition-all min-w-[300px]"
            />
          </div>
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
            {[
              { id: 'all', label: 'All', icon: Zap },
              { id: 'video', label: 'Video', icon: Video },
              { id: 'audio', label: 'Audio', icon: Music },
              { id: 'image', label: 'Images', icon: ImageIcon }
            ].map((t) => (
              <button 
                key={t.id}
                onClick={() => setFilter(t.id as any)}
                className={cn(
                  "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  filter === t.id ? "bg-zinc-700 text-white shadow-lg shadow-black/20" : "text-zinc-500 hover:text-white"
                )}
              >
                <t.icon size={14} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Media Grid - Hardware Inspired Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredMedia.map((item, i) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedMedia(item)}
              className="group relative bg-zinc-900/50 border border-white/5 rounded-[40px] overflow-hidden cursor-pointer hover:border-emerald-500/30 transition-all"
            >
              {/* Hardware Detail: Dashed Border on Hover */}
              <div className="absolute inset-0 border-2 border-dashed border-emerald-500/0 group-hover:border-emerald-500/20 rounded-[40px] transition-all pointer-events-none" />
              
              <div className="aspect-video relative overflow-hidden bg-zinc-800">
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                
                {/* Type Indicator */}
                <div className="absolute top-6 left-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                  {item.type === 'video' ? <Video size={12} className="text-blue-400" /> :
                   item.type === 'audio' ? <Music size={12} className="text-purple-400" /> :
                   <ImageIcon size={12} className="text-emerald-400" />}
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">{item.type}</span>
                </div>

                {/* Duration */}
                {item.duration && (
                  <div className="absolute bottom-6 right-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black text-white">
                    {item.duration}
                  </div>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 scale-75 group-hover:scale-100 transition-transform duration-500">
                    <Play size={24} className="text-black fill-black ml-1" />
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{item.artist}</p>
                  </div>
                  <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Eye size={14} />
                      <span className="text-xs font-black">{item.views}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Heart size={14} />
                      <span className="text-xs font-black">{item.likes}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-emerald-400 transition-all">
                      <Share2 size={16} />
                    </button>
                    <button className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-emerald-400 transition-all">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Media Player Modal - Hardware Inspired (Recipe 3) */}
      <AnimatePresence>
        {selectedMedia && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMedia(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-6xl bg-zinc-900 border border-white/10 rounded-[48px] overflow-hidden shadow-2xl flex flex-col lg:flex-row"
            >
              {/* Player Area */}
              <div className="flex-1 bg-black relative group/player">
                <div className="aspect-video w-full h-full flex items-center justify-center overflow-hidden">
                  {selectedMedia.type === 'image' ? (
                    <img 
                      src={selectedMedia.thumbnail} 
                      alt="" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full relative">
                      <img 
                        src={selectedMedia.thumbnail} 
                        alt="" 
                        className="w-full h-full object-cover opacity-40 blur-2xl absolute inset-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full max-w-2xl aspect-video bg-zinc-800 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                          <img 
                            src={selectedMedia.thumbnail} 
                            alt="" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <button 
                              onClick={() => setIsPlaying(!isPlaying)}
                              className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 transform group-hover/player:scale-110 transition-all"
                            >
                              {isPlaying ? <Pause size={32} className="text-black fill-black" /> : <Play size={32} className="text-black fill-black ml-2" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Player Controls - Hardware Style */}
                <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <span>01:24</span>
                        <span>{selectedMedia.duration || '00:00'}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer group/progress">
                        <div 
                          className="h-full bg-emerald-500 relative group-hover/progress:bg-emerald-400 transition-all"
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl scale-0 group-hover/progress:scale-100 transition-transform" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-8">
                        <button className="text-zinc-500 hover:text-white transition-colors">
                          <SkipBack size={24} />
                        </button>
                        <button 
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-all"
                        >
                          {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
                        </button>
                        <button className="text-zinc-500 hover:text-white transition-colors">
                          <SkipForward size={24} />
                        </button>
                        <div className="flex items-center gap-4 ml-4">
                          <Volume2 size={20} className="text-zinc-500" />
                          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-2/3" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <button className="text-zinc-500 hover:text-white transition-colors">
                          <Maximize2 size={20} />
                        </button>
                        <button 
                          onClick={() => setSelectedMedia(null)}
                          className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                        >
                          <X size={24} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Sidebar */}
              <div className="w-full lg:w-96 p-10 space-y-10 bg-zinc-900 border-l border-white/5 overflow-y-auto max-h-[400px] lg:max-h-none">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    {selectedMedia.category}
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tight leading-none">{selectedMedia.title}</h2>
                  <p className="text-xl font-bold text-zinc-500 italic">{selectedMedia.artist}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Views</p>
                    <p className="text-2xl font-black text-white">{selectedMedia.views}</p>
                  </div>
                  <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Likes</p>
                    <p className="text-2xl font-black text-emerald-400">{selectedMedia.likes}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Description</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Exclusive high-definition content from the {selectedMedia.artist} archives. 
                    Experience the energy of live performance in stunning detail.
                  </p>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/5">
                  <button className="flex-1 py-4 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-600 transition-all flex items-center justify-center gap-2">
                    <Download size={14} />
                    Download
                  </button>
                  <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
