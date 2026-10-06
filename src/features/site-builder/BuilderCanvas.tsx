import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableComponent } from './DraggableComponent';
import { 
  Plus, 
  Save, 
  Eye, 
  Smartphone, 
  Monitor, 
  Layout, 
  Type, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Share2, 
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

interface ComponentData {
  id: string;
  type: 'hero' | 'music' | 'video' | 'gallery' | 'about' | 'contact';
  content: any;
}

export const BuilderCanvas: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [components, setComponents] = useState<ComponentData[]>([
    { id: '1', type: 'hero', content: { title: 'New Artist Site', subtitle: 'Coming Soon' } },
    { id: '2', type: 'music', content: {} },
    { id: '3', type: 'video', content: {} }
  ]);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addComponent = (type: ComponentData['type']) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setComponents([...components, { id: newId, type, content: {} }]);
    setShowComponentLibrary(false);
    toast.success(`Added ${type} component`);
  };

  const deleteComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
    toast.success('Component removed');
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast.success('Site configuration saved!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Navigation */}
      <header className="h-20 bg-zinc-900 border-b border-white/5 px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onExit}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-8 w-px bg-white/5" />
          <div className="space-y-0.5">
            <h2 className="text-lg font-black uppercase tracking-tight">Site Builder</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Editing: My Artist Site</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mr-4">
            <button 
              onClick={() => setViewMode('desktop')}
              className={cn(
                "p-3 rounded-xl transition-all",
                viewMode === 'desktop' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              <Monitor size={18} />
            </button>
            <button 
              onClick={() => setViewMode('mobile')}
              className={cn(
                "p-3 rounded-xl transition-all",
                viewMode === 'mobile' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              <Smartphone size={18} />
            </button>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold text-zinc-400 hover:text-white transition-all">
            <Eye size={18} />
            Preview
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-zinc-700 text-white rounded-2xl text-sm font-black hover:bg-zinc-600 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-80 bg-zinc-900 border-r border-white/5 p-8 space-y-12 overflow-y-auto">
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Page Structure</h3>
            <div className="space-y-2">
              {components.map((comp, i) => (
                <div key={comp.id} className="flex items-center gap-3 p-4 bg-black/40 rounded-2xl border border-white/5 text-sm font-bold text-zinc-400">
                  <span className="text-[10px] font-black text-zinc-600 w-4">{i + 1}</span>
                  <div className="flex-1 flex items-center gap-3">
                    {comp.type === 'hero' ? <Layout size={14} /> :
                     comp.type === 'music' ? <Music size={14} /> :
                     comp.type === 'video' ? <Video size={14} /> :
                     <ImageIcon size={14} />}
                    <span className="capitalize">{comp.type}</span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowComponentLibrary(true)}
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 rounded-2xl text-sm font-bold text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Component
            </button>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Global Styles</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Primary Color</label>
                <div className="flex gap-2">
                  {['#c81e3a', '#8b5cf6', '#3b82f6', '#f43f5e', '#f59e0b'].map(color => (
                    <button 
                      key={color}
                      className="w-8 h-8 rounded-full border border-white/10 transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Typography</label>
                <select className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-500">
                  <option>Inter (Sans)</option>
                  <option>Space Grotesk</option>
                  <option>Playfair Display</option>
                  <option>JetBrains Mono</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 bg-zinc-950 overflow-y-auto p-12 flex justify-center">
          <div className={cn(
            "bg-black shadow-2xl transition-all duration-500 overflow-hidden",
            viewMode === 'desktop' ? "w-full max-w-5xl rounded-[48px]" : "w-[375px] rounded-[60px] border-[12px] border-zinc-900"
          )}>
            <div className="min-h-full p-8 space-y-8">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={components.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {components.map((comp) => (
                    <DraggableComponent 
                      key={comp.id} 
                      id={comp.id} 
                      type={comp.type} 
                      content={comp.content}
                      onDelete={deleteComponent}
                      onEdit={(id) => toast.success(`Editing ${id}`)}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {components.length === 0 && (
                <div className="h-96 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
                    <Layout size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white">Your Canvas is Empty</h3>
                    <p className="text-zinc-500 max-w-xs">Start building your site by adding components from the library.</p>
                  </div>
                  <button 
                    onClick={() => setShowComponentLibrary(true)}
                    className="px-8 py-4 bg-zinc-700 text-white rounded-2xl font-black hover:bg-zinc-600 transition-all"
                  >
                    Open Library
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Component Library Modal */}
      <AnimatePresence>
        {showComponentLibrary && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComponentLibrary(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-zinc-900 rounded-[48px] overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="p-12 space-y-12">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black uppercase tracking-tight">Component Library</h2>
                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Select a block to add to your page</p>
                  </div>
                  <button 
                    onClick={() => setShowComponentLibrary(false)}
                    className="p-4 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all"
                  >
                    <Plus size={24} className="rotate-45" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { type: 'hero', icon: Layout, label: 'Hero Section', desc: 'Big title and call to action' },
                    { type: 'music', icon: Music, label: 'Music Player', desc: 'Showcase your latest tracks' },
                    { type: 'video', icon: Video, label: 'Video Player', desc: 'Embed external video content' },
                    { type: 'gallery', icon: ImageIcon, label: 'Image Gallery', desc: 'Grid of photos and artwork' },
                    { type: 'about', icon: Type, label: 'About Text', desc: 'Rich text area for your bio' },
                    { type: 'contact', icon: Share2, label: 'Social Links', desc: 'Connect your social profiles' },
                  ].map((item) => (
                    <button 
                      key={item.type}
                      onClick={() => addComponent(item.type as any)}
                      className="p-8 bg-black/40 border border-white/5 rounded-[32px] text-left space-y-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                    >
                      <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 transition-colors">
                        <item.icon size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-white uppercase tracking-tight">{item.label}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed font-bold">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
