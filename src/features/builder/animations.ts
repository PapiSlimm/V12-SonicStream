/**
 * SonicStream Builder — animation preset library.
 *
 * Every preset is plain CSS: a keyframes definition plus the `animation`
 * shorthand (and optional companion properties) that goes straight into a
 * block's `styles`. Nothing is hidden in JS — what you see in the properties
 * panel is exactly what renders, and removing `styles.animation` removes the
 * motion. Inject <AnimationKeyframes/> once wherever blocks render.
 */
import { createElement, type ReactElement, type CSSProperties } from 'react';

export type AnimationCategory = 'entrance' | 'ambient' | 'attention' | 'futuristic';

export interface AnimationPreset {
  id: string;
  name: string;
  category: AnimationCategory;
  description: string;
  /** The `animation` CSS shorthand applied to the block. */
  animation: string;
  /** Companion properties (filters, transforms, gradients) applied with it. */
  extras?: CSSProperties;
  /** Raw @keyframes CSS this preset depends on. */
  keyframes: string;
}

export const ANIMATION_PRESETS: AnimationPreset[] = [
  // — Entrances —
  {
    id: 'fade-up', name: 'Fade Up', category: 'entrance',
    description: 'Soft rise-and-fade in — the safe default for any section.',
    animation: 'ssFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both',
    keyframes: `@keyframes ssFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}`,
  },
  {
    id: 'slide-left', name: 'Slide In', category: 'entrance',
    description: 'Slides in from the right with a settling ease.',
    animation: 'ssSlideLeft 0.8s cubic-bezier(0.22,1,0.36,1) both',
    keyframes: `@keyframes ssSlideLeft{from{opacity:0;transform:translateX(48px)}to{opacity:1;transform:translateX(0)}}`,
  },
  {
    id: 'scale-reveal', name: 'Scale Reveal', category: 'entrance',
    description: 'Grows from 92% with a blur that resolves to sharp.',
    animation: 'ssScaleReveal 1s cubic-bezier(0.22,1,0.36,1) both',
    keyframes: `@keyframes ssScaleReveal{from{opacity:0;transform:scale(0.92);filter:blur(8px)}to{opacity:1;transform:scale(1);filter:blur(0)}}`,
  },
  {
    id: 'curtain', name: 'Curtain Wipe', category: 'entrance',
    description: 'Content revealed by a wipe, like a stage curtain.',
    animation: 'ssCurtain 1.1s cubic-bezier(0.77,0,0.18,1) both',
    keyframes: `@keyframes ssCurtain{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}`,
  },
  {
    id: 'typewriter-pop', name: 'Cascade Pop', category: 'entrance',
    description: 'Snappy overshoot pop — good for CTAs and product cards.',
    animation: 'ssPop 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
    keyframes: `@keyframes ssPop{0%{opacity:0;transform:scale(0.6)}80%{transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}`,
  },

  // — Ambient —
  {
    id: 'float', name: 'Float', category: 'ambient',
    description: 'Slow weightless drift, like the block is in orbit.',
    animation: 'ssFloat 7s ease-in-out infinite',
    keyframes: `@keyframes ssFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}`,
  },
  {
    id: 'breathe', name: 'Breathe', category: 'ambient',
    description: 'Barely-there scale pulse that keeps a hero alive.',
    animation: 'ssBreathe 6s ease-in-out infinite',
    keyframes: `@keyframes ssBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.015)}}`,
  },
  {
    id: 'gradient-drift', name: 'Gradient Drift', category: 'ambient',
    description: 'Background gradient slowly wanders across the block.',
    animation: 'ssGradientDrift 14s ease infinite',
    extras: { backgroundSize: '300% 300%' },
    keyframes: `@keyframes ssGradientDrift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`,
  },
  {
    id: 'shimmer', name: 'Shimmer', category: 'ambient',
    description: 'A light band sweeps across, premium-retail style.',
    animation: 'ssShimmer 3.2s linear infinite',
    extras: {
      backgroundImage: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
      backgroundSize: '250% 100%',
    },
    keyframes: `@keyframes ssShimmer{from{background-position:200% 0}to{background-position:-50% 0}}`,
  },

  // — Attention —
  {
    id: 'pulse-ring', name: 'Pulse', category: 'attention',
    description: 'Soft glow pulse for the one thing users must notice.',
    animation: 'ssPulse 2.4s ease-in-out infinite',
    keyframes: `@keyframes ssPulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.35)}50%{box-shadow:0 0 0 16px rgba(16,185,129,0)}}`,
  },
  {
    id: 'tilt-hover', name: 'Kinetic Tilt', category: 'attention',
    description: 'Perpetual subtle 3D sway — cards feel physical.',
    animation: 'ssTilt 9s ease-in-out infinite',
    extras: { transformStyle: 'preserve-3d' as const, perspective: '900px' },
    keyframes: `@keyframes ssTilt{0%,100%{transform:rotateX(0deg) rotateY(0deg)}25%{transform:rotateX(1.6deg) rotateY(-1.6deg)}75%{transform:rotateX(-1.6deg) rotateY(1.6deg)}}`,
  },

  // — Futuristic —
  {
    id: 'neon-pulse', name: 'Neon Pulse', category: 'futuristic',
    description: 'Cyberpunk neon glow that charges and releases.',
    animation: 'ssNeon 2.8s ease-in-out infinite',
    keyframes: `@keyframes ssNeon{0%,100%{box-shadow:0 0 8px rgba(34,211,238,0.35),0 0 24px rgba(34,211,238,0.15),inset 0 0 12px rgba(34,211,238,0.06)}50%{box-shadow:0 0 20px rgba(34,211,238,0.7),0 0 64px rgba(34,211,238,0.3),inset 0 0 24px rgba(34,211,238,0.12)}}`,
  },
  {
    id: 'aurora', name: 'Aurora Veil', category: 'futuristic',
    description: 'Northern-lights gradient sheet flowing behind content.',
    animation: 'ssAurora 16s ease-in-out infinite',
    extras: {
      backgroundImage: 'linear-gradient(115deg, rgba(34,211,238,0.16), rgba(168,85,247,0.16), rgba(16,185,129,0.16), rgba(59,130,246,0.16))',
      backgroundSize: '400% 400%',
    },
    keyframes: `@keyframes ssAurora{0%,100%{background-position:0% 30%}33%{background-position:80% 70%}66%{background-position:30% 100%}}`,
  },
  {
    id: 'hologram', name: 'Hologram', category: 'futuristic',
    description: 'Scan-line flicker + chromatic shift, projection style.',
    animation: 'ssHologram 5s linear infinite',
    extras: {
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(34,211,238,0.05) 0px, rgba(34,211,238,0.05) 1px, transparent 2px, transparent 5px)',
    },
    keyframes: `@keyframes ssHologram{0%,92%,100%{opacity:1;filter:none}93%{opacity:0.86;filter:hue-rotate(18deg)}95%{opacity:0.96;filter:hue-rotate(-12deg) saturate(1.4)}97%{opacity:0.9;filter:none}}`,
  },
  {
    id: 'glitch', name: 'Glitch', category: 'futuristic',
    description: 'Occasional digital tear — brutalist / underground energy.',
    animation: 'ssGlitch 6s steps(1) infinite',
    keyframes: `@keyframes ssGlitch{0%,93%,100%{transform:translate(0);filter:none}94%{transform:translate(-3px,1px);filter:drop-shadow(2px 0 rgba(255,0,80,0.7)) drop-shadow(-2px 0 rgba(0,220,255,0.7))}95%{transform:translate(2px,-1px)}96%{transform:translate(0);filter:none}}`,
  },
  {
    id: 'cyber-grid', name: 'Cyber Grid', category: 'futuristic',
    description: 'Perspective grid scrolling underneath — synthwave floor.',
    animation: 'ssGrid 4s linear infinite',
    extras: {
      backgroundImage: 'linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.12) 1px, transparent 1px)',
      backgroundSize: '42px 42px',
    },
    keyframes: `@keyframes ssGrid{from{background-position:0 0,0 0}to{background-position:0 42px,42px 0}}`,
  },
  {
    id: 'orbital', name: 'Orbital Ring', category: 'futuristic',
    description: 'A conic light ring sweeps the block border like a radar.',
    animation: 'ssOrbital 5s linear infinite',
    extras: {
      backgroundImage: 'conic-gradient(from 0deg, transparent 0deg, rgba(168,85,247,0.18) 40deg, transparent 90deg)',
    },
    keyframes: `@keyframes ssOrbital{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}`,
  },
  {
    id: 'levitate-3d', name: 'Levitate 3D', category: 'futuristic',
    description: 'Hover + shadow parallax — the block truly floats.',
    animation: 'ssLevitate 8s ease-in-out infinite',
    extras: { transformStyle: 'preserve-3d' as const },
    keyframes: `@keyframes ssLevitate{0%,100%{transform:translateY(0) rotateX(0);box-shadow:0 12px 32px rgba(0,0,0,0.45)}50%{transform:translateY(-16px) rotateX(2deg);box-shadow:0 42px 64px rgba(0,0,0,0.6)}}`,
  },
  {
    id: 'liquid-morph', name: 'Liquid Morph', category: 'futuristic',
    description: 'Border radius slowly morphs — organic, alive geometry.',
    animation: 'ssMorph 12s ease-in-out infinite',
    keyframes: `@keyframes ssMorph{0%,100%{border-radius:24px}25%{border-radius:60px 24px 48px 30px}50%{border-radius:36px 60px 24px 52px}75%{border-radius:52px 30px 60px 24px}}`,
  },
  {
    id: 'starfield-drift', name: 'Starfield', category: 'futuristic',
    description: 'Particle dots drifting past — deep-space backdrop.',
    animation: 'ssStars 60s linear infinite',
    extras: {
      backgroundImage: 'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.5) 50%, transparent 50%), radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,0.35) 50%, transparent 50%), radial-gradient(2px 2px at 80% 20%, rgba(255,255,255,0.4) 50%, transparent 50%), radial-gradient(1px 1px at 40% 90%, rgba(255,255,255,0.3) 50%, transparent 50%)',
      backgroundSize: '260px 260px',
    },
    keyframes: `@keyframes ssStars{from{background-position:0 0}to{background-position:-520px 260px}}`,
  },
  // — 3D Motion pack (intense, perspective-driven) —
  {
    id: 'spin-carousel', name: 'Spin Carousel', category: 'futuristic',
    description: 'Full Y-axis rotation on a perspective stage.',
    animation: 'ssSpinY 12s linear infinite',
    extras: { transformStyle: 'preserve-3d' as const, perspective: '1200px' },
    keyframes: `@keyframes ssSpinY{from{transform:perspective(1200px) rotateY(0deg)}to{transform:perspective(1200px) rotateY(360deg)}}`,
  },
  {
    id: 'flip-x', name: 'Flip Reveal', category: 'futuristic',
    description: 'Card flips up from flat — a dramatic 3D entrance.',
    animation: 'ssFlipX 1.2s cubic-bezier(0.22,1,0.36,1) both',
    extras: { transformStyle: 'preserve-3d' as const },
    keyframes: `@keyframes ssFlipX{from{opacity:0;transform:perspective(1000px) rotateX(-72deg)}to{opacity:1;transform:perspective(1000px) rotateX(0)}}`,
  },
  {
    id: 'door-reveal', name: 'Door Reveal', category: 'futuristic',
    description: 'Swings open on its left hinge like a vault door.',
    animation: 'ssDoor 1.4s cubic-bezier(0.22,1,0.36,1) both',
    extras: { transformOrigin: 'left center', transformStyle: 'preserve-3d' as const },
    keyframes: `@keyframes ssDoor{from{opacity:0;transform:perspective(1400px) rotateY(-84deg)}to{opacity:1;transform:perspective(1400px) rotateY(0)}}`,
  },
  {
    id: 'tunnel-zoom', name: 'Tunnel Zoom', category: 'futuristic',
    description: 'Flies in from deep Z-space — warp-speed arrival.',
    animation: 'ssTunnel 1.1s cubic-bezier(0.16,1,0.3,1) both',
    keyframes: `@keyframes ssTunnel{from{opacity:0;transform:perspective(900px) translateZ(-600px)}to{opacity:1;transform:perspective(900px) translateZ(0)}}`,
  },
  {
    id: 'tumble', name: 'Tumble', category: 'futuristic',
    description: 'Continuous X-axis tumble — relentless, hypnotic.',
    animation: 'ssTumble 14s linear infinite',
    extras: { transformStyle: 'preserve-3d' as const },
    keyframes: `@keyframes ssTumble{from{transform:perspective(1200px) rotateX(0)}to{transform:perspective(1200px) rotateX(360deg)}}`,
  },
  {
    id: 'pendulum-3d', name: 'Pendulum 3D', category: 'futuristic',
    description: 'Swings through depth like a sign in the wind.',
    animation: 'ssPendulum 5s ease-in-out infinite',
    extras: { transformOrigin: 'top center', transformStyle: 'preserve-3d' as const },
    keyframes: `@keyframes ssPendulum{0%,100%{transform:perspective(1000px) rotateX(6deg) rotateZ(-2deg)}50%{transform:perspective(1000px) rotateX(-6deg) rotateZ(2deg)}}`,
  },
  {
    id: 'helix', name: 'Helix', category: 'futuristic',
    description: 'Corkscrew rotation through two axes at once.',
    animation: 'ssHelix 10s linear infinite',
    extras: { transformStyle: 'preserve-3d' as const },
    keyframes: `@keyframes ssHelix{from{transform:perspective(1200px) rotateY(0) rotateZ(0)}to{transform:perspective(1200px) rotateY(360deg) rotateZ(360deg)}}`,
  },
  {
    id: 'card-shuffle', name: 'Card Shuffle', category: 'futuristic',
    description: 'Deals in with rotation, offset and settle.',
    animation: 'ssShuffle 1.1s cubic-bezier(0.34,1.56,0.64,1) both',
    keyframes: `@keyframes ssShuffle{0%{opacity:0;transform:perspective(1000px) translateX(-120px) rotateZ(-14deg) rotateY(30deg)}70%{transform:perspective(1000px) translateX(8px) rotateZ(1.5deg) rotateY(-4deg)}100%{opacity:1;transform:perspective(1000px) translateX(0) rotateZ(0) rotateY(0)}}`,
  },
  {
    id: 'wave-rotate', name: 'Wave Rotate', category: 'futuristic',
    description: 'Rolling Z-depth wave — the block surfs.',
    animation: 'ssWaveRot 7s ease-in-out infinite',
    extras: { transformStyle: 'preserve-3d' as const },
    keyframes: `@keyframes ssWaveRot{0%,100%{transform:perspective(1000px) translateZ(0) rotateY(0)}25%{transform:perspective(1000px) translateZ(40px) rotateY(4deg)}75%{transform:perspective(1000px) translateZ(-30px) rotateY(-4deg)}}`,
  },
  {
    id: 'zoom-parallax', name: 'Zoom Parallax', category: 'futuristic',
    description: 'Deep push-pull breathing on the Z axis.',
    animation: 'ssZoomPar 9s ease-in-out infinite',
    keyframes: `@keyframes ssZoomPar{0%,100%{transform:perspective(1100px) translateZ(0) scale(1)}50%{transform:perspective(1100px) translateZ(70px) scale(1.02)}}`,
  },
  {
    id: 'vortex', name: 'Vortex', category: 'futuristic',
    description: 'Spirals in from a spun-out blur — maximum drama.',
    animation: 'ssVortex 1.3s cubic-bezier(0.16,1,0.3,1) both',
    keyframes: `@keyframes ssVortex{from{opacity:0;transform:perspective(900px) rotateZ(180deg) scale(0.3);filter:blur(12px)}to{opacity:1;transform:perspective(900px) rotateZ(0) scale(1);filter:blur(0)}}`,
  },
  {
    id: 'unfold', name: 'Unfold', category: 'futuristic',
    description: 'Unfolds from a horizontal crease like opening a letter.',
    animation: 'ssUnfold 1.3s cubic-bezier(0.22,1,0.36,1) both',
    extras: { transformOrigin: 'center top', transformStyle: 'preserve-3d' as const },
    keyframes: `@keyframes ssUnfold{0%{opacity:0;transform:perspective(1200px) rotateX(88deg)}60%{opacity:1;transform:perspective(1200px) rotateX(-8deg)}100%{transform:perspective(1200px) rotateX(0)}}`,
  },
];

export function getPreset(id: string | undefined | null): AnimationPreset | undefined {
  return ANIMATION_PRESETS.find((p) => p.id === id);
}

/** styles fragment for a preset id — spread into a block's `styles`. */
export function animationStyles(id: string | undefined | null): CSSProperties {
  const p = getPreset(id);
  if (!p) return {};
  return { animation: p.animation, ...(p.extras ?? {}) };
}

/** All keyframes concatenated — inject once per page. */
export function allKeyframesCss(): string {
  return ANIMATION_PRESETS.map((p) => p.keyframes).join('\n');
}

/** Drop-in <style> element with every preset's keyframes. */
export function AnimationKeyframes(): ReactElement {
  return createElement('style', { 'data-ss-animations': true }, allKeyframesCss());
}
