/**
 * Design-agent operations — the ONLY way the agent touches the canvas.
 *
 * The agent never mutates state directly. It proposes a list of typed,
 * human-readable operations; the user sees each one described, applies the
 * ones they want, and can undo any application. Every applied op produces
 * ordinary blocks — visible, editable, deletable in the properties panel.
 * (Deterministic application code; the model only ever proposes. V12
 * Constitution Art. I §1.4 in miniature.)
 */
import type { CSSProperties } from 'react';
import { animationStyles, getPreset } from './animations';

export type BlockType = 'hero' | 'music' | 'gallery' | 'store' | 'events' | 'text';
export const BLOCK_TYPES: BlockType[] = ['hero', 'music', 'gallery', 'store', 'events', 'text'];

export interface BuilderBlock {
  id: string;
  type: BlockType;
  props: Record<string, any>;
  styles: CSSProperties & { [k: string]: any };
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
}

export type DesignOp =
  | { op: 'add_block'; type: BlockType; props: Record<string, any>; styles?: Record<string, any>; animation?: string; index?: number }
  | { op: 'update_props'; blockId: string; props: Record<string, any> }
  | { op: 'update_styles'; blockId: string; styles: Record<string, any> }
  | { op: 'set_animation'; blockId: string; animation: string | null }
  | { op: 'move_block'; blockId: string; to: number }
  | { op: 'remove_block'; blockId: string }
  | { op: 'apply_theme'; theme: { backgroundColor?: string; surfaceColor?: string; textColor?: string; accentColor?: string; borderRadius?: string; fontFamily?: string } }
  | { op: 'replace_all'; blocks: { type: BlockType; props: Record<string, any>; styles?: Record<string, any> }[] };

const newId = () => Math.random().toString(36).slice(2, 11);

/** One plain-English line per op — what the user reads before applying. */
export function describeOp(op: DesignOp, blocks: BuilderBlock[]): string {
  const name = (id: string) => {
    const b = blocks.find((x) => x.id === id);
    return b ? `${b.type} block ("${String(b.props?.title ?? b.props?.content ?? '').slice(0, 28) || b.id}")` : `block ${id}`;
  };
  switch (op.op) {
    case 'add_block': return `Add a new ${op.type} block${op.animation ? ` with the "${getPreset(op.animation)?.name ?? op.animation}" animation` : ''}${op.index !== undefined ? ` at position ${op.index + 1}` : ''}`;
    case 'update_props': return `Rewrite content of ${name(op.blockId)}: ${Object.keys(op.props).join(', ')}`;
    case 'update_styles': return `Restyle ${name(op.blockId)}: ${Object.keys(op.styles).join(', ')}`;
    case 'set_animation': return op.animation ? `Animate ${name(op.blockId)} with "${getPreset(op.animation)?.name ?? op.animation}"` : `Remove animation from ${name(op.blockId)}`;
    case 'move_block': return `Move ${name(op.blockId)} to position ${op.to + 1}`;
    case 'remove_block': return `Remove ${name(op.blockId)}`;
    case 'apply_theme': return `Apply a page-wide theme (${Object.keys(op.theme).join(', ')})`;
    case 'replace_all': return `Replace the whole page with a ${op.blocks.length}-section draft`;
    default: return 'Unknown operation (will be ignored)';
  }
}

/** Reject anything malformed BEFORE it can touch the canvas. */
export function validateOp(raw: any): DesignOp | null {
  if (!raw || typeof raw !== 'object' || typeof raw.op !== 'string') return null;
  const okRecord = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
  switch (raw.op) {
    case 'add_block':
      if (!BLOCK_TYPES.includes(raw.type) || !okRecord(raw.props)) return null;
      return { op: 'add_block', type: raw.type, props: raw.props, styles: okRecord(raw.styles) ? raw.styles : undefined, animation: typeof raw.animation === 'string' ? raw.animation : undefined, index: Number.isInteger(raw.index) ? raw.index : undefined };
    case 'update_props':
      return typeof raw.blockId === 'string' && okRecord(raw.props) ? { op: 'update_props', blockId: raw.blockId, props: raw.props } : null;
    case 'update_styles':
      return typeof raw.blockId === 'string' && okRecord(raw.styles) ? { op: 'update_styles', blockId: raw.blockId, styles: raw.styles } : null;
    case 'set_animation':
      if (typeof raw.blockId !== 'string') return null;
      if (raw.animation !== null && (typeof raw.animation !== 'string' || !getPreset(raw.animation))) return null;
      return { op: 'set_animation', blockId: raw.blockId, animation: raw.animation };
    case 'move_block':
      return typeof raw.blockId === 'string' && Number.isInteger(raw.to) ? { op: 'move_block', blockId: raw.blockId, to: raw.to } : null;
    case 'remove_block':
      return typeof raw.blockId === 'string' ? { op: 'remove_block', blockId: raw.blockId } : null;
    case 'apply_theme':
      return okRecord(raw.theme) ? { op: 'apply_theme', theme: raw.theme } : null;
    case 'replace_all':
      if (!Array.isArray(raw.blocks) || raw.blocks.length === 0 || raw.blocks.length > 12) return null;
      if (!raw.blocks.every((b: any) => okRecord(b) && BLOCK_TYPES.includes(b.type) && okRecord(b.props))) return null;
      return { op: 'replace_all', blocks: raw.blocks };
    default:
      return null;
  }
}

/** Pure application — returns NEW blocks, never mutates. */
export function applyOps(blocks: BuilderBlock[], ops: DesignOp[]): BuilderBlock[] {
  let next = blocks.map((b) => ({ ...b, props: { ...b.props }, styles: { ...b.styles } }));
  for (const op of ops) {
    switch (op.op) {
      case 'add_block': {
        const block: BuilderBlock = {
          id: newId(),
          type: op.type,
          props: op.props,
          styles: { padding: '60px 0', backgroundColor: 'transparent', ...(op.styles ?? {}), ...(op.animation ? animationStyles(op.animation) : {}) },
        };
        const at = op.index !== undefined ? Math.max(0, Math.min(op.index, next.length)) : next.length;
        next = [...next.slice(0, at), block, ...next.slice(at)];
        break;
      }
      case 'update_props':
        next = next.map((b) => (b.id === op.blockId ? { ...b, props: { ...b.props, ...op.props } } : b));
        break;
      case 'update_styles':
        next = next.map((b) => (b.id === op.blockId ? { ...b, styles: { ...b.styles, ...op.styles } } : b));
        break;
      case 'set_animation':
        next = next.map((b) => {
          if (b.id !== op.blockId) return b;
          const styles = { ...b.styles };
          delete (styles as any).animation;
          return { ...b, styles: { ...styles, ...(op.animation ? animationStyles(op.animation) : {}) } };
        });
        break;
      case 'move_block': {
        const from = next.findIndex((b) => b.id === op.blockId);
        if (from < 0) break;
        const to = Math.max(0, Math.min(op.to, next.length - 1));
        const copy = [...next];
        const [moved] = copy.splice(from, 1);
        copy.splice(to, 0, moved);
        next = copy;
        break;
      }
      case 'remove_block':
        next = next.filter((b) => b.id !== op.blockId);
        break;
      case 'apply_theme':
        next = next.map((b, i) => ({
          ...b,
          styles: {
            ...b.styles,
            ...(op.theme.backgroundColor ? { backgroundColor: i % 2 === 0 ? op.theme.backgroundColor : (op.theme.surfaceColor ?? op.theme.backgroundColor) } : {}),
            ...(op.theme.textColor ? { color: op.theme.textColor } : {}),
            ...(op.theme.borderRadius ? { borderRadius: op.theme.borderRadius } : {}),
            ...(op.theme.fontFamily ? { fontFamily: op.theme.fontFamily } : {}),
            ...(op.theme.accentColor ? { borderColor: op.theme.accentColor } : {}),
          },
        }));
        break;
      case 'replace_all':
        next = op.blocks.map((b) => ({
          id: newId(),
          type: b.type,
          props: b.props,
          styles: { padding: '60px 0', backgroundColor: 'transparent', ...(b.styles ?? {}) },
        }));
        break;
    }
  }
  return next;
}
