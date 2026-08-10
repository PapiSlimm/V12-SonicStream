import { motion } from 'framer-motion';
import { Play, Box } from 'lucide-react';

export const AnimationShowcase = () => {
  // 10 user-friendly videos (placeholders)
  const videos = Array.from({ length: 10 }).map((_, i) => ({
    id: `v-${i}`,
    title: `AI Motion Sample ${i + 1}`,
    url: `https://cdn.pixabay.com/video/2023/10/20/185834-876356832_tiny.mp4`, // Placeholder
    thumbnail: `https://picsum.photos/seed/vid-${i}/400/225`
  }));

  // 20 elements displaying animation samples
  const elements = Array.from({ length: 20 }).map((_, i) => ({
    id: `e-${i}`,
    title: `Product Animation ${i + 1}`,
    type: ['Float', 'Pulse', 'Spin', 'Bounce', 'Glow'][i % 5],
    color: ['from-emerald-500', 'from-blue-500', 'from-purple-500', 'from-orange-500', 'from-pink-500'][i % 5]
  }));

  return (
    <div className="space-y-16">
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-white">AI Video Showcase</h2>
          <span className="px-4 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
            10 Samples
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {videos.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative aspect-video bg-zinc-800 rounded-2xl overflow-hidden cursor-pointer"
            >
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-all" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-all">
                  <Play size={24} className="text-white fill-white" />
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-xs font-bold text-white">{video.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-white">Product Animation Elements</h2>
          <span className="px-4 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20">
            20 Elements
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {elements.map((el, i) => (
            <motion.div
              key={el.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex flex-col items-center text-center space-y-4 hover:border-white/10 transition-all"
            >
              <motion.div
                animate={
                  el.type === 'Float' ? { y: [0, -10, 0] } :
                  el.type === 'Pulse' ? { scale: [1, 1.1, 1] } :
                  el.type === 'Spin' ? { rotate: 360 } :
                  el.type === 'Bounce' ? { y: [0, -15, 0] } :
                  { opacity: [0.5, 1, 0.5] }
                }
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${el.color} to-transparent flex items-center justify-center shadow-lg shadow-black/40`}
              >
                <Box size={32} className="text-white" />
              </motion.div>
              <div>
                <p className="text-sm font-bold text-white">{el.title}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{el.type} Animation</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
