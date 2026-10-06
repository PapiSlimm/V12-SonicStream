/**
 * SiteCompiler — SonicStream Site Builder's secure production compiler.
 * (2026-09-22, implements the WEB_BUILDER blueprint server-side.)
 *
 * Design-time state is a layout tree (nodes with per-breakpoint styles,
 * interactive states, optional canvas coordinates, CMS bindings). This module
 * is the "ironclad firebreak" between that user-authored JSON and what gets
 * served to the public:
 *
 *   • Structural enforcement — only ALLOWED_TAGS compile; anything else is a
 *     hard error, never silently rendered.
 *   • Style allowlist — only ALLOWED_STYLES pass (layout, typography, visual,
 *     and the 3D transform set); unknown keys are dropped.
 *   • XSS stripping — javascript:/data:text URLs, on*= handlers, expression(),
 *     and raw angle brackets are neutralized in every string that reaches
 *     markup, styles, or attributes.
 *   • Absolute→flex translation — nodes dropped with canvas coordinates inside
 *     a free-layout container are ordered by position and their offsets become
 *     margins/gap, per the blueprint's coordinate algorithm.
 *   • Breakpoints — styles.base inherits down; styles.tablet / styles.mobile
 *     compile to max-width media queries (1024px / 640px).
 *   • Interactive states — styles.hover / styles.pressed compile to
 *     :hover / :active rules.
 *   • 3D — perspective/transform/transform-style/translateZ pass the allowlist
 *     and the page root establishes a perspective context when any node uses
 *     them; will-change is emitted for transformed nodes.
 *   • CMS bindings — {{collection-slug.field}} in text/src/href interpolates
 *     from provided collections (sanitized), and node.repeat renders the
 *     node's children once per collection item.
 *
 * Output: semantic HTML5 (+ meta/OG head, form wiring, sitemap helper) and a
 * single static stylesheet of atomized `.ss-<nodeid>` classes. No editor
 * runtime, no scripts, except the minimal form-submit handler.
 */

export interface SiteNode {
  id: string;
  type: string;                       // must be in ALLOWED_TAGS
  props?: {
    text?: string;
    src?: string;
    href?: string;
    alt?: string;
    level?: number;                   // heading level 1..3
    formId?: string;
    placeholder?: string;
    name?: string;
    poster?: string;
  };
  /** Per-breakpoint + per-state style maps. base inherits downward. */
  styles?: {
    base?: Record<string, string | number>;
    tablet?: Record<string, string | number>;
    mobile?: Record<string, string | number>;
    hover?: Record<string, string | number>;
    pressed?: Record<string, string | number>;
  };
  /** Free-canvas drop coordinates (design-time); translated, never emitted raw. */
  canvasX?: number;
  canvasY?: number;
  /** Container free-layout flag: children carry canvas coords. */
  freeLayout?: boolean;
  /** CMS repeat: render children once per item of this collection slug. */
  repeat?: string;
  children?: SiteNode[];
}

export interface SitePageInput {
  title?: string;
  metaDescription?: string;
  ogImage?: string;
  tree: SiteNode;                     // root node (type 'page' or 'section')
}

export interface CollectionsData {
  /** slug -> array of item field maps */
  [slug: string]: Array<Record<string, string | number>>;
}

const ALLOWED_TAGS = new Set([
  'page', 'section', 'div', 'nav', 'heading', 'text', 'button', 'link',
  'image', 'video', 'form', 'input', 'textarea', 'spacer', 'list', 'listitem',
]);

const ALLOWED_STYLES = new Set([
  // layout
  'display', 'flexDirection', 'flexWrap', 'gap', 'justifyContent', 'alignItems',
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'width', 'height', 'minHeight', 'maxWidth', 'position', 'top', 'left', 'zIndex',
  'gridTemplateColumns', 'overflow',
  // typography
  'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing',
  'textAlign', 'textTransform', 'textDecoration',
  // visual
  'background', 'backgroundColor', 'backgroundImage', 'backgroundSize',
  'backgroundPosition', 'color', 'border', 'borderRadius', 'borderColor',
  'boxShadow', 'opacity', 'objectFit', 'aspectRatio', 'filter', 'backdropFilter',
  'visibility', 'cursor',
  // 3D + motion (the blueprint's spatial set)
  'perspective', 'perspectiveOrigin', 'transform', 'transformStyle',
  'transition', 'willChange',
]);

const BP_TABLET = 1024;
const BP_MOBILE = 640;

/* ── sanitization ─────────────────────────────────────────────────────── */

export function sanitizeText(value: unknown): string {
  const s = String(value ?? '');
  return s
    .replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'))
    .replace(/(javascript:|vbscript:|data:text\/html|expression\s*\(|on\w+\s*=)/gi, 'blocked_');
}

export function sanitizeStyleValue(value: unknown): string {
  const s = String(value ?? '');
  return s
    .replace(/[<>{}]/g, '')
    .replace(/(javascript:|expression\s*\(|@import|url\s*\(\s*['"]?\s*(javascript|data:text))/gi, 'blocked_')
    .slice(0, 400);
}

export function sanitizeUrl(value: unknown): string {
  const s = String(value ?? '').trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(s) && !/javascript:/i.test(s)) {
    return s.replace(/"/g, '%22').slice(0, 2000);
  }
  return '#';
}

const kebab = (k: string) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
const cleanId = (id: string) => String(id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'n';

/* ── CMS binding interpolation ────────────────────────────────────────── */

function interpolate(raw: string, scope: Record<string, string | number> | null, collections: CollectionsData): string {
  return String(raw).replace(/\{\{\s*([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)(?:\[(\d+)\])?\s*\}\}/g, (_m, slug, field, idx) => {
    if (scope && slug === 'item') return String(scope[field] ?? '');
    const items = collections[slug];
    if (!items || !items.length) return '';
    const item = items[Math.min(Number(idx || 0), items.length - 1)];
    return String(item?.[field] ?? '');
  });
}

/* ── absolute → flex ordering (the blueprint's coordinate algorithm) ──── */

function orderFreeChildren(children: SiteNode[]): SiteNode[] {
  const positioned = children.map((c, i) => ({
    c, i,
    x: typeof c.canvasX === 'number' ? c.canvasX : i * 10_000,
    y: typeof c.canvasY === 'number' ? c.canvasY : i * 10_000,
  }));
  // Column flow: order by Y midline, X as tiebreaker.
  positioned.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  let prevBottomY = 0;
  return positioned.map(({ c, x, y }) => {
    const styles = { ...(c.styles || {}) };
    const base = { ...(styles.base || {}) };
    if (typeof c.canvasX === 'number' || typeof c.canvasY === 'number') {
      // Residual offsets become margins; raw top/left never ship.
      const gapY = Math.max(0, Math.round(y - prevBottomY));
      if (gapY > 0 && base.marginTop === undefined) base.marginTop = `${Math.min(gapY, 400)}px`;
      if (x > 0 && base.marginLeft === undefined) base.marginLeft = `${Math.min(Math.round(x), 800)}px`;
      prevBottomY = y + 40; // conservative flow estimate; real height unknown server-side
    }
    styles.base = base;
    const { canvasX, canvasY, ...rest } = c;
    return { ...rest, styles };
  });
}

/* ── style compilation ────────────────────────────────────────────────── */

function styleBlock(map: Record<string, string | number> | undefined): string {
  if (!map) return '';
  const out: string[] = [];
  for (const [k, v] of Object.entries(map)) {
    if (!ALLOWED_STYLES.has(k)) continue;
    const val = sanitizeStyleValue(v);
    if (!val) continue;
    out.push(`${kebab(k)}:${val}`);
  }
  return out.join(';');
}

/* ── the compiler ─────────────────────────────────────────────────────── */

export interface CompileResult {
  html: string;
  css: string;
  errors: string[];
  uses3d: boolean;
}

export function compilePage(page: SitePageInput, collections: CollectionsData = {}, opts: { formAction?: (formId: string) => string } = {}): CompileResult {
  const cssRules: string[] = [];
  const errors: string[] = [];
  let uses3d = false;

  const emitNodeCss = (node: SiteNode) => {
    const cls = `ss-${cleanId(node.id)}`;
    const s = node.styles || {};
    const base = styleBlock(s.base);
    const anyTransform = /transform|perspective/.test(base + styleBlock(s.hover) + styleBlock(s.pressed));
    if (anyTransform) uses3d = true;
    const baseFinal = base + (anyTransform && !/will-change/.test(base) ? ';will-change:transform;transform-style:preserve-3d' : '');
    if (baseFinal) cssRules.push(`.${cls}{${baseFinal}}`);
    const hover = styleBlock(s.hover);
    if (hover) cssRules.push(`.${cls}:hover{${hover}}`);
    const pressed = styleBlock(s.pressed);
    if (pressed) cssRules.push(`.${cls}:active{${pressed}}`);
    const tablet = styleBlock(s.tablet);
    if (tablet) cssRules.push(`@media (max-width:${BP_TABLET}px){.${cls}{${tablet}}}`);
    const mobile = styleBlock(s.mobile);
    if (mobile) cssRules.push(`@media (max-width:${BP_MOBILE}px){.${cls}{${mobile}}}`);
    return cls;
  };

  const renderNode = (node: SiteNode, scope: Record<string, string | number> | null, depth: number): string => {
    if (depth > 40) { errors.push('Max nesting depth exceeded'); return ''; }
    if (!ALLOWED_TAGS.has(node.type)) { errors.push(`Unauthorized node type: ${sanitizeText(node.type)}`); return ''; }

    // CMS repeat: children render once per collection item.
    if (node.repeat && collections[node.repeat]?.length) {
      const cls = emitNodeCss(node);
      const inner = collections[node.repeat]
        .slice(0, 200)
        .map((item) => (node.children || []).map((c) => renderNode(c, item, depth + 1)).join(''))
        .join('');
      return `<div class="${cls}" data-repeat="${sanitizeText(node.repeat)}">${inner}</div>`;
    }

    const cls = emitNodeCss(node);
    const p = node.props || {};
    const kids = () => {
      const children = node.freeLayout ? orderFreeChildren(node.children || []) : (node.children || []);
      return children.map((c) => renderNode(c, scope, depth + 1)).join('');
    };
    const txt = () => sanitizeText(interpolate(p.text ?? '', scope, collections));
    const url = (raw: unknown) => sanitizeUrl(interpolate(String(raw ?? ''), scope, collections));

    switch (node.type) {
      case 'page':
      case 'section': return `<section class="${cls}">${kids()}</section>`;
      case 'div':     return `<div class="${cls}">${kids()}</div>`;
      case 'nav':     return `<nav class="${cls}">${kids()}</nav>`;
      case 'list':    return `<ul class="${cls}">${kids()}</ul>`;
      case 'listitem':return `<li class="${cls}">${kids()}</li>`;
      case 'heading': {
        const lvl = Math.min(3, Math.max(1, Number(p.level) || 2));
        return `<h${lvl} class="${cls}">${txt()}</h${lvl}>`;
      }
      case 'text':    return `<p class="${cls}">${txt()}</p>`;
      case 'button':  return p.href
        ? `<a class="${cls}" href="${url(p.href)}" role="button">${txt()}</a>`
        : `<button class="${cls}" type="${p.formId ? 'submit' : 'button'}">${txt()}</button>`;
      case 'link':    return `<a class="${cls}" href="${url(p.href)}">${txt()}</a>`;
      case 'image':   return `<img class="${cls}" src="${url(p.src)}" alt="${sanitizeText(interpolate(p.alt ?? '', scope, collections))}" loading="lazy"/>`;
      case 'video':   return `<video class="${cls}" src="${url(p.src)}" ${p.poster ? `poster="${url(p.poster)}"` : ''} controls playsinline></video>`;
      case 'spacer':  return `<div class="${cls}" aria-hidden="true"></div>`;
      case 'form': {
        const formId = cleanId(p.formId || node.id);
        const action = opts.formAction ? opts.formAction(formId) : `#`;
        // Honeypot field + native POST; the public router validates + stores.
        return `<form class="${cls}" method="POST" action="${sanitizeUrl(action)}" data-form-id="${formId}">` +
               `<input type="text" name="_hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"/>` +
               `${kids()}</form>`;
      }
      case 'input': {
        const name = cleanId(p.name || 'field');
        return `<input class="${cls}" name="${name}" placeholder="${sanitizeText(p.placeholder ?? '')}" />`;
      }
      case 'textarea': {
        const name = cleanId(p.name || 'message');
        return `<textarea class="${cls}" name="${name}" placeholder="${sanitizeText(p.placeholder ?? '')}"></textarea>`;
      }
      default: return '';
    }
  };

  const body = renderNode(page.tree, null, 0);
  const rootPerspective = uses3d
    ? `.ss-site-root{perspective:1200px;perspective-origin:50% 50%;transform-style:preserve-3d}`
    : '';
  const reset = `*,*::before,*::after{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}img,video{max-width:100%;display:block}a{text-decoration:none;color:inherit}button{font:inherit;cursor:pointer;border:none;background:none}input,textarea{font:inherit}`;
  const css = [reset, rootPerspective, ...cssRules].filter(Boolean).join('\n');

  return { html: `<div class="ss-site-root">${body}</div>`, css, errors, uses3d };
}

/** Full standalone document (what the public router serves). */
export function renderDocument(page: SitePageInput, compiled: CompileResult, siteTitle: string, canonicalUrl: string): string {
  const title = sanitizeText(page.title || siteTitle || 'Untitled');
  const desc = sanitizeText(page.metaDescription || '');
  const og = page.ogImage ? sanitizeUrl(page.ogImage) : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
${desc ? `<meta name="description" content="${desc}"/>` : ''}
<meta property="og:title" content="${title}"/>
${desc ? `<meta property="og:description" content="${desc}"/>` : ''}
${og ? `<meta property="og:image" content="${og}"/>` : ''}
<link rel="canonical" href="${sanitizeUrl(canonicalUrl)}"/>
<style>${compiled.css}</style>
</head>
<body>
${compiled.html}
<footer style="text-align:center;padding:28px 12px;color:#8b90a5;font-size:12px">Built with SonicStream Site Builder</footer>
</body>
</html>`;
}

/** sitemap.xml for a site's published pages. */
export function renderSitemap(baseUrl: string, slugs: string[]): string {
  const urls = slugs.map((s) =>
    `<url><loc>${sanitizeUrl(`${baseUrl}${s === 'index' ? '' : '/' + s}`)}</loc></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
