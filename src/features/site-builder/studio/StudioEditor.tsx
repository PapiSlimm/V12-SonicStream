/**
 * Site Studio — SonicStream's Framer-class visual site editor (2026-09-22).
 *
 * Implements the WEB_BUILDER blueprint client-side:
 *   • Canvas rendering the live node tree; click-select, drag-reorder using
 *     the midpoint insertion-index algorithm, drop-from-palette.
 *   • Breakpoint manager (Desktop / Tablet / Mobile) — base styles inherit
 *     down; edits on smaller viewports write overrides only.
 *   • Property panel with Basic / Advanced tabs, interactive state layers
 *     (Hover / Pressed) and 3D transform knobs (rotate X/Y/Z, depth,
 *     perspective) that compile to hardware-accelerated CSS.
 *   • Undo/redo on the snapshot-pair pattern (drags commit once, on release).
 *   • CMS panel: collections + items, bound to the canvas via {{item.field}}
 *     and repeat lists.
 *   • Sandboxed live preview: server-compiled document rendered in an iframe
 *     with sandbox="allow-scripts" only (never allow-same-origin).
 *   • Save (auto-revisioned server-side) and one-click Publish to a live
 *     public URL under /sites/<subdomain>.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Monitor, Tablet, Smartphone, Undo2, Redo2, Save, Rocket, Eye, EyeOff,
  Trash2, Copy, Plus, Layers, Database, ChevronLeft, MousePointer2, Box, X,
} from 'lucide-react';
import {
  StudioNode, PageDoc, Breakpoint, StateLayer, PALETTE, genId,
  findNode, findParent, updateNode, removeNode, insertChild, cloneWithIds,
  calculateInsertionIndex, usePageHistory,
} from './studioCore';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});
const api = async (path: string, init?: RequestInit) => {
  const res = await fetch(`/api/site-builder${path}`, { headers: authHeaders(), ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  return data;
};

const BP_WIDTH: Record<Breakpoint, string> = { base: '100%', tablet: '834px', mobile: '390px' };

/* ── canvas node renderer (design-time wrapper) ───────────────────────── */

const NodeView: React.FC<{
  node: StudioNode;
  bp: Breakpoint;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropInto: (parentId: string, index: number, payload: { paletteType?: string; moveId?: string }) => void;
  onDragNode: (id: string) => void;
}> = ({ node, bp, selectedId, onSelect, onDropInto, onDragNode }) => {
  const [dropHint, setDropHint] = useState(false);
  const style: React.CSSProperties = useMemo(() => {
    const s = node.styles || {};
    const merged: Record<string, string> = { ...(s.base || {}) };
    if (bp !== 'base') Object.assign(merged, bp === 'mobile' ? { ...(s.tablet || {}), ...(s.mobile || {}) } : (s.tablet || {}));
    return merged as React.CSSProperties;
  }, [node.styles, bp]);

  const isContainer = ['page', 'section', 'div', 'nav', 'form', 'list'].includes(node.type);
  const selected = selectedId === node.id;
  const p = node.props || {};

  const common = {
    'data-node-id': node.id,
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); onSelect(node.id); },
    draggable: node.id !== 'root',
    onDragStart: (e: React.DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.setData('application/x-move-node', node.id);
      onDragNode(node.id);
    },
    style: {
      ...style,
      outline: selected ? '2px solid #0d9488' : dropHint ? '2px dashed #8a5cf6' : '1px dashed rgba(139,144,165,0.18)',
      outlineOffset: '-1px',
      cursor: 'pointer',
      position: 'relative' as const,
      minHeight: isContainer && !(node.children?.length) ? 56 : undefined,
    },
  };

  const containerDnD = isContainer ? {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDropHint(true); },
    onDragLeave: () => setDropHint(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation(); setDropHint(false);
      const flexDir = (style.flexDirection as 'row' | 'column') || 'column';
      const index = calculateInsertionIndex(e.currentTarget as HTMLElement, { x: e.clientX, y: e.clientY }, flexDir);
      const paletteType = e.dataTransfer.getData('application/x-palette');
      const moveId = e.dataTransfer.getData('application/x-move-node');
      onDropInto(node.id, index, { paletteType: paletteType || undefined, moveId: moveId || undefined });
    },
  } : {};

  const kids = (node.children || []).map((c) => (
    <NodeView key={c.id} node={c} bp={bp} selectedId={selectedId} onSelect={onSelect} onDropInto={onDropInto} onDragNode={onDragNode} />
  ));

  switch (node.type) {
    case 'page':
    case 'section': return <section {...common} {...containerDnD}>{kids}</section>;
    case 'div':
    case 'list':    return <div {...common} {...containerDnD}>{kids}</div>;
    case 'nav':     return <nav {...common} {...containerDnD}>{kids}</nav>;
    case 'form':    return <form {...common} {...containerDnD} onSubmit={(e) => e.preventDefault()}>{kids}</form>;
    case 'heading': {
      const Tag = (`h${Math.min(3, Math.max(1, p.level || 2))}`) as 'h1' | 'h2' | 'h3';
      return <Tag {...common} style={{ ...common.style, margin: 0 }}>{p.text}</Tag>;
    }
    case 'text':    return <p {...common} style={{ ...common.style, margin: 0 }}>{p.text}</p>;
    case 'button':  return <button {...common} type="button">{p.text}</button>;
    case 'link':    return <a {...common} onClickCapture={(e) => e.preventDefault()}>{p.text}</a>;
    case 'image':   return <img {...common} src={p.src} alt={p.alt || ''} />;
    case 'video':   return <div {...common} style={{ ...common.style, background: '#12141f', display: 'grid', placeItems: 'center', minHeight: 160, color: '#8b90a5' }}>▶ video{p.src ? '' : ' (set source →)'}</div>;
    case 'input':   return <input {...common} placeholder={p.placeholder} readOnly />;
    case 'textarea':return <textarea {...common} placeholder={p.placeholder} readOnly />;
    case 'spacer':  return <div {...common} />;
    default:        return <div {...common}>{node.type}</div>;
  }
};

/* ── property panel field helpers ─────────────────────────────────────── */

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-[11px] uppercase tracking-wide text-gray-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);
const TextInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
  <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
    className="w-full bg-[#12141f] border border-[#252a3d] rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 outline-none" />
);
const Knob: React.FC<{ label: string; value: number; min: number; max: number; onChange: (v: number) => void; onCommit: () => void; unit?: string }> =
  ({ label, value, min, max, onChange, onCommit, unit = '°' }) => (
    <div>
      <div className="flex justify-between text-[11px] text-gray-500"><span>{label}</span><span className="text-gray-300">{value}{unit}</span></div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))} onMouseUp={onCommit} onTouchEnd={onCommit}
        className="w-full accent-teal-500" />
    </div>
  );

function parse3d(transform: string | undefined) {
  const g = (re: RegExp) => Number((transform || '').match(re)?.[1] || 0);
  return { rx: g(/rotateX\((-?\d+(?:\.\d+)?)deg\)/), ry: g(/rotateY\((-?\d+(?:\.\d+)?)deg\)/), rz: g(/rotateZ\((-?\d+(?:\.\d+)?)deg\)/), tz: g(/translateZ\((-?\d+(?:\.\d+)?)px\)/) };
}
const make3d = (v: { rx: number; ry: number; rz: number; tz: number }) =>
  (v.rx || v.ry || v.rz || v.tz) ? `translateZ(${v.tz}px) rotateX(${v.rx}deg) rotateY(${v.ry}deg) rotateZ(${v.rz}deg)` : '';

/* ── the studio ───────────────────────────────────────────────────────── */

export const StudioEditor: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const [sites, setSites] = useState<any[]>([]);
  const [site, setSite] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [pageId, setPageId] = useState<number | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubdomain, setNewSubdomain] = useState('');

  const history = usePageHistory({ tree: { id: 'root', type: 'page', children: [] } });
  const { doc, edit, update, commit, undo, redo, canUndo, canRedo, reset } = history;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bp, setBp] = useState<Breakpoint>('base');
  const [stateLayer, setStateLayer] = useState<StateLayer>('base');
  const [tab, setTab] = useState<'basic' | 'advanced'>('basic');
  const [leftTab, setLeftTab] = useState<'elements' | 'layers' | 'cms'>('elements');
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dragNodeId = useRef<string | null>(null);

  const selected = selectedId ? findNode(doc.tree, selectedId) : null;
  const layer: StateLayer = stateLayer === 'base' ? bp : stateLayer;

  /* ── bootstrap ── */
  useEffect(() => { (async () => {
    try {
      const s = await api('/sites');
      setSites(s);
      if (s.length) await openSite(s[0]);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  })(); }, []); // eslint-disable-line

  const openSite = async (s: any) => {
    setSite(s);
    const [pgs, cols] = await Promise.all([api(`/sites/${s.id}/pages`), api(`/sites/${s.id}/collections`)]);
    setPages(pgs); setCollections(cols);
    if (pgs.length) await openPage(pgs[0].id);
  };
  const openPage = async (id: number) => {
    const page = await api(`/pages/${id}`);
    setPageId(id);
    const lt = page.layoutTree && page.layoutTree.tree ? page.layoutTree : { tree: { id: 'root', type: 'page', children: [] } };
    reset(lt); setSelectedId(null);
  };

  const createSite = async () => {
    if (!newSubdomain.trim()) return toast.error('Pick a site address first');
    try {
      const r = await api('/sites', { method: 'POST', body: JSON.stringify({ subdomain: newSubdomain, siteTitle: newSubdomain }) });
      toast.success('Site created');
      const s = await api('/sites'); setSites(s);
      await openSite(s.find((x: any) => x.id === r.id) || s[0]);
    } catch (e: any) { toast.error(e.message); }
  };

  /* ── canvas ops ── */
  const handleDropInto = useCallback((parentId: string, index: number, payload: { paletteType?: string; moveId?: string }) => {
    if (payload.moveId) {
      const moving = findNode(doc.tree, payload.moveId);
      if (!moving || payload.moveId === parentId || findNode(moving, parentId)) return; // no-op / no self-nesting
      edit((d) => {
        let tree = removeNode(d.tree, payload.moveId!);
        tree = insertChild(tree, parentId, moving, index);
        return { ...d, tree };
      });
    } else if (payload.paletteType) {
      const item = PALETTE.find((pi) => pi.type === payload.paletteType);
      if (!item) return;
      const node = item.make();
      edit((d) => ({ ...d, tree: insertChild(d.tree, parentId, node, index) }));
      setSelectedId(node.id);
    }
    dragNodeId.current = null;
  }, [doc.tree, edit]);

  const setProp = (key: string, value: any) => {
    if (!selectedId) return;
    update((d) => ({ ...d, tree: updateNode(d.tree, selectedId, (n) => ({ ...n, props: { ...n.props, [key]: value } })) }));
  };
  const setStyle = (key: string, value: string, discrete = false) => {
    if (!selectedId) return;
    const apply = (d: PageDoc): PageDoc => ({
      ...d,
      tree: updateNode(d.tree, selectedId, (n) => {
        const styles = { ...(n.styles || {}) };
        const layerMap = { ...(styles[layer] || {}) };
        if (value === '') delete layerMap[key]; else layerMap[key] = value;
        styles[layer] = layerMap;
        return { ...n, styles };
      }),
    });
    discrete ? edit(apply) : update(apply);
  };
  const styleVal = (key: string): string => {
    const s = selected?.styles || {};
    return String((s[layer] || {})[key] ?? (layer !== 'base' ? (s.base || {})[key] ?? '' : ''));
  };

  const deleteSelected = () => {
    if (!selectedId || selectedId === 'root') return;
    edit((d) => ({ ...d, tree: removeNode(d.tree, selectedId) }));
    setSelectedId(null);
  };
  const duplicateSelected = () => {
    if (!selectedId || selectedId === 'root') return;
    const parent = findParent(doc.tree, selectedId);
    const node = findNode(doc.tree, selectedId);
    if (!parent || !node) return;
    const idx = (parent.children || []).findIndex((c) => c.id === selectedId);
    const copy = cloneWithIds(node);
    edit((d) => ({ ...d, tree: insertChild(d.tree, parent.id, copy, idx + 1) }));
    setSelectedId(copy.id);
  };

  /* keyboard: undo/redo/delete */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const inField = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !inField) { e.preventDefault(); deleteSelected(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  /* ── save / preview / publish ── */
  const save = async (silent = false) => {
    if (!pageId) return;
    setSaving(true);
    try {
      await api(`/pages/${pageId}`, { method: 'PATCH', body: JSON.stringify({ layoutTree: doc, title: doc.title, metaDescription: doc.metaDescription }) });
      if (!silent) toast.success('Saved — revision kept');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  const showPreview = async () => {
    if (!pageId) return;
    try {
      const r = await api(`/pages/${pageId}/preview`, { method: 'POST', body: JSON.stringify({ layoutTree: doc }) });
      if (r.errors?.length) toast.error(r.errors[0]);
      setPreview(r.html);
    } catch (e: any) { toast.error(e.message); }
  };
  const publish = async () => {
    if (!pageId || !site) return;
    await save(true);
    try {
      const r = await api(`/sites/${site.id}/publish`, { method: 'POST' });
      if (r.success) toast.success(`Live at ${window.location.origin}${r.liveUrl}`);
      else toast.error(r.failures?.[0]?.errors?.[0] || 'Publish failed');
      setPages(await api(`/sites/${site.id}/pages`));
    } catch (e: any) { toast.error(e.message); }
  };

  /* ── CMS ops ── */
  const addCollection = async () => {
    const name = prompt('Collection name (e.g. Shows, Releases, Posts):');
    if (!name || !site) return;
    const fieldsRaw = prompt('Fields, comma-separated:', 'title, text, date') || 'title, text';
    const fields = fieldsRaw.split(',').map((f) => f.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')).filter(Boolean);
    try {
      await api(`/sites/${site.id}/collections`, { method: 'POST', body: JSON.stringify({ name, slug: name, fields }) });
      setCollections(await api(`/sites/${site.id}/collections`));
      toast.success('Collection created');
    } catch (e: any) { toast.error(e.message); }
  };
  const addItem = async (col: any) => {
    const fields: Record<string, string> = {};
    for (const f of col.fields || ['title', 'text']) {
      const v = prompt(`${col.name} — ${f}:`) ?? '';
      fields[f] = v;
    }
    try {
      await api(`/collections/${col.id}/items`, { method: 'POST', body: JSON.stringify({ fields }) });
      setCollections(await api(`/sites/${site.id}/collections`));
      toast.success('Item added');
    } catch (e: any) { toast.error(e.message); }
  };

  /* ── layers tree ── */
  const LayerRow: React.FC<{ n: StudioNode; depth: number }> = ({ n, depth }) => (
    <>
      <button onClick={() => setSelectedId(n.id)}
        className={`w-full text-left text-xs px-2 py-1.5 rounded truncate ${selectedId === n.id ? 'bg-teal-600/25 text-teal-300' : 'text-gray-400 hover:bg-white/5'}`}
        style={{ paddingLeft: 8 + depth * 12 }}>
        {n.type}{n.props?.text ? ` · ${String(n.props.text).slice(0, 18)}` : ''}
      </button>
      {(n.children || []).map((c) => <LayerRow key={c.id} n={c} depth={depth + 1} />)}
    </>
  );

  /* ── render ── */
  if (loading) return <div className="min-h-screen grid place-items-center bg-[#07080d] text-gray-400">Loading Site Studio…</div>;

  if (!site) return (
    <div className="min-h-screen grid place-items-center bg-[#07080d] text-white p-6">
      <div className="w-full max-w-md bg-[#0d0f17] border border-[#1d2130] rounded-2xl p-8 text-center">
        <Box className="mx-auto mb-3 text-teal-400" size={36} />
        <h1 className="text-2xl font-extrabold mb-1">Site Studio</h1>
        <p className="text-gray-400 text-sm mb-6">Name your site's address to start building.</p>
        <div className="flex gap-2">
          <TextInput value={newSubdomain} onChange={setNewSubdomain} placeholder="my-band" />
          <button onClick={createSite} className="bg-teal-600 hover:bg-teal-500 rounded-lg px-4 font-bold">Create</button>
        </div>
      </div>
    </div>
  );

  const t3d = parse3d(styleVal('transform'));

  return (
    <div className="h-screen flex flex-col bg-[#07080d] text-white overflow-hidden">
      {/* ── top bar ── */}
      <header className="flex items-center gap-2 px-3 h-12 border-b border-[#1d2130] bg-[#0b0d15] flex-none">
        {onExit && <button onClick={onExit} className="p-1.5 rounded hover:bg-white/10" title="Exit"><ChevronLeft size={16} /></button>}
        <span className="font-extrabold text-sm">Site Studio</span>
        <span className="text-xs text-gray-500">/{site.subdomain}</span>
        <select value={pageId ?? ''} onChange={(e) => openPage(Number(e.target.value))}
          className="ml-2 bg-[#12141f] border border-[#252a3d] rounded-lg text-xs px-2 py-1.5">
          {pages.map((p) => <option key={p.id} value={p.id}>{p.slug}{p.published ? ' ●' : ''}</option>)}
        </select>
        <button onClick={async () => { const slug = prompt('New page slug (e.g. shows):'); if (!slug) return; try { await api(`/sites/${site.id}/pages`, { method: 'POST', body: JSON.stringify({ slug, title: slug }) }); setPages(await api(`/sites/${site.id}/pages`)); toast.success('Page added'); } catch (e: any) { toast.error(e.message); } }}
          className="p-1.5 rounded hover:bg-white/10" title="Add page"><Plus size={15} /></button>

        <div className="mx-auto flex items-center gap-1 bg-[#12141f] rounded-lg p-1">
          {([['base', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([b, Icon]) => (
            <button key={b} onClick={() => setBp(b as Breakpoint)}
              className={`p-1.5 rounded ${bp === b ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title={b === 'base' ? 'Desktop' : b}><Icon size={15} /></button>
          ))}
        </div>

        <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30" title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
        <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30" title="Redo (Ctrl+Y)"><Redo2 size={16} /></button>
        <button onClick={preview ? () => setPreview(null) : showPreview} className="p-1.5 rounded hover:bg-white/10" title="Preview">{preview ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        <button onClick={() => save()} disabled={saving} className="flex items-center gap-1.5 text-xs font-bold bg-[#12141f] border border-[#252a3d] rounded-lg px-3 py-1.5 hover:border-teal-500">
          <Save size={13} /> {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={publish} className="flex items-center gap-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-500 rounded-lg px-3 py-1.5">
          <Rocket size={13} /> Publish
        </button>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* ── left rail ── */}
        <aside className="w-56 border-r border-[#1d2130] bg-[#0b0d15] flex flex-col flex-none">
          <div className="flex border-b border-[#1d2130] text-[11px] font-bold">
            {([['elements', MousePointer2], ['layers', Layers], ['cms', Database]] as const).map(([tabId, Icon]) => (
              <button key={tabId} onClick={() => setLeftTab(tabId as any)}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1 ${leftTab === tabId ? 'text-teal-400 border-b-2 border-teal-500' : 'text-gray-500'}`}>
                <Icon size={12} /> {tabId.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {leftTab === 'elements' && (
              <div className="grid grid-cols-2 gap-2">
                {PALETTE.map((item) => (
                  <div key={item.type + item.label} draggable
                    onDragStart={(e) => e.dataTransfer.setData('application/x-palette', item.type === 'list' ? 'list' : item.type)}
                    className="bg-[#12141f] border border-[#252a3d] rounded-lg p-2.5 text-center cursor-grab hover:border-teal-500 select-none">
                    <div className="text-lg leading-none mb-1">{item.icon}</div>
                    <div className="text-[10px] text-gray-400">{item.label}</div>
                  </div>
                ))}
                <p className="col-span-2 text-[10px] text-gray-600 mt-1">Drag an element onto the canvas. Drag existing elements to reorder or re-nest.</p>
              </div>
            )}
            {leftTab === 'layers' && <LayerRow n={doc.tree} depth={0} />}
            {leftTab === 'cms' && (
              <div className="space-y-3">
                <button onClick={addCollection} className="w-full text-xs font-bold bg-[#12141f] border border-dashed border-[#2a2f42] rounded-lg py-2 hover:border-teal-500">+ New collection</button>
                {collections.map((c) => (
                  <div key={c.id} className="bg-[#12141f] border border-[#252a3d] rounded-lg p-2.5">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs font-bold">{c.name}</div><div className="text-[10px] text-gray-500">{`{{${c.slug}.field}}`} · {c.itemCount} items</div></div>
                      <button onClick={() => addItem(c)} className="text-[10px] bg-teal-600/20 text-teal-300 rounded px-2 py-1 font-bold">+ item</button>
                    </div>
                  </div>
                ))}
                {!collections.length && <p className="text-[10px] text-gray-600">Collections power dynamic content — create one (Shows, Releases…), add items, then set a CMS List's collection in the panel →</p>}
              </div>
            )}
          </div>
        </aside>

        {/* ── canvas ── */}
        <main className="flex-1 overflow-auto bg-[#07080d] p-6" onClick={() => setSelectedId(null)}>
          <div className="mx-auto transition-all duration-300 shadow-2xl rounded-xl overflow-hidden ring-1 ring-[#1d2130]"
            style={{ width: BP_WIDTH[bp], maxWidth: '100%', perspective: '1200px' }}>
            <NodeView node={doc.tree} bp={bp} selectedId={selectedId} onSelect={setSelectedId}
              onDropInto={handleDropInto} onDragNode={(id) => { dragNodeId.current = id; }} />
          </div>
        </main>

        {/* ── right panel ── */}
        <aside className="w-72 border-l border-[#1d2130] bg-[#0b0d15] flex flex-col flex-none">
          {!selected ? (
            <div className="p-4 text-xs text-gray-500">Select an element on the canvas to edit it. <br /><br />Breakpoint: <b className="text-gray-300">{bp === 'base' ? 'Desktop' : bp}</b>{bp !== 'base' && ' — edits here become responsive overrides.'}</div>
          ) : (
            <>
              <div className="px-3 py-2.5 border-b border-[#1d2130] flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wide text-teal-400">{selected.type}</span>
                <span className="text-[10px] text-gray-600 truncate">#{selected.id}</span>
                <div className="ml-auto flex gap-1">
                  <button onClick={duplicateSelected} className="p-1 rounded hover:bg-white/10" title="Duplicate"><Copy size={13} /></button>
                  <button onClick={deleteSelected} className="p-1 rounded hover:bg-red-500/20 text-red-400" title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>

              {/* state layer selector */}
              <div className="px-3 pt-2 flex gap-1">
                {(['base', 'hover', 'pressed'] as const).map((sl) => (
                  <button key={sl} onClick={() => setStateLayer(sl)}
                    className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${stateLayer === sl ? 'bg-purple-600/30 text-purple-300' : 'bg-[#12141f] text-gray-500'}`}>
                    {sl === 'base' ? (bp === 'base' ? 'Default' : bp) : sl}
                  </button>
                ))}
              </div>

              <div className="px-3 pt-2 flex gap-4 text-[11px] font-bold border-b border-[#1d2130]">
                {(['basic', 'advanced'] as const).map((tb) => (
                  <button key={tb} onClick={() => setTab(tb)}
                    className={`pb-2 ${tab === tb ? 'text-teal-400 border-b-2 border-teal-500' : 'text-gray-500'}`}>{tb.toUpperCase()}</button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {tab === 'basic' && (
                  <>
                    {['heading', 'text', 'button', 'link'].includes(selected.type) && (
                      <Field label="Text"><TextInput value={selected.props?.text || ''} onChange={(v) => setProp('text', v)} /></Field>
                    )}
                    {selected.type === 'heading' && (
                      <Field label="Level">
                        <select value={selected.props?.level || 2} onChange={(e) => { setProp('level', Number(e.target.value)); commit(); }}
                          className="w-full bg-[#12141f] border border-[#252a3d] rounded-lg px-3 py-2 text-sm">
                          <option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option>
                        </select>
                      </Field>
                    )}
                    {['button', 'link'].includes(selected.type) && (
                      <Field label="Link (URL)"><TextInput value={selected.props?.href || ''} onChange={(v) => setProp('href', v)} placeholder="https://… or #anchor" /></Field>
                    )}
                    {['image', 'video'].includes(selected.type) && (
                      <>
                        <Field label="Source URL"><TextInput value={selected.props?.src || ''} onChange={(v) => setProp('src', v)} /></Field>
                        {selected.type === 'image' && <Field label="Alt text (SEO)"><TextInput value={selected.props?.alt || ''} onChange={(v) => setProp('alt', v)} /></Field>}
                      </>
                    )}
                    {['input', 'textarea'].includes(selected.type) && (
                      <>
                        <Field label="Field name"><TextInput value={selected.props?.name || ''} onChange={(v) => setProp('name', v)} /></Field>
                        <Field label="Placeholder"><TextInput value={selected.props?.placeholder || ''} onChange={(v) => setProp('placeholder', v)} /></Field>
                      </>
                    )}
                    {selected.repeat !== undefined && (
                      <Field label="CMS collection">
                        <select value={selected.repeat || ''} onChange={(e) => { update((d) => ({ ...d, tree: updateNode(d.tree, selected.id, (n) => ({ ...n, repeat: e.target.value })) })); commit(); }}
                          className="w-full bg-[#12141f] border border-[#252a3d] rounded-lg px-3 py-2 text-sm">
                          <option value="">— choose —</option>
                          {collections.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                        </select>
                      </Field>
                    )}
                    <Field label="Background"><TextInput value={styleVal('background')} onChange={(v) => setStyle('background', v)} placeholder="#12141f or linear-gradient(…)" /></Field>
                    <Field label="Text color"><TextInput value={styleVal('color')} onChange={(v) => setStyle('color', v)} placeholder="#ffffff" /></Field>
                    <Field label="Font size"><TextInput value={styleVal('fontSize')} onChange={(v) => setStyle('fontSize', v)} placeholder="18px" /></Field>
                    <Field label="Padding"><TextInput value={styleVal('padding')} onChange={(v) => setStyle('padding', v)} placeholder="24px or 48px 24px" /></Field>
                    <Field label="Opacity"><TextInput value={styleVal('opacity')} onChange={(v) => setStyle('opacity', v)} placeholder="1" /></Field>
                    <Field label="Visibility">
                      <select value={styleVal('visibility') || 'visible'} onChange={(e) => { setStyle('visibility', e.target.value === 'visible' ? '' : e.target.value, true); }}
                        className="w-full bg-[#12141f] border border-[#252a3d] rounded-lg px-3 py-2 text-sm">
                        <option value="visible">Visible</option><option value="hidden">Hidden</option>
                      </select>
                    </Field>
                  </>
                )}

                {tab === 'advanced' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Margin"><TextInput value={styleVal('margin')} onChange={(v) => setStyle('margin', v)} placeholder="0 auto" /></Field>
                      <Field label="Width"><TextInput value={styleVal('width')} onChange={(v) => setStyle('width', v)} placeholder="100%" /></Field>
                      <Field label="Max width"><TextInput value={styleVal('maxWidth')} onChange={(v) => setStyle('maxWidth', v)} placeholder="1100px" /></Field>
                      <Field label="Height"><TextInput value={styleVal('height')} onChange={(v) => setStyle('height', v)} placeholder="auto" /></Field>
                      <Field label="Radius"><TextInput value={styleVal('borderRadius')} onChange={(v) => setStyle('borderRadius', v)} placeholder="12px" /></Field>
                      <Field label="Shadow"><TextInput value={styleVal('boxShadow')} onChange={(v) => setStyle('boxShadow', v)} placeholder="0 12px 40px rgba(0,0,0,.4)" /></Field>
                    </div>
                    {['section', 'div', 'nav', 'form', 'page'].includes(selected.type) && (
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Direction">
                          <select value={styleVal('flexDirection') || 'column'} onChange={(e) => setStyle('flexDirection', e.target.value, true)}
                            className="w-full bg-[#12141f] border border-[#252a3d] rounded-lg px-2 py-2 text-sm">
                            <option value="column">Column</option><option value="row">Row</option>
                          </select>
                        </Field>
                        <Field label="Gap"><TextInput value={styleVal('gap')} onChange={(v) => setStyle('gap', v)} placeholder="16px" /></Field>
                        <Field label="Justify"><TextInput value={styleVal('justifyContent')} onChange={(v) => setStyle('justifyContent', v)} placeholder="center / space-between" /></Field>
                        <Field label="Align"><TextInput value={styleVal('alignItems')} onChange={(v) => setStyle('alignItems', v)} placeholder="center" /></Field>
                      </div>
                    )}
                    <Field label="Transition"><TextInput value={styleVal('transition')} onChange={(v) => setStyle('transition', v)} placeholder="transform .6s cubic-bezier(.16,1,.3,1)" /></Field>

                    {/* 3D knobs — the blueprint's spatial controls */}
                    <div className="bg-[#0f1120] border border-[#252a3d] rounded-xl p-3 space-y-2.5">
                      <div className="text-[11px] font-extrabold text-purple-300 uppercase tracking-wide">3D Space</div>
                      <Knob label="Rotate X" min={-60} max={60} value={t3d.rx} onChange={(v) => setStyle('transform', make3d({ ...t3d, rx: v }))} onCommit={commit} />
                      <Knob label="Rotate Y" min={-60} max={60} value={t3d.ry} onChange={(v) => setStyle('transform', make3d({ ...t3d, ry: v }))} onCommit={commit} />
                      <Knob label="Rotate Z" min={-45} max={45} value={t3d.rz} onChange={(v) => setStyle('transform', make3d({ ...t3d, rz: v }))} onCommit={commit} />
                      <Knob label="Depth (Z)" min={-200} max={200} value={t3d.tz} unit="px" onChange={(v) => setStyle('transform', make3d({ ...t3d, tz: v }))} onCommit={commit} />
                      {(t3d.rx || t3d.ry || t3d.rz || t3d.tz) ? (
                        <button onClick={() => { setStyle('transform', '', true); }} className="text-[10px] text-gray-500 hover:text-red-400">Reset 3D</button>
                      ) : null}
                    </div>

                    <Field label="Custom CSS value (advanced)">
                      <TextInput value={styleVal('transform')} onChange={(v) => setStyle('transform', v)} placeholder="transform value" />
                    </Field>
                  </>
                )}

                {/* page-level SEO when root selected */}
                {selected.id === 'root' && (
                  <div className="bg-[#0f1120] border border-[#252a3d] rounded-xl p-3 space-y-2">
                    <div className="text-[11px] font-extrabold text-teal-300 uppercase tracking-wide">Page SEO</div>
                    <Field label="Page title"><TextInput value={doc.title || ''} onChange={(v) => update((d) => ({ ...d, title: v }))} /></Field>
                    <Field label="Meta description"><TextInput value={doc.metaDescription || ''} onChange={(v) => update((d) => ({ ...d, metaDescription: v }))} /></Field>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ── sandboxed preview overlay (allow-scripts ONLY; never same-origin) ── */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold">Live preview — compiled by the secure engine</span>
            <button onClick={() => setPreview(null)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><X size={16} /></button>
          </div>
          <iframe title="Site preview" sandbox="allow-scripts" referrerPolicy="no-referrer"
            srcDoc={preview} className="flex-1 w-full rounded-xl bg-white" />
        </div>
      )}
    </div>
  );
};

export default StudioEditor;
