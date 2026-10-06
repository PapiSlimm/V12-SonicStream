import { useState } from 'react';
import { 
  Plus, 
  Layout, 
  Music, 
  ShoppingBag, 
  Calendar, 
  Type, 
  Image as ImageIcon, 
  Save, 
  Globe, 
  Settings,
  ChevronUp,
  ChevronDown,
  Trash2,
  Eye,
  Monitor,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { CheckoutModal } from '../../components/commerce/CheckoutModal';

import { Meta } from '../../components/SEO/Meta';

type BlockType = 'hero' | 'music' | 'gallery' | 'store' | 'events' | 'text';

interface Block {
  id: string;
  type: BlockType;
  props: any;
  styles: any;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
}

export const VisualBuilder = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pageSeo, setPageSeo] = useState({
    title: 'My Artist Site',
    description: 'Official site powered by SonicStream',
    ogImage: ''
  });
  const [showPageSeo, setShowPageSeo] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isPublishing, setIsPublishing] = useState(false);
  const [domain, setDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [showDomainSettings, setShowDomainSettings] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  // Determine active SEO (block override or page default)
  const activeBlock = blocks.find(b => b.id === activeBlockId);
  const currentTitle = activeBlock?.seoTitle || pageSeo.title;
  const currentDescription = activeBlock?.seoDescription || pageSeo.description;
  const currentOgImage = activeBlock?.ogImage || pageSeo.ogImage;

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      props: getDefaultProps(type),
      styles: { padding: '60px 0', backgroundColor: 'transparent' }
    };
    setBlocks([...blocks, newBlock]);
    setActiveBlockId(newBlock.id);
    toast.success(`Added ${type} block`);
  };

  const getDefaultProps = (type: BlockType) => {
    switch (type) {
      case 'hero': return { title: 'New Headline', subtitle: 'Add your subheadline here', cta: 'Get Started' };
      case 'music': return { title: 'Latest Releases', trackIds: [] };
      case 'store': return { title: 'Official Merch', productIds: [] };
      case 'events': return { 
        title: 'Upcoming Shows', 
        description: 'Join us for an unforgettable night of music.',
        date: '2026-07-15',
        time: '19:00',
        venue: 'The Grand Arena',
        city: 'Los Angeles',
        price: 85,
        ticketsAvailable: 500,
        artistId: 'v12-collective',
        artistName: 'V12 Collective',
        organizerId: 'v12-events',
        imageUrl: 'https://picsum.photos/seed/event/800/450',
        layout: 'grid' 
      };
      case 'text': return { content: 'Start typing your story...' };
      default: return {};
    }
  };

  const updateBlockProps = (id: string, newProps: any) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, props: { ...b.props, ...newProps } } : b));
  };

  const updateBlockSeo = (id: string, newSeo: any) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...newSeo } : b));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (activeBlockId === id) setActiveBlockId(null);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPublishing(false);
    toast.success('Site published successfully to V12 Edge!');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950 overflow-hidden">
      <Meta 
        title={`${currentTitle} | SonicStream Builder`}
        description={currentDescription}
        image={currentOgImage}
      />
      {/* Sidebar - Block Library */}
      <div className="w-72 border-r border-white/5 bg-zinc-900/50 p-6 flex flex-col gap-8">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Add Blocks</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: 'hero', icon: Layout, label: 'Hero' },
              { type: 'text', icon: Type, label: 'Text' },
              { type: 'music', icon: Music, label: 'Music' },
              { type: 'store', icon: ShoppingBag, label: 'Store' },
              { type: 'events', icon: Calendar, label: 'Events' },
              { type: 'gallery', icon: ImageIcon, label: 'Gallery' },
            ].map(item => (
              <button
                key={item.type}
                onClick={() => addBlock(item.type as BlockType)}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-2xl transition-all group"
              >
                <item.icon size={20} className="text-zinc-400 group-hover:text-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-500 group-hover:text-emerald-400 uppercase">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-black/20 transition-all"
          >
            {isPublishing ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Globe size={16} />
            )}
            Publish Site
          </button>
          <p className="text-[8px] text-center text-zinc-600 font-bold uppercase tracking-widest">
            V12 Multimedia Rendering Engine
          </p>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Canvas Toolbar */}
        <div className="h-16 border-b border-white/5 bg-zinc-900/30 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setViewMode('desktop')}
                className={cn("p-2 rounded-lg transition-all", viewMode === 'desktop' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}
              >
                <Monitor size={16} />
              </button>
              <button 
                onClick={() => setViewMode('mobile')}
                className={cn("p-2 rounded-lg transition-all", viewMode === 'mobile' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}
              >
                <Smartphone size={16} />
              </button>
            </div>
            <span className="text-xs font-bold text-zinc-500">artist.sonicstream.com/v12-preview</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-zinc-400 hover:text-white transition-colors"><Eye size={20} /></button>
            <button 
              onClick={() => setShowPageSeo(true)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              title="Page SEO"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={() => setShowDomainSettings(true)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              title="Domain Settings"
            >
              <Globe size={20} />
            </button>
            <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
              <Save size={16} />
              Save Draft
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-zinc-950/50 scrollbar-hide">
          <div className={cn(
            "mx-auto bg-zinc-900 border border-white/5 shadow-2xl transition-all duration-500 min-h-[800px]",
            viewMode === 'desktop' ? "w-full max-w-5xl rounded-[40px]" : "w-[375px] rounded-[60px] border-[12px] border-zinc-800"
          )}>
            <div className="p-8 space-y-4">
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
                    <Plus size={32} />
                  </div>
                  <p className="text-zinc-500 font-medium">Your canvas is empty. Add a block to start building.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blocks.map((block, index) => (
                    <div 
                      key={block.id}
                      onClick={() => setActiveBlockId(block.id)}
                      className={cn(
                        "relative group rounded-3xl border transition-all",
                        activeBlockId === block.id ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-white/5 hover:border-white/10"
                      )}
                    >
                      {/* Block Controls */}
                      <div className="absolute -right-12 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveBlock(index, 'up')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400"><ChevronUp size={16} /></button>
                        <button onClick={() => moveBlock(index, 'down')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400"><ChevronDown size={16} /></button>
                        <button onClick={() => removeBlock(block.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400"><Trash2 size={16} /></button>
                      </div>

                      {/* Block Content Renderer */}
                      <div className="p-12 text-center" style={block.styles}>
                        {block.type === 'hero' && (
                          <div className="space-y-4">
                            <h1 className="text-4xl font-black text-white">{block.props.title}</h1>
                            <p className="text-zinc-400">{block.props.subtitle}</p>
                            <button className="bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold">{block.props.cta}</button>
                          </div>
                        )}
                        {block.type === 'text' && (
                          <p className="text-zinc-300 leading-relaxed">{block.props.content}</p>
                        )}
                        {block.type === 'music' && (
                          <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">{block.props.title}</h2>
                            <div className="grid grid-cols-2 gap-4">
                              {[1, 2].map(i => (
                                <div key={i} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                                  <div className="w-12 h-12 bg-zinc-800 rounded-lg" />
                                  <div className="text-left">
                                    <div className="text-sm font-bold text-white">Track Name</div>
                                    <div className="text-xs text-zinc-500">Artist Name</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {block.type === 'events' && (
                          <div className="space-y-6 text-left">
                            <h2 className="text-2xl font-bold text-white text-center">{block.props.title}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="text-xs font-black text-emerald-400 uppercase tracking-widest">{block.props.date}</div>
                                  <div className="text-xs font-bold text-white">${block.props.price}</div>
                                </div>
                                <h3 className="text-lg font-bold text-white">{block.props.title}</h3>
                                <div className="text-xs text-zinc-500">{block.props.venue}, {block.props.city}</div>
                                <button className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        {block.type === 'store' && (
                          <div className="space-y-6 text-left">
                            <h2 className="text-2xl font-bold text-white text-center">{block.props.title}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden group/item">
                                  <div className="aspect-square bg-zinc-800" />
                                  <div className="p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                      <h3 className="text-sm font-bold text-white">V12 Limited Print</h3>
                                      <span className="text-xs font-black text-emerald-400">$24.99</span>
                                    </div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCart([...cart, { name: 'V12 Limited Print', price: 24.99 }]);
                                        toast.success('Added to cart');
                                      }}
                                      className="w-full bg-zinc-700 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/item:opacity-100 transition-all"
                                    >
                                      Add to Cart
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Add more renderers as needed */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      <div className="w-80 border-l border-white/5 bg-zinc-900/50 p-6 overflow-y-auto">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">Properties</h3>
        {activeBlockId ? (
          <div className="space-y-6">
            {(() => {
              const activeBlock = blocks.find(b => b.id === activeBlockId);
              if (!activeBlock) return null;

              return (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Block Type</label>
                    <div className="px-4 py-2 bg-white/5 rounded-xl text-white text-sm font-bold capitalize">
                      {activeBlock.type}
                    </div>
                  </div>

                  {/* Dynamic Property Inputs */}
                  <div className="space-y-4">
                    {Object.entries(activeBlock.props).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</label>
                        {typeof value === 'string' && key !== 'content' ? (
                          <input 
                            type="text" 
                            value={value}
                            onChange={(e) => updateBlockProps(activeBlock.id, { [key]: e.target.value })}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                          />
                        ) : typeof value === 'number' ? (
                          <input 
                            type="number" 
                            value={value}
                            onChange={(e) => updateBlockProps(activeBlock.id, { [key]: parseFloat(e.target.value) })}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                          />
                        ) : key === 'content' ? (
                          <textarea 
                            value={value as string}
                            onChange={(e) => updateBlockProps(activeBlock.id, { [key]: e.target.value })}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 h-32 resize-none"
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {/* Block SEO Section */}
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Block SEO</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Meta Title</label>
                          <input 
                            type="text" 
                            value={activeBlock.seoTitle || ''}
                            onChange={(e) => updateBlockSeo(activeBlock.id, { seoTitle: e.target.value })}
                            placeholder="Override page title..."
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Meta Description</label>
                          <textarea 
                            value={activeBlock.seoDescription || ''}
                            onChange={(e) => updateBlockSeo(activeBlock.id, { seoDescription: e.target.value })}
                            placeholder="Override page description..."
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 h-20 resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">OG Image</label>
                          <input 
                            type="text" 
                            value={activeBlock.ogImage || ''}
                            onChange={(e) => updateBlockSeo(activeBlock.id, { ogImage: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                      </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-zinc-600">
            <Settings size={32} className="mb-2 opacity-20" />
            <p className="text-xs font-medium">Select a block to edit its properties</p>
          </div>
        )}
      </div>

      {/* Page SEO Settings Modal */}
      {showPageSeo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-white/10 rounded-[40px] w-full max-w-lg p-12 space-y-8 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">Page SEO Settings</h2>
              <p className="text-zinc-500 text-sm">Configure how your site appears in search results and social media.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Page Title</label>
                <input 
                  type="text" 
                  value={pageSeo.title}
                  onChange={(e) => setPageSeo({...pageSeo, title: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Meta Description</label>
                <textarea 
                  value={pageSeo.description}
                  onChange={(e) => setPageSeo({...pageSeo, description: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 h-32 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">OG Image URL</label>
                <input 
                  type="text" 
                  value={pageSeo.ogImage}
                  onChange={(e) => setPageSeo({...pageSeo, ogImage: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setShowPageSeo(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain Settings Modal */}
      {showDomainSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-white/10 rounded-[40px] w-full max-w-lg p-12 space-y-8 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">Domain Settings</h2>
              <p className="text-zinc-500 text-sm">Connect your custom domain or set up a SonicStream subdomain.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subdomain</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="artist-name"
                    className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  <div className="flex items-center px-4 bg-white/5 rounded-2xl text-zinc-500 font-bold text-sm">
                    .sonicstream.com
                  </div>
                </div>
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-zinc-600"><span className="bg-zinc-900 px-4">OR</span></div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Custom Domain</label>
                <input 
                  type="text" 
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="www.yourname.com"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50"
                />
                <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Point your A record to 76.76.21.21
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setShowDomainSettings(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  toast.success('Domain settings saved!');
                  setShowDomainSettings(false);
                }}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={showCheckout} 
        onClose={() => setShowCheckout(false)} 
        items={cart} 
      />

      {/* Cart Floating Button */}
      {cart.length > 0 && (
        <button 
          onClick={() => setShowCheckout(true)}
          className="fixed bottom-8 right-8 bg-zinc-700 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-black/40 z-50 animate-bounce"
        >
          <ShoppingBag size={18} />
          Checkout ({cart.length})
        </button>
      )}
    </div>
  );
};
