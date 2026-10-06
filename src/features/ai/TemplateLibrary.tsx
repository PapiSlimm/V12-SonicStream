import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Video, Edit3, Download, Search } from 'lucide-react';
import { api } from '../../api';
import { cn } from '../../utils/cn';

interface Template {
  id: string;
  name: string;
  type: 'video' | 'music';
  preview_url: string;
  config: string;
}

export const TemplateLibrary = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState<'all' | 'video' | 'music'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await api.get<Template[]>('/ai/templates');
        setTemplates(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const filtered = templates.filter(t => filter === 'all' || t.type === filter);

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Pro Templates</h2>
          <p className="text-zinc-400">Exclusive editable video and music templates for SonicPro members.</p>
        </div>

        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-white/5">
          {(['all', 'video', 'music'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all",
                filter === f ? "bg-white text-black" : "text-zinc-500 hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-zinc-900 animate-pulse rounded-[32px]" />
          ))
        ) : filtered.length > 0 ? (
          filtered.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-zinc-900/50 border border-white/5 rounded-[32px] overflow-hidden hover:border-emerald-500/20 transition-all flex flex-col"
            >
              <div className="aspect-video bg-black relative overflow-hidden">
                {template.type === 'video' ? (
                  <video src={template.preview_url} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
                    <Music size={48} className="text-emerald-400/50" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                    {template.type === 'video' ? <Video size={12} className="text-blue-400" /> : <Music size={12} className="text-emerald-400" />}
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{template.type}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-lg">{template.name}</h3>
                  <p className="text-xs text-zinc-500">Fully editable template. Includes all assets and AI layers.</p>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-3 bg-white text-black text-sm font-black rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all">
                    <Edit3 size={16} />
                    Edit
                  </button>
                  <button className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 hover:text-white transition-all">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-[48px]">
            <Search size={48} className="text-zinc-800 mx-auto" />
            <p className="text-zinc-500">No templates found for this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};
