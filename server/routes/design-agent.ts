/**
 * DESIGN AGENT BACKEND — the AI design warehouse & factory.
 *
 *   POST /api/design-agent/generate  — instruction + current blocks → typed ops
 *   GET  /api/design-agent/warehouse — curated professional section blueprints
 *   POST /api/design-agent/factory   — one concept line → full page draft
 *
 * The model proposes; deterministic code disposes (V12 Constitution Art. I
 * §1.4): every model response is parsed, schema-checked and filtered to the
 * closed operation set before it reaches the client, and the client validates
 * again before anything touches the canvas. With no GEMINI_API_KEY the agent
 * falls back to deterministic design heuristics, so the feature works in
 * every environment. Agent actions respect the constitution engine: while
 * the ecosystem is halted, the design agent does not act (Art. X).
 */
import { Router } from 'express';
import { authenticateToken } from '../domains/identity/auth.js';
import { config } from '../config.js';
import { constitutionEngine } from '../constitution/engine.js';

const router = Router();
router.use(authenticateToken);

const BLOCK_TYPES = ['hero', 'music', 'gallery', 'store', 'events', 'text'];
const OPS = ['add_block', 'update_props', 'update_styles', 'set_animation', 'move_block', 'remove_block', 'apply_theme', 'replace_all'];
const ANIMATIONS = [
  'fade-up', 'slide-left', 'scale-reveal', 'curtain', 'typewriter-pop', 'float', 'breathe',
  'gradient-drift', 'shimmer', 'pulse-ring', 'tilt-hover', 'neon-pulse', 'aurora', 'hologram',
  'glitch', 'cyber-grid', 'orbital', 'levitate-3d', 'liquid-morph', 'starfield-drift',
  'spin-carousel', 'flip-x', 'door-reveal', 'tunnel-zoom', 'tumble', 'pendulum-3d', 'helix',
  'card-shuffle', 'wave-rotate', 'zoom-parallax', 'vortex', 'unfold',
];

function constitutionGate(): void {
  // Art. X: the design agent is an agent; it does not act while halted.
  try {
    constitutionEngine().assertMayAct('design-agent');
  } catch (err: any) {
    if (err?.code === 'CONSTITUTION_HALT' || err?.code === 'AGENT_SUSPENDED' || err?.code === 'AGENT_THROTTLED') throw err;
    // ENGINE_UNAVAILABLE in dev -> proceed; production boot would have failed closed already.
  }
}

// ── Gemini (REST, zero extra deps) with deterministic fallback ─────────────

async function callGemini(prompt: string): Promise<string | null> {
  const key = config.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
        }),
      },
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

function agentPrompt(instruction: string, blocks: any[], activeBlockId: string | null): string {
  return `You are a professional web designer working inside a site builder canvas.
Current page blocks (JSON): ${JSON.stringify(blocks).slice(0, 8000)}
Selected block id: ${activeBlockId ?? 'none'}
User instruction: "${instruction}"

Respond with ONLY a JSON object: {"rationale": "<one plain-language paragraph naming what you changed and why>", "ops": [...]}.
Each op must be one of:
- {"op":"update_props","blockId":"<id>","props":{...}}            // rewrite copy
- {"op":"update_styles","blockId":"<id>","styles":{...}}          // CSS-in-JS values only
- {"op":"set_animation","blockId":"<id>","animation":"<preset>"}  // preset from: ${ANIMATIONS.join(', ')}
- {"op":"add_block","type":"<${BLOCK_TYPES.join('|')}>","props":{...},"styles":{...},"animation":"<preset>","index":<n>}
- {"op":"move_block","blockId":"<id>","to":<n>}
- {"op":"remove_block","blockId":"<id>"}
- {"op":"apply_theme","theme":{"backgroundColor":"#…","surfaceColor":"#…","textColor":"#…","accentColor":"#…","borderRadius":"…","fontFamily":"…"}}
Rules: prefer the selected block when one is selected; keep ops under 12; never invent block ids; styles are valid CSS property/value pairs; be bold but coherent — one design direction per response.`;
}

/** Server-side sanitation: closed op set, known animations, sane sizes. */
function sanitizeOps(raw: any): any[] {
  const ops = Array.isArray(raw) ? raw : [];
  return ops
    .filter((o) => o && typeof o === 'object' && OPS.includes(o.op))
    .filter((o) => o.op !== 'set_animation' || o.animation === null || ANIMATIONS.includes(o.animation))
    .filter((o) => o.op !== 'add_block' || BLOCK_TYPES.includes(o.type))
    .filter((o) => o.op !== 'replace_all' || (Array.isArray(o.blocks) && o.blocks.length <= 12 && o.blocks.every((b: any) => BLOCK_TYPES.includes(b?.type))))
    .slice(0, 12);
}

/** Deterministic design heuristics — the agent always works, key or no key. */
function heuristicOps(instruction: string, blocks: any[], activeBlockId: string | null): { rationale: string; ops: any[] } {
  const text = instruction.toLowerCase();
  const target = activeBlockId ? blocks.filter((b) => b.id === activeBlockId) : blocks;
  const ops: any[] = [];
  let rationale = '';

  if (/futur|cyber|neon|holo|sci-?fi|space/.test(text)) {
    ops.push({ op: 'apply_theme', theme: { backgroundColor: '#06060d', surfaceColor: '#0c0c1a', textColor: '#eaeaff', accentColor: '#8b5cf6', borderRadius: '28px' } });
    blocks.forEach((b, i) => ops.push({ op: 'set_animation', blockId: b.id, animation: i === 0 ? 'orbital' : ['hologram', 'levitate-3d', 'aurora'][i % 3] }));
    rationale = 'Applied a cosmic dark theme (near-black background, violet accent, generous radii) and gave the hero an orbital light ring with holographic/levitating motion on the sections — a coherent futurist direction without touching your copy.';
  } else if (/luxur|gold|premium|elegan/.test(text)) {
    ops.push({ op: 'apply_theme', theme: { backgroundColor: '#141210', surfaceColor: '#1c1916', textColor: '#f5ead9', accentColor: '#d4af6a', borderRadius: '20px', fontFamily: 'Didot, Georgia, serif' } });
    blocks.slice(0, 1).forEach((b) => ops.push({ op: 'set_animation', blockId: b.id, animation: 'shimmer' }));
    rationale = 'Applied a luxury dark palette (charcoal + champagne gold), a serif display feel, and a slow shimmer on the hero — restraint reads as expensive.';
  } else if (/motion|anim|move|alive|3d/.test(text)) {
    const is3d = /3d/.test(text);
    const cycle = is3d ? ['flip-x', 'tunnel-zoom', 'card-shuffle', 'wave-rotate'] : ['fade-up', 'slide-left', 'scale-reveal', 'float'];
    target.forEach((b, i) => ops.push({ op: 'set_animation', blockId: b.id, animation: i === 0 ? (is3d ? 'levitate-3d' : 'breathe') : cycle[i % cycle.length] }));
    rationale = `Choreographed the page: an ambient ${is3d ? 'levitation' : 'breathing'} effect on the first block, ${is3d ? '3D' : 'entrance'} motion on the rest, alternating presets so adjacent sections never move identically.`;
  } else if (/copy|title|headline|word|text|punch/.test(text)) {
    target.filter((b) => b.type === 'hero').forEach((b) => {
      const t = String(b.props?.title ?? 'Untitled');
      ops.push({ op: 'update_props', blockId: b.id, props: { title: t.length > 18 ? t.split(/\s+/).slice(0, 3).join(' ').toUpperCase() : t.toUpperCase(), cta: 'Press Play' } });
    });
    rationale = 'Tightened the hero headline (three words, full caps carries more weight at display sizes) and sharpened the call to action. Subtitles left for your voice.';
  } else {
    ops.push({ op: 'apply_theme', theme: { backgroundColor: '#0c0c0d', surfaceColor: '#131315', textColor: '#e8e8ea', borderRadius: '16px' } });
    target.slice(0, 4).forEach((b, i) => ops.push({ op: 'set_animation', blockId: b.id, animation: ['scale-reveal', 'fade-up', 'fade-up', 'float'][i] }));
    rationale = 'Defaulted to a disciplined studio-dark direction: unified charcoal surfaces, consistent radii, and quiet reveal motion. Tell me a stronger direction ("futuristic", "luxury", "3D motion") and I will push further.';
  }
  return { rationale, ops };
}

// ── Routes ──────────────────────────────────────────────────────────────────

router.post('/generate', async (req: any, res) => {
  try {
    constitutionGate();
  } catch (err: any) {
    return res.status(503).json({ error: err.message, code: err.code });
  }
  const { instruction, blocks, activeBlockId } = req.body ?? {};
  if (typeof instruction !== 'string' || !instruction.trim() || !Array.isArray(blocks)) {
    return res.status(400).json({ error: 'instruction (string) and blocks (array) are required' });
  }

  const modelText = await callGemini(agentPrompt(instruction, blocks, activeBlockId ?? null));
  if (modelText) {
    try {
      const parsed = JSON.parse(modelText);
      const ops = sanitizeOps(parsed.ops);
      if (ops.length > 0) {
        return res.json({ source: 'gemini', rationale: String(parsed.rationale ?? '').slice(0, 800), ops });
      }
    } catch { /* fall through to heuristics */ }
  }
  const fallback = heuristicOps(instruction, blocks, activeBlockId ?? null);
  return res.json({ source: 'heuristic', rationale: fallback.rationale, ops: sanitizeOps(fallback.ops) });
});

// The AI design warehouse: professional, ready-to-insert sections.
const WAREHOUSE_SECTIONS = [
  { id: 'neon-hero', name: 'Neon Statement Hero', description: 'Cyberpunk hero with pulsing neon frame.',
    blocks: [{ type: 'hero', props: { title: 'LOUDER THAN THE CITY', subtitle: 'New single out everywhere', cta: 'Stream Now' }, styles: { padding: '96px 32px', backgroundColor: '#050508', color: '#e6faff', border: '1px solid rgba(34,211,238,0.4)', borderRadius: '28px' }, animation: 'neon-pulse' }] },
  { id: 'glass-quote', name: 'Glass Pull-Quote', description: 'Frosted testimonial / press quote panel.',
    blocks: [{ type: 'text', props: { content: '“A sound that arrives from five years in the future.” — replace with your best press quote' }, styles: { padding: '64px 32px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#f2f6ff', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '28px' }, animation: 'breathe' }] },
  { id: 'drop-countdown', name: 'Release Drop Panel', description: 'High-urgency next-release announcement.',
    blocks: [{ type: 'hero', props: { title: 'THE DROP', subtitle: '72 hours until everything changes', cta: 'Set a Reminder' }, styles: { padding: '80px 32px', backgroundImage: 'linear-gradient(160deg, #431407, #9a3412)', color: '#fff3e6', borderRadius: '24px' }, animation: 'pulse-ring' }] },
  { id: 'holo-gallery', name: 'Holographic Gallery', description: 'Visuals grid with projection flicker.',
    blocks: [{ type: 'gallery', props: { title: 'Projections' }, styles: { padding: '72px 32px', backgroundColor: '#07070f', color: '#e9e9ff', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '28px' }, animation: 'hologram' }] },
  { id: 'levitating-store', name: 'Levitating Storefront', description: 'Merch grid that floats in 3D space.',
    blocks: [{ type: 'store', props: { title: 'The Supply' }, styles: { padding: '72px 32px', backgroundColor: '#0a0d1a', color: '#dbe4ff', borderRadius: '28px' }, animation: 'levitate-3d' }] },
  { id: 'vault-tracks', name: 'Vault Track List', description: 'Music section behind a swinging vault door.',
    blocks: [{ type: 'music', props: { title: 'FROM THE VAULT' }, styles: { padding: '72px 32px', backgroundColor: '#141416', color: '#e7e7ea', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '20px' }, animation: 'door-reveal' }] },
  { id: 'tour-spotlight', name: 'Tour Spotlight', description: 'Event card with kinetic 3D shuffle-in.',
    blocks: [{ type: 'events', props: { title: 'ON THE ROAD', date: '2026-10-30', venue: 'The Warehouse', city: 'Chicago', price: 55 }, styles: { padding: '72px 32px', backgroundColor: '#0b0b0c', color: '#e7e7ea', borderRadius: '24px' }, animation: 'card-shuffle' }] },
  { id: 'manifesto', name: 'Artist Manifesto', description: 'Editorial statement block, curtain reveal.',
    blocks: [{ type: 'text', props: { content: 'Write the three sentences that explain why you make music. This block is your manifesto — the rest of the site is evidence.' }, styles: { padding: '72px 48px', backgroundColor: '#faf7f0', color: '#1a1712', fontFamily: 'Georgia, serif', textAlign: 'left', borderRadius: '8px' }, animation: 'curtain' }] },
  { id: 'aurora-closer', name: 'Aurora Closer', description: 'End-of-page CTA under drifting northern lights.',
    blocks: [{ type: 'hero', props: { title: 'Stay in Orbit', subtitle: 'Join the list — first transmission is free', cta: 'Subscribe' }, styles: { padding: '96px 32px', backgroundColor: '#0a1020', color: '#eef4ff', borderRadius: '32px' }, animation: 'aurora' }] },
  { id: 'warp-arrival', name: 'Warp Arrival Hero', description: 'Hero that flies in from deep Z-space.',
    blocks: [{ type: 'hero', props: { title: 'ARRIVAL', subtitle: 'The new era lands here', cta: 'Enter' }, styles: { padding: '96px 32px', backgroundColor: '#020208', color: '#e0e7ff', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '28px' }, animation: 'tunnel-zoom' }] },
  { id: 'starfield-story', name: 'Starfield Story', description: 'Narrative text drifting through deep space.',
    blocks: [{ type: 'text', props: { content: 'Somewhere between the last show and the next one, these songs happened.' }, styles: { padding: '80px 32px', backgroundColor: '#03040a', color: '#9db4e8', borderRadius: '28px' }, animation: 'starfield-drift' }] },
  { id: 'origami-intro', name: 'Origami Intro', description: 'Welcome section that unfolds like paper.',
    blocks: [{ type: 'text', props: { content: 'Welcome. Unfold slowly.' }, styles: { padding: '72px 32px', backgroundColor: '#fdf6ec', color: '#292524', borderRadius: '20px' }, animation: 'unfold' }] },
];

router.get('/warehouse', (_req, res) => {
  res.json({ sections: WAREHOUSE_SECTIONS, count: WAREHOUSE_SECTIONS.length });
});

router.post('/factory', async (req: any, res) => {
  try {
    constitutionGate();
  } catch (err: any) {
    return res.status(503).json({ error: err.message, code: err.code });
  }
  const { concept } = req.body ?? {};
  if (typeof concept !== 'string' || !concept.trim()) {
    return res.status(400).json({ error: 'concept (string) is required' });
  }

  // Try the model for bespoke copy + palette; deterministic assembly either way.
  const modelText = await callGemini(
    `You are a web design factory. Concept: "${concept}".
Respond ONLY with JSON: {"name":"<page name>","palette":{"bg":"#…","surface":"#…","text":"#…","accent":"#…"},"hero":{"title":"…","subtitle":"…","cta":"…"},"story":"<one paragraph of site copy>","heroAnimation":"<one of: ${ANIMATIONS.join(', ')}>"}`,
  );

  let name = 'Factory Draft';
  let palette = { bg: '#06060d', surface: '#0c0c1a', text: '#eaeaff', accent: '#8b5cf6' };
  let hero = { title: 'NEW WORLD', subtitle: concept.slice(0, 80), cta: 'Enter' };
  let story = `Built from the concept: ${concept}`;
  let heroAnimation = 'aurora';
  if (modelText) {
    try {
      const parsed = JSON.parse(modelText);
      if (parsed?.name) name = String(parsed.name).slice(0, 60);
      if (parsed?.palette?.bg) palette = parsed.palette;
      if (parsed?.hero?.title) hero = parsed.hero;
      if (parsed?.story) story = String(parsed.story).slice(0, 400);
      if (ANIMATIONS.includes(parsed?.heroAnimation)) heroAnimation = parsed.heroAnimation;
    } catch { /* deterministic values stand */ }
  }

  const dark = concept.toLowerCase().match(/dark|night|noir|space|cyber/) !== null || !concept.toLowerCase().match(/light|bright|clean|pastel/);
  if (!modelText) {
    palette = dark
      ? { bg: '#07070f', surface: '#10101e', text: '#e9e9ff', accent: '#8b5cf6' }
      : { bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', accent: '#3b82f6' };
  }

  const blocks = [
    { type: 'hero', props: hero, styles: { padding: '96px 32px', backgroundColor: palette.bg, color: palette.text, border: `1px solid ${palette.accent}55`, borderRadius: '28px' }, animation: heroAnimation },
    { type: 'text', props: { content: story }, styles: { padding: '64px 32px', backgroundColor: palette.surface, color: palette.text, borderRadius: '24px' }, animation: 'fade-up' },
    { type: 'music', props: { title: 'Featured Sound' }, styles: { padding: '72px 32px', backgroundColor: palette.bg, color: palette.text, borderRadius: '24px' }, animation: dark ? 'levitate-3d' : 'float' },
    { type: 'events', props: { title: 'Live Dates', date: '2026-11-20', venue: 'Main Room', city: 'Your City', price: 50 }, styles: { padding: '72px 32px', backgroundColor: palette.surface, color: palette.text, borderRadius: '24px' }, animation: 'slide-left' },
    { type: 'store', props: { title: 'The Shop' }, styles: { padding: '72px 32px', backgroundColor: palette.bg, color: palette.text, borderRadius: '24px' }, animation: 'scale-reveal' },
  ];

  res.json({
    name,
    source: modelText ? 'gemini' : 'heuristic',
    rationale: `Factory draft "${name}" assembled from your concept: hero direction, story, sound, dates and shop — five sections, each fully editable once loaded.`,
    blocks,
  });
});

export default router;
