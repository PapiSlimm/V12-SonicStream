/**
 * SonicStream Builder — 20 unique, modern style templates.
 *
 * Each template is a complete starting concept: palette, typography feel,
 * section stack, and motion — expressed entirely in the builder's own block
 * model (hero/music/gallery/store/events/text), so every part of a loaded
 * template is immediately visible, editable and removable on the canvas.
 * Animations reference the preset library (animations.ts) and land as plain
 * CSS in each block's styles.
 */
import type { CSSProperties } from 'react';
import { animationStyles } from './animations';

export interface TemplateBlock {
  type: 'hero' | 'music' | 'gallery' | 'store' | 'events' | 'text';
  props: Record<string, unknown>;
  styles?: CSSProperties;
}

export interface Template {
  id: string;
  name: string;
  style: string;
  description: string;
  thumbnail: string;
  palette: { bg: string; surface: string; text: string; accent: string };
  blocks: TemplateBlock[];
}

/** Compose block styles: base surface + palette + optional animation preset. */
const s = (css: CSSProperties, anim?: string): CSSProperties => ({
  padding: '72px 32px',
  ...css,
  ...(anim ? animationStyles(anim) : {}),
});

export const TEMPLATES: Template[] = [
  {
    id: 'neon-district',
    name: 'Neon District',
    style: 'Cyberpunk neon',
    description: 'Electric cyan-on-black with pulsing neon borders and a scrolling cyber grid. For artists who sound like midnight in the city.',
    thumbnail: 'https://picsum.photos/seed/neon-district/400/300',
    palette: { bg: '#050508', surface: '#0b0e14', text: '#e6faff', accent: '#22d3ee' },
    blocks: [
      { type: 'hero', props: { title: 'NEON DISTRICT', subtitle: 'Sound from the electric underground', cta: 'Enter the District' },
        styles: s({ backgroundColor: '#050508', color: '#e6faff', border: '1px solid rgba(34,211,238,0.35)', borderRadius: '24px' }, 'neon-pulse') },
      { type: 'music', props: { title: 'FREQUENCY DROPS' },
        styles: s({ backgroundColor: '#0b0e14', color: '#e6faff', borderRadius: '24px' }, 'cyber-grid') },
      { type: 'events', props: { title: 'NIGHT CIRCUIT', date: '2026-09-12', venue: 'Sector 7 Warehouse', city: 'Detroit', price: 45 },
        styles: s({ backgroundColor: '#050508', color: '#e6faff', borderRadius: '24px' }, 'fade-up') },
      { type: 'store', props: { title: 'DISTRICT SUPPLY' },
        styles: s({ backgroundColor: '#0b0e14', color: '#e6faff', borderRadius: '24px' }, 'shimmer') },
    ],
  },
  {
    id: 'glass-horizon',
    name: 'Glass Horizon',
    style: 'Glassmorphism',
    description: 'Frosted glass panels floating over an aurora wash. Weightless, premium, calm.',
    thumbnail: 'https://picsum.photos/seed/glass-horizon/400/300',
    palette: { bg: '#0a1020', surface: 'rgba(255,255,255,0.06)', text: '#f2f6ff', accent: '#7dd3fc' },
    blocks: [
      { type: 'hero', props: { title: 'Glass Horizon', subtitle: 'Music suspended in light', cta: 'Listen' },
        styles: s({ backgroundColor: 'rgba(255,255,255,0.06)', color: '#f2f6ff', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '32px' }, 'aurora') },
      { type: 'text', props: { content: 'Every release is a pane of light — clear, deliberate, unhurried.' },
        styles: s({ backgroundColor: 'rgba(255,255,255,0.04)', color: '#cfe3ff', backdropFilter: 'blur(12px)', borderRadius: '28px' }, 'breathe') },
      { type: 'music', props: { title: 'Transparent Sessions' },
        styles: s({ backgroundColor: 'rgba(255,255,255,0.06)', color: '#f2f6ff', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px' }, 'fade-up') },
      { type: 'gallery', props: { title: 'Through the Glass' },
        styles: s({ backgroundColor: 'rgba(255,255,255,0.04)', color: '#f2f6ff', borderRadius: '28px' }, 'scale-reveal') },
    ],
  },
  {
    id: 'mono-editorial',
    name: 'Mono Editorial',
    style: 'Black & white magazine',
    description: 'Stark monochrome, oversized type, curtain reveals. The front page treatment for serious work.',
    thumbnail: 'https://picsum.photos/seed/mono-editorial/400/300',
    palette: { bg: '#ffffff', surface: '#f4f4f4', text: '#0a0a0a', accent: '#0a0a0a' },
    blocks: [
      { type: 'hero', props: { title: 'THE RECORD', subtitle: 'An artist statement in black and white', cta: 'Read & Listen' },
        styles: s({ backgroundColor: '#ffffff', color: '#0a0a0a', borderBottom: '4px solid #0a0a0a', borderRadius: '0px', fontFamily: 'Georgia, serif' }, 'curtain') },
      { type: 'text', props: { content: '"The most disciplined debut of the year." — set your own pull-quote here.' },
        styles: s({ backgroundColor: '#f4f4f4', color: '#0a0a0a', fontFamily: 'Georgia, serif', borderRadius: '0px' }, 'fade-up') },
      { type: 'music', props: { title: 'Selected Works' },
        styles: s({ backgroundColor: '#ffffff', color: '#0a0a0a', border: '1px solid #0a0a0a', borderRadius: '0px' }, 'fade-up') },
    ],
  },
  {
    id: 'brutal-impact',
    name: 'Brutal Impact',
    style: 'Brutalist',
    description: 'Raw borders, harsh yellow, digital glitches. Anti-polish on purpose.',
    thumbnail: 'https://picsum.photos/seed/brutal-impact/400/300',
    palette: { bg: '#111111', surface: '#191919', text: '#ffffff', accent: '#facc15' },
    blocks: [
      { type: 'hero', props: { title: 'NO FILTER', subtitle: 'RAW OUTPUT ONLY', cta: 'PRESS PLAY' },
        styles: s({ backgroundColor: '#111111', color: '#ffffff', border: '6px solid #facc15', borderRadius: '0px', textTransform: 'uppercase' as const }, 'glitch') },
      { type: 'music', props: { title: 'THE DUMP' },
        styles: s({ backgroundColor: '#191919', color: '#ffffff', border: '3px dashed #facc15', borderRadius: '0px' }, 'typewriter-pop') },
      { type: 'store', props: { title: 'OBJECTS' },
        styles: s({ backgroundColor: '#111111', color: '#ffffff', border: '6px solid #ffffff', borderRadius: '0px' }, 'fade-up') },
    ],
  },
  {
    id: 'velvet-luxe',
    name: 'Velvet Luxe',
    style: 'Luxury dark gold',
    description: 'Deep charcoal, champagne gold, slow shimmer. For releases that deserve a velvet rope.',
    thumbnail: 'https://picsum.photos/seed/velvet-luxe/400/300',
    palette: { bg: '#141210', surface: '#1c1916', text: '#f5ead9', accent: '#d4af6a' },
    blocks: [
      { type: 'hero', props: { title: 'Velvet Luxe', subtitle: 'A private listening experience', cta: 'Request Access' },
        styles: s({ backgroundColor: '#141210', color: '#f5ead9', border: '1px solid rgba(212,175,106,0.5)', borderRadius: '20px', fontFamily: 'Didot, Georgia, serif' }, 'shimmer') },
      { type: 'music', props: { title: 'The Collection' },
        styles: s({ backgroundColor: '#1c1916', color: '#f5ead9', borderRadius: '20px' }, 'fade-up') },
      { type: 'events', props: { title: 'Salon Nights', date: '2026-10-02', venue: 'The Gilded Room', city: 'New York', price: 250 },
        styles: s({ backgroundColor: '#141210', color: '#f5ead9', border: '1px solid rgba(212,175,106,0.3)', borderRadius: '20px' }, 'breathe') },
      { type: 'store', props: { title: 'Atelier' },
        styles: s({ backgroundColor: '#1c1916', color: '#f5ead9', borderRadius: '20px' }, 'scale-reveal') },
    ],
  },
  {
    id: 'aurora-fade',
    name: 'Aurora Fade',
    style: 'Soft gradient ambient',
    description: 'Slow-drifting northern-lights gradients and floating panels. Ambient, dreamlike, unforced.',
    thumbnail: 'https://picsum.photos/seed/aurora-fade/400/300',
    palette: { bg: '#0a1020', surface: '#101a30', text: '#eef4ff', accent: '#a78bfa' },
    blocks: [
      { type: 'hero', props: { title: 'Aurora Fade', subtitle: 'Music for the space between waking and sleep', cta: 'Drift In' },
        styles: s({ backgroundColor: '#0a1020', color: '#eef4ff', borderRadius: '36px' }, 'aurora') },
      { type: 'music', props: { title: 'Night Frequencies' },
        styles: s({ backgroundColor: '#101a30', color: '#eef4ff', borderRadius: '32px' }, 'float') },
      { type: 'text', props: { content: 'Recorded between 2am and sunrise. Best heard the same way.' },
        styles: s({ backgroundColor: '#0a1020', color: '#c9d8ff', borderRadius: '28px' }, 'fade-up') },
    ],
  },
  {
    id: 'retro-wave',
    name: 'Retro Wave',
    style: 'Synthwave sunset',
    description: 'Magenta-orange horizon, scrolling grid floor, chrome text energy. 1986 called from the future.',
    thumbnail: 'https://picsum.photos/seed/retro-wave/400/300',
    palette: { bg: '#160a2e', surface: '#1f1040', text: '#ffe9f7', accent: '#f472b6' },
    blocks: [
      { type: 'hero', props: { title: 'RETRO WAVE', subtitle: 'Drive all night. Arrive in 1986.', cta: 'Ignition' },
        styles: s({ backgroundImage: 'linear-gradient(180deg, #160a2e 0%, #4c1d95 55%, #f472b6 130%)', color: '#ffe9f7', borderRadius: '24px' }, 'gradient-drift') },
      { type: 'music', props: { title: 'CASSETTE SIDE A' },
        styles: s({ backgroundColor: '#1f1040', color: '#ffe9f7', borderRadius: '24px' }, 'cyber-grid') },
      { type: 'events', props: { title: 'ARCADE TOUR', date: '2026-11-08', venue: 'Neon Palms', city: 'Miami', price: 60 },
        styles: s({ backgroundColor: '#160a2e', color: '#ffe9f7', border: '1px solid rgba(244,114,182,0.4)', borderRadius: '24px' }, 'slide-left') },
    ],
  },
  {
    id: 'studio-noir',
    name: 'Studio Noir',
    style: 'Dark minimal studio',
    description: 'Charcoal on charcoal, one hairline accent, everything resolves from a blur. Producer-grade restraint.',
    thumbnail: 'https://picsum.photos/seed/studio-noir/400/300',
    palette: { bg: '#0c0c0d', surface: '#131315', text: '#e8e8ea', accent: '#8b8b93' },
    blocks: [
      { type: 'hero', props: { title: 'Studio Noir', subtitle: 'Mixed in the dark. Mastered in silence.', cta: 'Monitor' },
        styles: s({ backgroundColor: '#0c0c0d', color: '#e8e8ea', borderTop: '1px solid #2a2a2e', borderRadius: '16px' }, 'scale-reveal') },
      { type: 'music', props: { title: 'Sessions' },
        styles: s({ backgroundColor: '#131315', color: '#e8e8ea', borderRadius: '16px' }, 'fade-up') },
      { type: 'gallery', props: { title: 'Console' },
        styles: s({ backgroundColor: '#0c0c0d', color: '#e8e8ea', borderRadius: '16px' }, 'fade-up') },
    ],
  },
  {
    id: 'pastel-pop',
    name: 'Pastel Pop',
    style: 'Playful pastel',
    description: 'Candy gradients, bouncy pops, rounded everything. Sunshine as a design system.',
    thumbnail: 'https://picsum.photos/seed/pastel-pop/400/300',
    palette: { bg: '#fff7f9', surface: '#ffffff', text: '#3b2f4a', accent: '#f9a8d4' },
    blocks: [
      { type: 'hero', props: { title: 'Pastel Pop!', subtitle: 'Songs that taste like strawberry soda', cta: 'Play Happy' },
        styles: s({ backgroundImage: 'linear-gradient(120deg, #fbcfe8, #ddd6fe, #bae6fd)', color: '#3b2f4a', borderRadius: '48px' }, 'typewriter-pop') },
      { type: 'music', props: { title: 'The Sweet Stuff' },
        styles: s({ backgroundColor: '#ffffff', color: '#3b2f4a', border: '3px solid #fbcfe8', borderRadius: '40px' }, 'float') },
      { type: 'store', props: { title: 'Cute Things' },
        styles: s({ backgroundColor: '#fff7f9', color: '#3b2f4a', borderRadius: '40px' }, 'fade-up') },
    ],
  },
  {
    id: 'terminal-green',
    name: 'Terminal',
    style: 'Hacker console',
    description: 'Phosphor green on black, monospace, scan-line flicker. The site boots instead of loading.',
    thumbnail: 'https://picsum.photos/seed/terminal-green/400/300',
    palette: { bg: '#020402', surface: '#04120a', text: '#4ade80', accent: '#4ade80' },
    blocks: [
      { type: 'hero', props: { title: '> SONIC.EXE_', subtitle: 'ACCESS GRANTED // AUDIO STREAM ONLINE', cta: 'RUN' },
        styles: s({ backgroundColor: '#020402', color: '#4ade80', fontFamily: '"JetBrains Mono", monospace', border: '1px solid #14532d', borderRadius: '8px' }, 'hologram') },
      { type: 'text', props: { content: '$ cat manifesto.txt — every track compiled from raw signal. no samples harmed.' },
        styles: s({ backgroundColor: '#04120a', color: '#4ade80', fontFamily: '"JetBrains Mono", monospace', borderRadius: '8px', textAlign: 'left' as const }, 'fade-up') },
      { type: 'music', props: { title: '/releases' },
        styles: s({ backgroundColor: '#020402', color: '#4ade80', fontFamily: '"JetBrains Mono", monospace', border: '1px dashed #14532d', borderRadius: '8px' }, 'glitch') },
    ],
  },
  {
    id: 'holo-deck',
    name: 'Holo Deck',
    style: 'Holographic futurist',
    description: 'Iridescent projection panels, orbital light sweeps, chromatic flicker. The site as a hologram.',
    thumbnail: 'https://picsum.photos/seed/holo-deck/400/300',
    palette: { bg: '#07070f', surface: '#0d0d1c', text: '#e9e9ff', accent: '#a855f7' },
    blocks: [
      { type: 'hero', props: { title: 'HOLO DECK', subtitle: 'Projected live from the year 2089', cta: 'Materialize' },
        styles: s({ backgroundColor: '#07070f', color: '#e9e9ff', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '28px' }, 'hologram') },
      { type: 'music', props: { title: 'Light Archives' },
        styles: s({ backgroundColor: '#0d0d1c', color: '#e9e9ff', borderRadius: '28px' }, 'orbital') },
      { type: 'gallery', props: { title: 'Projections' },
        styles: s({ backgroundColor: '#07070f', color: '#e9e9ff', borderRadius: '28px' }, 'scale-reveal') },
      { type: 'events', props: { title: 'Transmission Dates', date: '2026-12-01', venue: 'The Array', city: 'Tokyo', price: 90 },
        styles: s({ backgroundColor: '#0d0d1c', color: '#e9e9ff', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '28px' }, 'fade-up') },
    ],
  },
  {
    id: 'organic-flow',
    name: 'Organic Flow',
    style: 'Earthy curves',
    description: 'Warm clay tones and border radii that slowly morph like river stones. Human, tactile, alive.',
    thumbnail: 'https://picsum.photos/seed/organic-flow/400/300',
    palette: { bg: '#f7f1e8', surface: '#efe4d3', text: '#3d2f24', accent: '#c2410c' },
    blocks: [
      { type: 'hero', props: { title: 'Organic Flow', subtitle: 'Acoustic textures, grown not made', cta: 'Take Root' },
        styles: s({ backgroundColor: '#efe4d3', color: '#3d2f24', borderRadius: '60px' }, 'liquid-morph') },
      { type: 'text', props: { content: 'Recorded on tape, in rooms with wooden floors and open windows.' },
        styles: s({ backgroundColor: '#f7f1e8', color: '#5c4a3a', borderRadius: '48px' }, 'fade-up') },
      { type: 'music', props: { title: 'From the Soil' },
        styles: s({ backgroundColor: '#efe4d3', color: '#3d2f24', borderRadius: '52px' }, 'float') },
      { type: 'store', props: { title: 'Handmade' },
        styles: s({ backgroundColor: '#f7f1e8', color: '#3d2f24', border: '2px solid #c2410c', borderRadius: '48px' }, 'fade-up') },
    ],
  },
  {
    id: 'midnight-orbit',
    name: 'Midnight Orbit',
    style: 'Deep space',
    description: 'A drifting starfield, levitating panels, cosmic scale. Music from very far away.',
    thumbnail: 'https://picsum.photos/seed/midnight-orbit/400/300',
    palette: { bg: '#03040a', surface: '#0a0d1a', text: '#dbe4ff', accent: '#60a5fa' },
    blocks: [
      { type: 'hero', props: { title: 'MIDNIGHT ORBIT', subtitle: 'Transmissions from the outer dark', cta: 'Launch' },
        styles: s({ backgroundColor: '#03040a', color: '#dbe4ff', borderRadius: '32px' }, 'starfield-drift') },
      { type: 'music', props: { title: 'Signal Log' },
        styles: s({ backgroundColor: '#0a0d1a', color: '#dbe4ff', borderRadius: '28px' }, 'levitate-3d') },
      { type: 'text', props: { content: 'Composed in zero gravity. Mixed on re-entry.' },
        styles: s({ backgroundColor: '#03040a', color: '#9db4e8', borderRadius: '24px' }, 'float') },
    ],
  },
  {
    id: 'chrome-future',
    name: 'Chrome Future',
    style: 'Liquid chrome minimal',
    description: 'Silver gradients, mirror shimmer, machined precision. The Apple Store of artist sites.',
    thumbnail: 'https://picsum.photos/seed/chrome-future/400/300',
    palette: { bg: '#e9eaee', surface: '#f7f8fa', text: '#17181c', accent: '#6b7280' },
    blocks: [
      { type: 'hero', props: { title: 'Chrome Future', subtitle: 'Precision-engineered sound', cta: 'Experience' },
        styles: s({ backgroundImage: 'linear-gradient(135deg, #f7f8fa, #d7dae2, #f2f3f7)', color: '#17181c', borderRadius: '28px' }, 'shimmer') },
      { type: 'music', props: { title: 'The Lineup' },
        styles: s({ backgroundColor: '#f7f8fa', color: '#17181c', border: '1px solid #d7dae2', borderRadius: '24px' }, 'tilt-hover') },
      { type: 'store', props: { title: 'Hardware' },
        styles: s({ backgroundColor: '#e9eaee', color: '#17181c', borderRadius: '24px' }, 'fade-up') },
    ],
  },
  {
    id: 'festival-blaze',
    name: 'Festival Blaze',
    style: 'Bold festival poster',
    description: 'Sunset oranges, stadium-sized type, a pulse you can feel from the parking lot.',
    thumbnail: 'https://picsum.photos/seed/festival-blaze/400/300',
    palette: { bg: '#1c0a02', surface: '#2a1204', text: '#fff3e6', accent: '#fb923c' },
    blocks: [
      { type: 'hero', props: { title: 'BLAZE FEST', subtitle: 'Three days. One frequency.', cta: 'Get Tickets' },
        styles: s({ backgroundImage: 'linear-gradient(160deg, #431407, #9a3412, #fb923c)', color: '#fff3e6', borderRadius: '24px', textTransform: 'uppercase' as const }, 'pulse-ring') },
      { type: 'events', props: { title: 'MAIN STAGE', date: '2026-08-21', venue: 'Canyon Amphitheatre', city: 'Phoenix', price: 120 },
        styles: s({ backgroundColor: '#2a1204', color: '#fff3e6', border: '2px solid #fb923c', borderRadius: '24px' }, 'typewriter-pop') },
      { type: 'music', props: { title: 'THE LINEUP SOUND' },
        styles: s({ backgroundColor: '#1c0a02', color: '#fff3e6', borderRadius: '24px' }, 'slide-left') },
      { type: 'store', props: { title: 'FEST GEAR' },
        styles: s({ backgroundColor: '#2a1204', color: '#fff3e6', borderRadius: '24px' }, 'fade-up') },
    ],
  },
  {
    id: 'ink-press',
    name: 'Ink & Press',
    style: 'Light editorial serif',
    description: 'Cream paper, ink-black serif, generous whitespace. A broadsheet for your discography.',
    thumbnail: 'https://picsum.photos/seed/ink-press/400/300',
    palette: { bg: '#faf7f0', surface: '#ffffff', text: '#1a1712', accent: '#8c2f22' },
    blocks: [
      { type: 'hero', props: { title: 'Ink & Press', subtitle: 'Vol. 1 — The Recording Diaries', cta: 'Begin Reading' },
        styles: s({ backgroundColor: '#faf7f0', color: '#1a1712', fontFamily: 'Georgia, "Times New Roman", serif', borderBottom: '2px solid #1a1712', borderRadius: '4px' }, 'fade-up') },
      { type: 'text', props: { content: 'Chapter One — in which a song is written three times and the first version wins, as it always does.' },
        styles: s({ backgroundColor: '#ffffff', color: '#3a352c', fontFamily: 'Georgia, serif', textAlign: 'left' as const, borderRadius: '4px' }, 'curtain') },
      { type: 'music', props: { title: 'The Appendix (Listen)' },
        styles: s({ backgroundColor: '#faf7f0', color: '#1a1712', border: '1px solid #d9d2c3', borderRadius: '4px' }, 'fade-up') },
    ],
  },
  {
    id: 'deep-bass',
    name: 'Deep Bass',
    style: 'Club sub-bass red',
    description: 'Blood-red on black, slow subwoofer breathing. You can hear this template.',
    thumbnail: 'https://picsum.photos/seed/deep-bass/400/300',
    palette: { bg: '#0a0405', surface: '#160709', text: '#ffe4e6', accent: '#ef4444' },
    blocks: [
      { type: 'hero', props: { title: 'DEEP BASS', subtitle: '30Hz and below. Bring your chest.', cta: 'Feel It' },
        styles: s({ backgroundColor: '#0a0405', color: '#ffe4e6', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '20px' }, 'breathe') },
      { type: 'music', props: { title: 'SUB FREQUENCIES' },
        styles: s({ backgroundColor: '#160709', color: '#ffe4e6', borderRadius: '20px' }, 'pulse-ring') },
      { type: 'events', props: { title: 'BASEMENT SESSIONS', date: '2026-09-26', venue: 'The Bunker', city: 'Berlin', price: 30 },
        styles: s({ backgroundColor: '#0a0405', color: '#ffe4e6', borderRadius: '20px' }, 'fade-up') },
    ],
  },
  {
    id: 'cloud-soft',
    name: 'Cloud Soft',
    style: 'Clean light SaaS',
    description: 'Airy whites, soft blue accents, gentle float. Friendly, trustworthy, effortless.',
    thumbnail: 'https://picsum.photos/seed/cloud-soft/400/300',
    palette: { bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', accent: '#3b82f6' },
    blocks: [
      { type: 'hero', props: { title: 'Cloud Soft', subtitle: 'Your music, beautifully organized', cta: 'Start Free' },
        styles: s({ backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 24px 64px rgba(15,23,42,0.08)', borderRadius: '32px' }, 'fade-up') },
      { type: 'music', props: { title: 'Featured Work' },
        styles: s({ backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '28px' }, 'float') },
      { type: 'text', props: { content: 'Loved by 12,000 listeners and counting — replace with your own social proof.' },
        styles: s({ backgroundColor: '#ffffff', color: '#475569', borderRadius: '24px', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }, 'scale-reveal') },
      { type: 'store', props: { title: 'Plans & Merch' },
        styles: s({ backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '28px' }, 'fade-up') },
    ],
  },
  {
    id: 'vapor-dream',
    name: 'Vapor Dream',
    style: 'Vaporwave',
    description: 'Pink-teal haze, drifting gradients, mall-at-closing-time nostalgia rendered in 4K.',
    thumbnail: 'https://picsum.photos/seed/vapor-dream/400/300',
    palette: { bg: '#1e1b4b', surface: '#312e81', text: '#fdf4ff', accent: '#2dd4bf' },
    blocks: [
      { type: 'hero', props: { title: 'ＶＡＰＯＲ ＤＲＥＡＭ', subtitle: 'ｅｔｅｒｎａｌ ｓｕｎｓｅｔ ｍｏｄｅ', cta: 'ｅｎｔｅｒ' },
        styles: s({ backgroundImage: 'linear-gradient(135deg, #f0abfc, #818cf8, #2dd4bf)', color: '#1e1b4b', borderRadius: '24px' }, 'gradient-drift') },
      { type: 'music', props: { title: 'ＭＡＬＬ ＴＡＰＥＳ' },
        styles: s({ backgroundColor: '#312e81', color: '#fdf4ff', borderRadius: '24px' }, 'float') },
      { type: 'gallery', props: { title: 'ＡＥＳＴＨＥＴＩＣＳ' },
        styles: s({ backgroundColor: '#1e1b4b', color: '#fdf4ff', border: '1px solid rgba(45,212,191,0.4)', borderRadius: '24px' }, 'fade-up') },
    ],
  },
  {
    id: 'quantum-flux',
    name: 'Quantum Flux',
    style: 'Futuristic gradient mesh',
    description: 'Orbital light rings over a shifting energy field. The most future-forward concept in the set.',
    thumbnail: 'https://picsum.photos/seed/quantum-flux/400/300',
    palette: { bg: '#06060d', surface: '#0c0c1a', text: '#eaeaff', accent: '#8b5cf6' },
    blocks: [
      { type: 'hero', props: { title: 'QUANTUM FLUX', subtitle: 'Sound in superposition — every listen is different', cta: 'Collapse the Wave' },
        styles: s({ backgroundColor: '#06060d', color: '#eaeaff', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '32px' }, 'orbital') },
      { type: 'music', props: { title: 'Entangled States' },
        styles: s({ backgroundColor: '#0c0c1a', color: '#eaeaff', borderRadius: '28px' }, 'aurora') },
      { type: 'text', props: { content: 'Generative stems recombine on every play. No two streams are identical.' },
        styles: s({ backgroundColor: '#06060d', color: '#b9b9e8', borderRadius: '24px' }, 'hologram') },
      { type: 'events', props: { title: 'Observation Events', date: '2027-01-15', venue: 'The Collider', city: 'Geneva', price: 75 },
        styles: s({ backgroundColor: '#0c0c1a', color: '#eaeaff', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '28px' }, 'levitate-3d') },
    ],
  },
];



// ---------------------------------------------------------------------------
// 3D MOTION COLLECTION — 25 intense, perspective-driven templates.
//
// Same rule as everything else in the builder: loading one of these gives you
// ordinary blocks. Every animation, color, border and word is yours to edit
// or delete on the canvas — templates are starting points, never cages.
// ---------------------------------------------------------------------------

interface Concept3D {
  id: string; name: string; vibe: string; desc: string;
  bg: string; surface: string; text: string; accent: string;
  heroAnim: string; bodyAnim: string; accentAnim: string;
  title: string; subtitle: string; cta: string;
  sections: TemplateBlock['type'][];
  heroExtra?: CSSProperties;
}

const CONCEPTS_3D: Concept3D[] = [
  { id: 'vault-door', name: 'Vault Door', vibe: 'Heavy industrial 3D', desc: 'Sections swing open like bank vault doors on massive hinges.', bg: '#0b0b0c', surface: '#141416', text: '#e7e7ea', accent: '#f59e0b', heroAnim: 'door-reveal', bodyAnim: 'flip-x', accentAnim: 'zoom-parallax', title: 'THE VAULT', subtitle: 'Unlocked once per release cycle', cta: 'Open the Door', sections: ['music', 'store'] },
  { id: 'warp-gate', name: 'Warp Gate', vibe: 'Hyperspace arrival', desc: 'Everything flies in from deep Z-space at warp velocity.', bg: '#020208', surface: '#0a0a18', text: '#e0e7ff', accent: '#6366f1', heroAnim: 'tunnel-zoom', bodyAnim: 'tunnel-zoom', accentAnim: 'starfield-drift', title: 'WARP GATE', subtitle: 'Arrival velocity: immediate', cta: 'Jump', sections: ['music', 'events'] },
  { id: 'monolith-spin', name: 'Monolith', vibe: 'Rotating obelisk', desc: 'A slow, imposing full rotation — the site as sculpture.', bg: '#08080a', surface: '#101014', text: '#f4f4f5', accent: '#71717a', heroAnim: 'spin-carousel', bodyAnim: 'fade-up', accentAnim: 'levitate-3d', title: 'MONOLITH', subtitle: 'One object. Infinite faces.', cta: 'Circle It', sections: ['gallery', 'music'] },
  { id: 'card-dealer', name: 'Card Dealer', vibe: 'Casino shuffle', desc: 'Blocks deal onto the table with spin, offset and settle.', bg: '#052e16', surface: '#064e3b', text: '#ecfdf5', accent: '#fbbf24', heroAnim: 'card-shuffle', bodyAnim: 'card-shuffle', accentAnim: 'shimmer', title: 'HIGH STAKES', subtitle: 'Every drop is a fresh deal', cta: 'Ante Up', sections: ['music', 'store', 'events'] },
  { id: 'origami-fold', name: 'Origami', vibe: 'Paper unfolding', desc: 'Panels unfold from creases like paper craft coming alive.', bg: '#fdf6ec', surface: '#ffffff', text: '#292524', accent: '#dc2626', heroAnim: 'unfold', bodyAnim: 'unfold', accentAnim: 'fade-up', title: 'Origami', subtitle: 'Folded sound, opened gently', cta: 'Unfold', sections: ['text', 'music', 'gallery'] },
  { id: 'gravity-well', name: 'Gravity Well', vibe: 'Orbital physics', desc: 'Content levitates and settles in a deep shadow parallax field.', bg: '#030712', surface: '#0b1120', text: '#dbeafe', accent: '#38bdf8', heroAnim: 'levitate-3d', bodyAnim: 'zoom-parallax', accentAnim: 'float', title: 'GRAVITY WELL', subtitle: 'Heavy enough to bend the timeline', cta: 'Fall In', sections: ['music', 'events'] },
  { id: 'helix-tower', name: 'Helix Tower', vibe: 'DNA corkscrew', desc: 'Twin-axis corkscrew rotation — the most aggressive spin in the set.', bg: '#0c0118', surface: '#1a0533', text: '#f3e8ff', accent: '#c084fc', heroAnim: 'helix', bodyAnim: 'wave-rotate', accentAnim: 'orbital', title: 'HELIX', subtitle: 'Wound tight. Released loud.', cta: 'Unwind', sections: ['music', 'gallery'] },
  { id: 'pendulum-hall', name: 'Pendulum Hall', vibe: 'Swinging signage', desc: 'Every section sways on unseen chains like hall signs.', bg: '#1c1917', surface: '#292524', text: '#fafaf9', accent: '#ea580c', heroAnim: 'pendulum-3d', bodyAnim: 'pendulum-3d', accentAnim: 'fade-up', title: 'PENDULUM HALL', subtitle: 'Momentum you can hear', cta: 'Swing Through', sections: ['events', 'music'] },
  { id: 'vortex-drop', name: 'Vortex Drop', vibe: 'Spiral materialization', desc: 'Blocks spiral in from a blur — arrival as spectacle.', bg: '#111827', surface: '#1f2937', text: '#f9fafb', accent: '#10b981', heroAnim: 'vortex', bodyAnim: 'vortex', accentAnim: 'pulse-ring', title: 'VORTEX', subtitle: 'Spun from nothing into signal', cta: 'Get Pulled In', sections: ['music', 'store'] },
  { id: 'tumbler', name: 'Tumbler', vibe: 'Endless X-roll', desc: 'A relentless slow tumble that never lets the page sit still.', bg: '#18181b', surface: '#27272a', text: '#fafafa', accent: '#e11d48', heroAnim: 'tumble', bodyAnim: 'breathe', accentAnim: 'flip-x', title: 'TUMBLER', subtitle: 'Perpetual motion machine', cta: 'Keep Up', sections: ['gallery', 'music'] },
  { id: 'hangar-doors', name: 'Hangar', vibe: 'Mech-bay opening', desc: 'Industrial doors swing wide to reveal the payload.', bg: '#0a0f0d', surface: '#12211b', text: '#d1fae5', accent: '#34d399', heroAnim: 'door-reveal', bodyAnim: 'slide-left', accentAnim: 'cyber-grid', title: 'HANGAR 9', subtitle: 'Payload: 12 tracks. Status: armed.', cta: 'Deploy', sections: ['music', 'events', 'store'] },
  { id: 'kinetic-gallery', name: 'Kinetic Gallery', vibe: 'Museum in motion', desc: 'Artworks surf a rolling Z-depth wave through the room.', bg: '#fafafa', surface: '#ffffff', text: '#18181b', accent: '#0ea5e9', heroAnim: 'wave-rotate', bodyAnim: 'flip-x', accentAnim: 'scale-reveal', title: 'Kinetic Gallery', subtitle: 'The frames refuse to hang still', cta: 'Walk Through', sections: ['gallery', 'text', 'music'] },
  { id: 'launch-sequence', name: 'Launch Sequence', vibe: 'Countdown ignition', desc: 'Stages arrive in ignition order with escalating depth pops.', bg: '#0c0a09', surface: '#1c1917', text: '#fef3c7', accent: '#f97316', heroAnim: 'tunnel-zoom', bodyAnim: 'card-shuffle', accentAnim: 'pulse-ring', title: 'T-MINUS ZERO', subtitle: 'All systems loud', cta: 'Ignite', sections: ['events', 'music'] },
  { id: 'mirror-maze', name: 'Mirror Maze', vibe: 'Reflective spin', desc: 'Chrome surfaces rotating through light — disorienting on purpose.', bg: '#e5e7eb', surface: '#f9fafb', text: '#111827', accent: '#6b7280', heroAnim: 'spin-carousel', bodyAnim: 'shimmer', accentAnim: 'tilt-hover', title: 'MIRROR MAZE', subtitle: 'Every reflection plays a different mix', cta: 'Step In', sections: ['music', 'gallery'] },
  { id: 'deep-dive', name: 'Deep Dive', vibe: 'Submersible descent', desc: 'The page sinks through pressure layers with parallax breathing.', bg: '#041722', surface: '#082f3e', text: '#cffafe', accent: '#22d3ee', heroAnim: 'zoom-parallax', bodyAnim: 'float', accentAnim: 'aurora', title: 'DEEP DIVE', subtitle: '20,000 hertz under the sea', cta: 'Descend', sections: ['music', 'text'] },
  { id: 'quantum-flip', name: 'Quantum Flip', vibe: 'State-change flips', desc: 'Blocks flip between states like qubits collapsing.', bg: '#0f0518', surface: '#1e0a38', text: '#ede9fe', accent: '#a78bfa', heroAnim: 'flip-x', bodyAnim: 'flip-x', accentAnim: 'hologram', title: 'QUANTUM FLIP', subtitle: 'Both sides of every song', cta: 'Observe', sections: ['music', 'events'] },
  { id: 'colossus', name: 'Colossus', vibe: 'Giant slow rotation', desc: 'Monumental scale, glacially slow spin — power in restraint.', bg: '#1a1a1d', surface: '#242428', text: '#e4e4e7', accent: '#d4d4d8', heroAnim: 'spin-carousel', bodyAnim: 'scale-reveal', accentAnim: 'levitate-3d', title: 'COLOSSUS', subtitle: 'Too big to loop quietly', cta: 'Witness', sections: ['gallery', 'music', 'store'] },
  { id: 'zero-g-lab', name: 'Zero-G Lab', vibe: 'Weightless laboratory', desc: 'Instruments drift and tumble in a sterile white lab.', bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', accent: '#8b5cf6', heroAnim: 'levitate-3d', bodyAnim: 'tumble', accentAnim: 'float', title: 'ZERO-G LAB', subtitle: 'Experiments in weightless sound', cta: 'Enter Lab', sections: ['music', 'text'] },
  { id: 'blade-spin', name: 'Blade Spin', vibe: 'Turbine energy', desc: 'Fast rotation with neon trails — pure kinetic aggression.', bg: '#09090b', surface: '#131316', text: '#fee2e2', accent: '#ef4444', heroAnim: 'helix', bodyAnim: 'vortex', accentAnim: 'neon-pulse', title: 'BLADE SPIN', subtitle: 'RPM as a genre', cta: 'Rev It', sections: ['music', 'events'] },
  { id: 'paper-theater', name: 'Paper Theater', vibe: 'Pop-up book', desc: 'Scenes unfold and pop up like a hand-made paper theater.', bg: '#fef9ef', surface: '#fffbf2', text: '#44403c', accent: '#16a34a', heroAnim: 'unfold', bodyAnim: 'typewriter-pop', accentAnim: 'pendulum-3d', title: 'Paper Theater', subtitle: 'A stage that folds flat between shows', cta: 'Raise the Set', sections: ['events', 'gallery', 'music'] },
  { id: 'satellite-array', name: 'Satellite Array', vibe: 'Orbital station', desc: 'Panels hold formation while slowly rotating through space.', bg: '#020617', surface: '#0f172a', text: '#e2e8f0', accent: '#38bdf8', heroAnim: 'wave-rotate', bodyAnim: 'levitate-3d', accentAnim: 'starfield-drift', title: 'SATELLITE ARRAY', subtitle: 'Broadcasting from 400km up', cta: 'Tune In', sections: ['music', 'text', 'events'] },
  { id: 'strobe-chamber', name: 'Strobe Chamber', vibe: 'Club strobe 3D', desc: 'Vortex arrivals + pulsing glow — the club at peak hour.', bg: '#0a0208', surface: '#170415', text: '#fce7f3', accent: '#ec4899', heroAnim: 'vortex', bodyAnim: 'pulse-ring', accentAnim: 'card-shuffle', title: 'STROBE CHAMBER', subtitle: '128 BPM. 3 dimensions.', cta: 'Lose Yourself', sections: ['events', 'music'] },
  { id: 'clockwork', name: 'Clockwork', vibe: 'Mechanical precision', desc: 'Gears of content rotating in interlocked, opposing rhythms.', bg: '#161310', surface: '#221d17', text: '#f5e9d5', accent: '#b45309', heroAnim: 'spin-carousel', bodyAnim: 'pendulum-3d', accentAnim: 'tumble', title: 'CLOCKWORK', subtitle: 'Precision-machined rhythm', cta: 'Wind It Up', sections: ['music', 'store'] },
  { id: 'avalanche', name: 'Avalanche', vibe: 'Cascading impact', desc: 'Sections crash in one after another with overshooting force.', bg: '#f1f5f9', surface: '#ffffff', text: '#020617', accent: '#2563eb', heroAnim: 'card-shuffle', bodyAnim: 'tunnel-zoom', accentAnim: 'typewriter-pop', title: 'AVALANCHE', subtitle: 'Momentum is the message', cta: 'Trigger It', sections: ['music', 'store', 'events'] },
  { id: 'hall-of-doors', name: 'Hall of Doors', vibe: 'Sequential reveals', desc: 'A corridor where every section is another door swinging open.', bg: '#100c14', surface: '#1c1524', text: '#ede9fe', accent: '#7c3aed', heroAnim: 'door-reveal', bodyAnim: 'door-reveal', accentAnim: 'unfold', title: 'HALL OF DOORS', subtitle: 'Every track is a room', cta: 'Open the First', sections: ['music', 'gallery', 'events'] },
];

const SECTION_TITLES: Record<string, string> = {
  music: 'Featured Sound', gallery: 'Visual Log', store: 'The Shop',
  events: 'Live Dates', text: 'The Story',
};

export const TEMPLATES_3D: Template[] = CONCEPTS_3D.map((c) => ({
  id: `3d-${c.id}`,
  name: c.name,
  style: `3D Motion — ${c.vibe}`,
  description: `${c.desc} Fully editable: swap the animation, palette or copy on any block.`,
  thumbnail: `https://picsum.photos/seed/3d-${c.id}/400/300`,
  palette: { bg: c.bg, surface: c.surface, text: c.text, accent: c.accent },
  blocks: [
    {
      type: 'hero' as const,
      props: { title: c.title, subtitle: c.subtitle, cta: c.cta },
      styles: s({ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.accent}55`, borderRadius: '28px' }, c.heroAnim),
    },
    ...c.sections.map((type, i) => ({
      type,
      props: type === 'text'
        ? { content: `${c.desc} Replace this with your own story.` }
        : type === 'events'
          ? { title: SECTION_TITLES[type], date: '2026-11-20', venue: 'Main Room', city: 'Your City', price: 50 }
          : { title: SECTION_TITLES[type] },
      styles: s(
        { backgroundColor: i % 2 === 0 ? c.surface : c.bg, color: c.text, borderRadius: '24px' },
        i === 0 ? c.bodyAnim : c.accentAnim,
      ),
    })),
  ],
}));

/** Every template in the app — all of them load as fully editable blocks. */
export const ALL_TEMPLATES: Template[] = [...TEMPLATES, ...TEMPLATES_3D];

export function getTemplate(id: string): Template | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}
