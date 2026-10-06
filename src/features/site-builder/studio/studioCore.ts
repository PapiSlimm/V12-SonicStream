/**
 * Site Studio shared types + history store (2026-09-22).
 * Mirrors the server's SiteCompiler node schema, and implements the
 * blueprint's snapshot-pair history pattern: high-frequency edits mutate
 * `present` freely; a checkpoint is committed only on discrete gesture ends,
 * so dragging never floods the undo stack.
 */
import { useCallback, useRef, useState } from 'react';

export type Breakpoint = 'base' | 'tablet' | 'mobile';
export type StateLayer = Breakpoint | 'hover' | 'pressed';

export interface StudioNode {
  id: string;
  type: string;
  props?: {
    text?: string; src?: string; href?: string; alt?: string; level?: number;
    formId?: string; placeholder?: string; name?: string; poster?: string;
  };
  styles?: Partial<Record<StateLayer, Record<string, string>>>;
  freeLayout?: boolean;
  repeat?: string;
  children?: StudioNode[];
}

export interface PageDoc {
  title?: string;
  metaDescription?: string;
  ogImage?: string;
  tree: StudioNode;
}

/* ── tree utilities ───────────────────────────────────────────────────── */

export const genId = (p: string) => `${p}_${Math.random().toString(36).slice(2, 8)}`;

export function findNode(root: StudioNode, id: string): StudioNode | null {
  if (root.id === id) return root;
  for (const c of root.children || []) {
    const hit = findNode(c, id);
    if (hit) return hit;
  }
  return null;
}

export function findParent(root: StudioNode, id: string): StudioNode | null {
  for (const c of root.children || []) {
    if (c.id === id) return root;
    const hit = findParent(c, id);
    if (hit) return hit;
  }
  return null;
}

export function updateNode(root: StudioNode, id: string, fn: (n: StudioNode) => StudioNode): StudioNode {
  if (root.id === id) return fn({ ...root });
  if (!root.children) return root;
  return { ...root, children: root.children.map((c) => updateNode(c, id, fn)) };
}

export function removeNode(root: StudioNode, id: string): StudioNode {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)),
  };
}

export function insertChild(root: StudioNode, parentId: string, node: StudioNode, index: number): StudioNode {
  return updateNode(root, parentId, (p) => {
    const children = [...(p.children || [])];
    children.splice(Math.max(0, Math.min(index, children.length)), 0, node);
    return { ...p, children };
  });
}

/** Deep-clone a node with fresh ids (duplicate action). */
export function cloneWithIds(node: StudioNode): StudioNode {
  return {
    ...node,
    id: genId(node.type),
    children: (node.children || []).map(cloneWithIds),
  };
}

/* ── the blueprint's insertion-index algorithm (midpoint scan) ────────── */

export function calculateInsertionIndex(
  dropZone: HTMLElement,
  cursor: { x: number; y: number },
  flexDirection: 'row' | 'column' = 'column'
): number {
  const siblings = Array.from(dropZone.children).filter(
    (el) => (el as HTMLElement).dataset?.nodeId
  ) as HTMLElement[];
  if (siblings.length === 0) return 0;
  for (let i = 0; i < siblings.length; i++) {
    const rect = siblings[i].getBoundingClientRect();
    const center = flexDirection === 'row' ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
    const pos = flexDirection === 'row' ? cursor.x : cursor.y;
    if (pos < center) return i;
  }
  return siblings.length;
}

/* ── history store (past / present / future) ──────────────────────────── */

export function usePageHistory(initial: PageDoc) {
  const [present, setPresent] = useState<PageDoc>(initial);
  const past = useRef<PageDoc[]>([]);
  const future = useRef<PageDoc[]>([]);
  const [, force] = useState(0);
  const bump = () => force((n) => n + 1);

  /** High-frequency update: mutates present only; history untouched. */
  const update = useCallback((fn: (doc: PageDoc) => PageDoc) => {
    setPresent((doc) => fn(doc));
  }, []);

  /** Commit a checkpoint (call on gesture end / discrete action). */
  const commit = useCallback(() => {
    setPresent((doc) => {
      const last = past.current[past.current.length - 1];
      if (!last || JSON.stringify(last) !== JSON.stringify(doc)) {
        past.current = [...past.current.slice(-60), JSON.parse(JSON.stringify(doc))];
        future.current = [];
        bump();
      }
      return doc;
    });
  }, []);

  /** Discrete edit = update + checkpoint of the PREVIOUS state. */
  const edit = useCallback((fn: (doc: PageDoc) => PageDoc) => {
    setPresent((doc) => {
      past.current = [...past.current.slice(-60), JSON.parse(JSON.stringify(doc))];
      future.current = [];
      bump();
      return fn(doc);
    });
  }, []);

  const undo = useCallback(() => {
    setPresent((doc) => {
      if (!past.current.length) return doc;
      const prev = past.current[past.current.length - 1];
      past.current = past.current.slice(0, -1);
      future.current = [doc, ...future.current];
      bump();
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setPresent((doc) => {
      if (!future.current.length) return doc;
      const next = future.current[0];
      future.current = future.current.slice(1);
      past.current = [...past.current, doc];
      bump();
      return next;
    });
  }, []);

  const reset = useCallback((doc: PageDoc) => {
    past.current = []; future.current = [];
    setPresent(doc); bump();
  }, []);

  return {
    doc: present, update, edit, commit, undo, redo, reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}

/* ── element palette definitions ──────────────────────────────────────── */

export interface PaletteItem {
  type: string;
  label: string;
  icon: string;
  make: () => StudioNode;
}

export const PALETTE: PaletteItem[] = [
  { type: 'section', label: 'Section', icon: '▭', make: () => ({ id: genId('sec'), type: 'section', styles: { base: { padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '16px' } }, children: [] }) },
  { type: 'div', label: 'Stack', icon: '⿲', make: () => ({ id: genId('stack'), type: 'div', styles: { base: { display: 'flex', flexDirection: 'row', gap: '16px', flexWrap: 'wrap' } }, children: [] }) },
  { type: 'heading', label: 'Heading', icon: 'H', make: () => ({ id: genId('h'), type: 'heading', props: { text: 'Heading', level: 2 }, styles: { base: { fontSize: '36px', fontWeight: '800' }, mobile: { fontSize: '26px' } } }) },
  { type: 'text', label: 'Text', icon: '¶', make: () => ({ id: genId('t'), type: 'text', props: { text: 'Write something great.' }, styles: { base: { fontSize: '16px', lineHeight: '1.6', color: '#c7cad6' } } }) },
  { type: 'button', label: 'Button', icon: '⬢', make: () => ({ id: genId('btn'), type: 'button', props: { text: 'Click me', href: '#' }, styles: { base: { background: '#0d9488', color: '#ffffff', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', width: 'fit-content' }, hover: { transform: 'translateY(-2px)' }, pressed: { transform: 'scale(0.97)' } } }) },
  { type: 'image', label: 'Image', icon: '🖼', make: () => ({ id: genId('img'), type: 'image', props: { src: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=70', alt: 'Studio' }, styles: { base: { width: '100%', borderRadius: '14px', objectFit: 'cover', aspectRatio: '16/9' } } }) },
  { type: 'video', label: 'Video', icon: '▶', make: () => ({ id: genId('vid'), type: 'video', props: { src: '' }, styles: { base: { width: '100%', borderRadius: '14px' } } }) },
  { type: 'nav', label: 'Navbar', icon: '☰', make: () => ({ id: genId('nav'), type: 'nav', styles: { base: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px' } }, children: [ { id: genId('brand'), type: 'heading', props: { text: 'Brand', level: 3 }, styles: { base: { fontSize: '20px', fontWeight: '800' } } }, { id: genId('links'), type: 'div', styles: { base: { display: 'flex', gap: '20px' } }, children: [ { id: genId('l'), type: 'link', props: { text: 'Music', href: '#music' }, styles: { base: { color: '#c7cad6' }, hover: { color: '#ffffff' } } }, { id: genId('l'), type: 'link', props: { text: 'Shows', href: '#shows' }, styles: { base: { color: '#c7cad6' }, hover: { color: '#ffffff' } } } ] } ] }) },
  { type: 'form', label: 'Form', icon: '✉', make: () => ({ id: genId('form'), type: 'form', props: { formId: genId('f') }, styles: { base: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '420px' } }, children: [ { id: genId('in'), type: 'input', props: { name: 'email', placeholder: 'you@email.com' }, styles: { base: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #2a2f42', background: '#12141f', color: '#fff' } } }, { id: genId('ta'), type: 'textarea', props: { name: 'message', placeholder: 'Your message…' }, styles: { base: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #2a2f42', background: '#12141f', color: '#fff', minHeight: '110px' } } }, { id: genId('sub'), type: 'button', props: { text: 'Send' }, styles: { base: { background: '#0d9488', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontWeight: '700' } } } ] }) },
  { type: 'spacer', label: 'Spacer', icon: '↕', make: () => ({ id: genId('sp'), type: 'spacer', styles: { base: { height: '48px' } } }) },
  { type: 'list', label: 'CMS List', icon: '⚏', make: () => ({ id: genId('rep'), type: 'div', repeat: '', styles: { base: { display: 'flex', flexDirection: 'column', gap: '14px' } }, children: [ { id: genId('card'), type: 'div', styles: { base: { padding: '18px', background: '#12141f', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px' } }, children: [ { id: genId('ct'), type: 'heading', props: { text: '{{item.title}}', level: 3 }, styles: { base: { fontSize: '20px', fontWeight: '700' } } }, { id: genId('cd'), type: 'text', props: { text: '{{item.text}}' }, styles: { base: { color: '#8b90a5' } } } ] } ] }) },
];
