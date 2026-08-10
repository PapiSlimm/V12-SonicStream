import { motion } from 'framer-motion';
import { ExternalLink, Globe, Info } from 'lucide-react';

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface GroundedSearchResultsProps {
  text: string;
  chunks?: GroundingChunk[];
}

export const GroundedSearchResults = ({ text, chunks }: GroundedSearchResultsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-emerald-500/20 rounded-[40px] p-8 space-y-6"
    >
      <div className="flex items-center gap-3 text-emerald-400">
        <Globe size={20} />
        <span className="text-xs font-bold uppercase tracking-widest">Grounded Search Result</span>
      </div>

      <div className="prose prose-invert max-w-none">
        <p className="text-zinc-300 leading-relaxed text-lg">
          {text}
        </p>
      </div>

      {chunks && chunks.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 text-zinc-500">
            <Info size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Sources & References</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {chunks.map((chunk, i) => chunk.web && (
              <a
                key={i}
                href={chunk.web.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {chunk.web.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">{new URL(chunk.web.uri).hostname}</p>
                </div>
                <ExternalLink size={14} className="text-zinc-600 group-hover:text-emerald-400 transition-colors shrink-0 ml-4" />
              </a>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
