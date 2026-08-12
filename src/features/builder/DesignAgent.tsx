/**
 * DESIGN AGENT — native to the canvas.
 *
 * A professional design agent that works directly on the site being built:
 * it reads the actual blocks, proposes typed operations, and nothing lands
 * until you apply it. Every applied change is an ordinary block edit —
 * visible on the canvas, editable in the properties panel, undoable here.
 *
 * Three modes:
 *   Agent     — instruct in plain language; ops come back as proposals
 *   Warehouse — the AI design warehouse: curated sections to drop in
 *   Factory   — the AI factory: a full page draft from one concept line
 *
 * Backend: /api/design-agent/* (Gemini-powered when a key is configured,
 * deterministic design heuristics otherwise — the agent always works).
 */
import { useCallback, useMemo, useState } from 'react';
import { Sparkles, Undo2, Warehouse, Factory, Wand2, Check, X, Loader2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import { ANIMATION_PRESETS } from './animations';
import {
  applyOps, describeOp, validateOp,
  type BuilderBlock, type DesignOp,
} from './agent-ops';

interface DesignAgentProps {
  blocks: BuilderBlock[];
  setBlocks: (blocks: BuilderBlock[]) => void;
  activeBlockId: string | null;
}

interface Proposal {
  id: string;
  op: DesignOp;
  description: string;
  selected: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Make it futuristic', instruction: 'Restyle the whole page with a futuristic look: dark cosmic backgrounds, neon accents, holographic and 3D motion.' },
  { label: 'Add motion', instruction: 'Add tasteful animation to every block: entrances for content sections, one ambient effect on the hero.' },
  { label: 'Punch up the copy', instruction: 'Rewrite titles and subtitles to be bolder, shorter and more memorable. Keep the meaning.' },
  { label: 'Go luxury dark', instruction: 'Apply a luxury dark theme: near-black backgrounds, warm gold accents, serif display feel, subtle shimmer.' },
];

export const DesignAgent = ({ blocks, setBlocks, activeBlockId }: DesignAgentProps) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'agent' | 'warehouse' | 'factory'>('agent');
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [rationale, setRationale] = useState('');
  const [history, setHistory] = useState<BuilderBlock[][]>([]);
  const [warehouse, setWarehouse] = useState<{ id: string; name: string; description: string; blocks: any[] }[]>([]);
  const [concept, setConcept] = useState('');

  const selectedCount = useMemo(() => proposals.filter((p) => p.selected).length, [proposals]);

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-19), blocks]);
  }, [blocks]);

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) { toast('Nothing to undo'); return h; }
      setBlocks(h[h.length - 1]);
      toast.success('Reverted last agent change');
      return h.slice(0, -1);
    });
  };

  const toProposals = (rawOps: any[], why?: string) => {
    const valid = (Array.isArray(rawOps) ? rawOps : []).map(validateOp).filter((o): o is DesignOp => o !== null);
    if (valid.length === 0) { toast.error('The agent returned nothing usable — try rephrasing.'); return; }
    setProposals(valid.map((op, i) => ({ id: `p${i}`, op, description: describeOp(op, blocks), selected: true })));
    setRationale(why ?? '');
  };

  const runAgent = async (text: string) => {
    if (!text.trim()) return;
    setBusy(true);
    setProposals([]);
    try {
      const res = await fetch('/api/design-agent/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({ instruction: text, blocks, activeBlockId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toProposals(data.ops, data.rationale);
    } catch (err) {
      console.error('[design-agent]', err);
      toast.error('Design agent unreachable — check that the server is running.');
    } finally {
      setBusy(false);
    }
  };

  const loadWarehouse = async () => {
    setTab('warehouse');
    if (warehouse.length > 0) return;
    try {
      const res = await fetch('/api/design-agent/warehouse', { headers: authHeader() });
      const data = await res.json();
      setWarehouse(data.sections ?? []);
    } catch {
      toast.error('Warehouse unreachable.');
    }
  };

  const runFactory = async () => {
    if (!concept.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/design-agent/factory', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({ concept }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const op = validateOp({ op: 'replace_all', blocks: data.blocks });
      if (!op) throw new Error('factory draft invalid');
      setTab('agent');
      setProposals([{ id: 'factory', op, description: `Load factory draft "${data.name}" (${data.blocks.length} sections) — replaces the current page (undoable)`, selected: true }]);
      setRationale(data.rationale ?? `Factory draft from concept: "${concept}"`);
    } catch (err) {
      console.error('[design-factory]', err);
      toast.error('Factory unreachable.');
    } finally {
      setBusy(false);
    }
  };

  const applySelected = () => {
    const ops = proposals.filter((p) => p.selected).map((p) => p.op);
    if (ops.length === 0) return;
    pushHistory();
    setBlocks(applyOps(blocks, ops));
    setProposals([]);
    toast.success(`Applied ${ops.length} change${ops.length > 1 ? 's' : ''} — every one is now an editable block`);
  };

  const insertSection = (section: { name: string; blocks: any[] }) => {
    const ops = section.blocks
      .map((b: any) => validateOp({ op: 'add_block', type: b.type, props: b.props, styles: b.styles, animation: b.animation }))
      .filter((o): o is DesignOp => o !== null);
    if (ops.length === 0) return;
    pushHistory();
    setBlocks(applyOps(blocks, ops));
    toast.success(`Inserted "${section.name}" from the warehouse`);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-96 z-40 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-violet-500/30 hover:scale-105 transition-transform"
      >
        <Sparkles size={16} /> Design Agent
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-96 z-40 w-[420px] max-h-[75vh] flex flex-col bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-400" />
          <span className="text-xs font-black uppercase tracking-widest text-white">Design Agent</span>
          {activeBlockId && <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold">block selected</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={undo} title="Undo last agent change" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30" disabled={history.length === 0}>
            <Undo2 size={16} />
          </button>
          <button onClick={() => setOpen(false)} className="p-2 text-zinc-400 hover:text-white"><X size={16} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-5 pt-3 gap-2">
        {([
          { key: 'agent', icon: Wand2, label: 'Agent' },
          { key: 'warehouse', icon: Warehouse, label: 'Warehouse' },
          { key: 'factory', icon: Factory, label: 'Factory' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => (t.key === 'warehouse' ? loadWarehouse() : setTab(t.key))}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              tab === t.key ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {tab === 'agent' && (
          <>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((qa) => (
                <button key={qa.label} onClick={() => runAgent(qa.instruction)} disabled={busy}
                  className="text-[10px] font-bold px-3 py-1.5 bg-white/5 hover:bg-violet-500/15 hover:text-violet-300 text-zinc-400 rounded-full transition-all">
                  {qa.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !busy && runAgent(instruction)}
                placeholder={activeBlockId ? 'Instruct the agent (targets selected block first)…' : 'Tell the agent what to design…'}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
              />
              <button onClick={() => runAgent(instruction)} disabled={busy || !instruction.trim()}
                className="px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              </button>
            </div>

            {rationale && proposals.length > 0 && (
              <p className="text-[11px] text-zinc-500 leading-relaxed border-l-2 border-violet-500/40 pl-3">{rationale}</p>
            )}

            {proposals.length > 0 && (
              <div className="space-y-2">
                {proposals.map((p) => (
                  <label key={p.id} className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    p.selected ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/[0.02] border-white/5 opacity-60',
                  )}>
                    <input type="checkbox" checked={p.selected}
                      onChange={() => setProposals((ps) => ps.map((x) => (x.id === p.id ? { ...x, selected: !x.selected } : x)))}
                      className="mt-0.5 accent-violet-500" />
                    <span className="text-xs text-zinc-300 leading-snug">{p.description}</span>
                  </label>
                ))}
                <div className="flex gap-2 pt-1">
                  <button onClick={applySelected} disabled={selectedCount === 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest">
                    <Check size={14} /> Apply {selectedCount > 0 ? `${selectedCount} ` : ''}change{selectedCount === 1 ? '' : 's'}
                  </button>
                  <button onClick={() => setProposals([])} className="px-4 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl text-xs font-bold">
                    Discard
                  </button>
                </div>
              </div>
            )}

            {proposals.length === 0 && !busy && (
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                The agent proposes; you decide. Every applied change becomes a normal block —
                edit it in the properties panel, reorder it, delete it, or hit undo here.
                {` ${ANIMATION_PRESETS.length}`} animation presets (including the 3D Motion pack) are in its toolkit.
              </p>
            )}
          </>
        )}

        {tab === 'warehouse' && (
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-500">Professionally designed sections from the AI warehouse. Click to insert — then edit freely.</p>
            {warehouse.length === 0 && <p className="text-xs text-zinc-600">Loading…</p>}
            {warehouse.map((sec) => (
              <button key={sec.id} onClick={() => insertSection(sec)}
                className="w-full text-left p-3 bg-white/[0.03] hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/30 rounded-xl transition-all">
                <div className="text-xs font-bold text-white">{sec.name}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{sec.description}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'factory' && (
          <div className="space-y-3">
            <p className="text-[11px] text-zinc-500">
              The AI factory assembles a complete page from one concept line. The draft arrives as a
              proposal — nothing replaces your canvas until you apply it, and undo brings everything back.
            </p>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder='e.g. "Dark, cinematic site for an ambient producer — planetarium energy, gold accents, slow 3D motion"'
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50 resize-none"
            />
            <button onClick={runFactory} disabled={busy || !concept.trim()}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Factory size={14} />} Manufacture Page Draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function authHeader(): Record<string, string> {
  try {
    const token = localStorage.getItem('token') ?? localStorage.getItem('authToken') ?? '';
    return token ? { authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
