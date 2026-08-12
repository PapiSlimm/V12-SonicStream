/**
 * Template Gallery — 45 starting concepts (20 Modern Styles + 25 3D Motion).
 *
 * Loading a template turns it into ordinary canvas blocks. Everything —
 * palette, copy, animation, layout — stays editable and deletable; templates
 * exist to unlock creative momentum, never to constrain it.
 */
import { useMemo, useState } from 'react';
import { X, LayoutTemplate, Boxes } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import { TEMPLATES, TEMPLATES_3D, type Template } from './templates';
import type { BuilderBlock } from './agent-ops';

interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
  hasBlocks: boolean;
  onLoad: (blocks: BuilderBlock[]) => void;
}

const newId = () => Math.random().toString(36).slice(2, 11);

export const TemplateGallery = ({ open, onClose, hasBlocks, onLoad }: TemplateGalleryProps) => {
  const [collection, setCollection] = useState<'modern' | '3d'>('modern');
  const list = useMemo(() => (collection === 'modern' ? TEMPLATES : TEMPLATES_3D), [collection]);

  if (!open) return null;

  const load = (t: Template) => {
    if (hasBlocks && !window.confirm(`Load "${t.name}"? Your current blocks will be replaced (save a draft first if you want to keep them).`)) {
      return;
    }
    onLoad(t.blocks.map((b) => ({
      id: newId(),
      type: b.type,
      props: { ...b.props },
      styles: { ...(b.styles ?? { padding: '60px 0', backgroundColor: 'transparent' }) },
    })));
    toast.success(`"${t.name}" loaded — every block is yours to edit`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[85vh] flex flex-col bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div>
            <h2 className="text-lg font-black text-white">Start with a concept</h2>
            <p className="text-[11px] text-zinc-500">45 templates. All of them fully editable after loading — nothing is locked.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              <button onClick={() => setCollection('modern')}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                  collection === 'modern' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300')}>
                <LayoutTemplate size={12} /> Modern ({TEMPLATES.length})
              </button>
              <button onClick={() => setCollection('3d')}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                  collection === '3d' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300')}>
                <Boxes size={12} /> 3D Motion ({TEMPLATES_3D.length})
              </button>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((t) => (
            <button key={t.id} onClick={() => load(t)}
              className="group text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-violet-500/40 rounded-2xl overflow-hidden transition-all">
              <div className="h-24 w-full relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${t.palette.bg} 0%, ${t.palette.surface} 55%, ${t.palette.accent} 160%)` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black tracking-wide" style={{ color: t.palette.text }}>{t.name}</span>
                </div>
                <div className="absolute bottom-2 right-2 flex gap-1">
                  {[t.palette.bg, t.palette.surface, t.palette.accent].map((cHex, i) => (
                    <span key={i} className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: cHex }} />
                  ))}
                </div>
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{t.name}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">{t.blocks.length} blocks</span>
                </div>
                <div className="text-[10px] font-bold text-zinc-400">{t.style}</div>
                <p className="text-[10px] text-zinc-600 leading-snug line-clamp-2">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
