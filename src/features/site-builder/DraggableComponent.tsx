import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Settings, Music, Video, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DraggableComponentProps {
  id: string;
  type: string;
  content: any;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({ id, type, content, onDelete, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const renderPreview = () => {
    switch (type) {
      case 'hero':
        return (
          <div className="p-12 bg-zinc-800/50 rounded-3xl border border-white/5 space-y-4 text-center">
            <h2 className="text-4xl font-black uppercase tracking-tight">{content.title || 'Hero Title'}</h2>
            <p className="text-zinc-400">{content.subtitle || 'Hero Subtitle'}</p>
          </div>
        );
      case 'music':
        return (
          <div className="p-8 bg-zinc-800/50 rounded-3xl border border-white/5 flex items-center gap-6">
            <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center">
              <Music size={32} className="text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Music Player</h3>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-black">Syncs with your catalog</p>
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="aspect-video bg-zinc-800/50 rounded-3xl border border-white/5 flex items-center justify-center group">
            <Video size={48} className="text-zinc-700 group-hover:text-white transition-colors" />
          </div>
        );
      case 'gallery':
        return (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-zinc-800/50 rounded-2xl border border-white/5 flex items-center justify-center">
                <ImageIcon size={24} className="text-zinc-700" />
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="p-6 bg-zinc-800/50 rounded-2xl border border-white/5 italic text-zinc-500">
            Unknown component type: {type}
          </div>
        );
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group relative bg-zinc-900/50 border border-white/5 rounded-[40px] p-2 transition-all",
        isDragging ? "opacity-50 scale-95 shadow-2xl ring-2 ring-emerald-500/50" : "hover:border-white/10"
      )}
    >
      {/* Toolbar */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900 border border-white/10 p-1.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all z-20 shadow-2xl">
        <button 
          {...attributes} 
          {...listeners}
          className="p-2 text-zinc-500 hover:text-white cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
        <div className="w-px h-4 bg-white/10" />
        <button 
          onClick={() => onEdit(id)}
          className="p-2 text-zinc-500 hover:text-blue-400 transition-colors"
        >
          <Settings size={16} />
        </button>
        <button 
          onClick={() => onDelete(id)}
          className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="p-4">
        {renderPreview()}
      </div>
    </div>
  );
};
