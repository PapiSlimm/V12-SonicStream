/**
 * Site Builder API — /api/site-builder (2026-09-22).
 * The authenticated workspace behind the visual studio: sites, pages with
 * layout trees + automatic revisions (server-side undo safety net), CMS
 * collections + items, live preview compilation, and publish.
 *
 * Replaces the minimal site-builder block that briefly lived in
 * server/routes/platform.ts; this router mounts BEFORE the /api catch-up.
 */
import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../domains/identity/auth.js';
import { all, get, run } from '../db.js';
import { AppError } from '../middleware/error.js';
import { compilePage, renderDocument, CollectionsData, SitePageInput } from '../services/SiteCompiler.js';

const router = Router();
const uid = (req: AuthRequest) => String(req.user?.id || '');
const now = () => new Date().toISOString();

async function mySite(req: AuthRequest, siteId: string | number) {
  const site = await get<any>('SELECT * FROM artist_sites WHERE id = ? AND artist_id = ?', [siteId, uid(req)]);
  if (!site) throw new AppError('Site not found', 404);
  return site;
}
async function myPage(req: AuthRequest, pageId: string | number) {
  const page = await get<any>(
    `SELECT p.*, s.artist_id, s.subdomain FROM site_pages p JOIN artist_sites s ON s.id = p.site_id
     WHERE p.id = ? AND s.artist_id = ?`, [pageId, uid(req)]);
  if (!page) throw new AppError('Page not found', 404);
  return page;
}

async function loadCollections(siteId: string | number): Promise<CollectionsData> {
  const cols = await all<any>('SELECT * FROM site_collections WHERE site_id = ?', [siteId]) || [];
  const out: CollectionsData = {};
  for (const c of cols) {
    const items = await all<any>(
      'SELECT fields FROM site_collection_items WHERE collection_id = ? ORDER BY sort_order, id', [c.id]) || [];
    out[c.slug] = items.map((i: any) => { try { return JSON.parse(i.fields || '{}'); } catch { return {}; } });
  }
  return out;
}

/* ── Sites ────────────────────────────────────────────────────────────── */

router.get('/sites', authenticateToken, async (req: AuthRequest, res) => {
  const rows = await all('SELECT * FROM artist_sites WHERE artist_id = ? ORDER BY created_at DESC', [uid(req)]);
  res.json(rows || []);
});

router.post('/sites', authenticateToken, async (req: AuthRequest, res) => {
  const { subdomain, theme, siteTitle } = req.body || {};
  if (!subdomain) throw new AppError('subdomain is required', 400);
  const clean = String(subdomain).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
  if (!clean) throw new AppError('Invalid subdomain', 400);
  const taken = await get('SELECT id FROM artist_sites WHERE subdomain = ?', [clean]);
  if (taken) throw new AppError('Subdomain already taken', 409);
  const r = await run(
    'INSERT INTO artist_sites (artist_id, subdomain, theme, layout, components, site_title) VALUES (?, ?, ?, ?, ?, ?)',
    [uid(req), clean, theme || 'midnight', 'studio', '[]', siteTitle || clean]);
  // Every site starts with a home page and a starter tree.
  const starter: SitePageInput = {
    title: siteTitle || clean,
    tree: {
      id: 'root', type: 'page',
      styles: { base: { background: '#0b0d15', color: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' } },
      children: [
        { id: 'hero', type: 'section',
          styles: { base: { padding: '96px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' } },
          children: [
            { id: 'hero_h', type: 'heading', props: { text: siteTitle || clean, level: 1 }, styles: { base: { fontSize: '56px', fontWeight: '800' }, mobile: { fontSize: '34px' } } },
            { id: 'hero_p', type: 'text', props: { text: 'Music. Merch. Shows. All in one place.' }, styles: { base: { color: '#8b90a5', fontSize: '18px' } } },
            { id: 'hero_cta', type: 'button', props: { text: 'Listen Now', href: '#music' },
              styles: { base: { background: '#0d9488', color: '#ffffff', padding: '14px 28px', borderRadius: '10px', fontWeight: '700' }, hover: { transform: 'translateY(-2px)', boxShadow: '0 12px 30px rgba(13,148,136,.35)' } } },
          ] },
      ],
    },
  };
  await run(
    'INSERT INTO site_pages (site_id, slug, title, layout_tree, published) VALUES (?, ?, ?, ?, 0)',
    [r.lastID, 'index', 'Home', JSON.stringify(starter)]);
  res.json({ id: r.lastID, subdomain: clean, success: true });
});

router.patch('/sites/:id', authenticateToken, async (req: AuthRequest, res) => {
  const site = await mySite(req, req.params.id);
  const { theme, siteTitle, seoDescription } = req.body || {};
  await run('UPDATE artist_sites SET theme = ?, site_title = ?, seo_description = ? WHERE id = ?',
    [theme ?? site.theme, siteTitle ?? site.siteTitle, seoDescription ?? site.seoDescription, site.id]);
  res.json({ success: true });
});

router.post('/unlock', authenticateToken, async (req: AuthRequest, res) => {
  await run("INSERT INTO platform_flags (user_id, flag, value) VALUES (?, 'site_builder_unlocked', '1')", [uid(req)])
    .catch(() => {});
  res.json({ success: true });
});

/* ── Pages + revisions ────────────────────────────────────────────────── */

router.get('/sites/:id/pages', authenticateToken, async (req: AuthRequest, res) => {
  const site = await mySite(req, req.params.id);
  const rows = await all(
    'SELECT id, site_id, slug, title, published, updated_at FROM site_pages WHERE site_id = ? ORDER BY id', [site.id]);
  res.json(rows || []);
});

router.post('/sites/:id/pages', authenticateToken, async (req: AuthRequest, res) => {
  const site = await mySite(req, req.params.id);
  const { slug, title } = req.body || {};
  const clean = String(slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
  if (!clean) throw new AppError('slug is required', 400);
  const dup = await get('SELECT id FROM site_pages WHERE site_id = ? AND slug = ?', [site.id, clean]);
  if (dup) throw new AppError('Page slug already exists', 409);
  const starter: SitePageInput = { title: title || clean, tree: { id: 'root', type: 'page', styles: { base: { minHeight: '60vh', padding: '48px 24px' } }, children: [] } };
  const r = await run('INSERT INTO site_pages (site_id, slug, title, layout_tree, published) VALUES (?, ?, ?, ?, 0)',
    [site.id, clean, title || clean, JSON.stringify(starter)]);
  res.json({ id: r.lastID, slug: clean, success: true });
});

router.get('/pages/:pageId', authenticateToken, async (req: AuthRequest, res) => {
  const page = await myPage(req, req.params.pageId);
  res.json({ ...page, layoutTree: JSON.parse(page.layoutTree || '{}') });
});

router.patch('/pages/:pageId', authenticateToken, async (req: AuthRequest, res) => {
  const page = await myPage(req, req.params.pageId);
  const { layoutTree, title, metaDescription } = req.body || {};
  if (layoutTree) {
    const size = JSON.stringify(layoutTree).length;
    if (size > 900_000) throw new AppError('Layout too large', 413);
    // Automatic revision on every save — the server-side undo safety net.
    await run('INSERT INTO site_page_revisions (page_id, layout_tree, saved_at) VALUES (?, ?, ?)',
      [page.id, page.layoutTree, now()]);
    await run('DELETE FROM site_page_revisions WHERE page_id = ? AND id NOT IN (SELECT id FROM site_page_revisions WHERE page_id = ? ORDER BY id DESC LIMIT 30)',
      [page.id, page.id]).catch(() => {});
    await run('UPDATE site_pages SET layout_tree = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(layoutTree), now(), page.id]);
  }
  if (title !== undefined || metaDescription !== undefined) {
    await run('UPDATE site_pages SET title = ?, meta_description = ? WHERE id = ?',
      [title ?? page.title, metaDescription ?? page.metaDescription, page.id]);
  }
  res.json({ success: true });
});

router.delete('/pages/:pageId', authenticateToken, async (req: AuthRequest, res) => {
  const page = await myPage(req, req.params.pageId);
  if (page.slug === 'index') throw new AppError('The home page cannot be deleted', 400);
  await run('DELETE FROM site_pages WHERE id = ?', [page.id]);
  res.json({ success: true });
});

router.get('/pages/:pageId/revisions', authenticateToken, async (req: AuthRequest, res) => {
  const page = await myPage(req, req.params.pageId);
  const rows = await all('SELECT id, saved_at FROM site_page_revisions WHERE page_id = ? ORDER BY id DESC LIMIT 30', [page.id]);
  res.json(rows || []);
});

router.post('/pages/:pageId/revisions/:revId/restore', authenticateToken, async (req: AuthRequest, res) => {
  const page = await myPage(req, req.params.pageId);
  const rev = await get<any>('SELECT * FROM site_page_revisions WHERE id = ? AND page_id = ?', [req.params.revId, page.id]);
  if (!rev) throw new AppError('Revision not found', 404);
  await run('INSERT INTO site_page_revisions (page_id, layout_tree, saved_at) VALUES (?, ?, ?)', [page.id, page.layoutTree, now()]);
  await run('UPDATE site_pages SET layout_tree = ?, updated_at = ? WHERE id = ?', [rev.layoutTree, now(), page.id]);
  res.json({ success: true });
});

/* ── CMS collections ──────────────────────────────────────────────────── */

router.get('/sites/:id/collections', authenticateToken, async (req: AuthRequest, res) => {
  const site = await mySite(req, req.params.id);
  const cols = await all<any>('SELECT * FROM site_collections WHERE site_id = ? ORDER BY id', [site.id]) || [];
  for (const c of cols) {
    c.fields = JSON.parse(c.fields || '[]');
    c.itemCount = (await get<any>('SELECT COUNT(*) as c FROM site_collection_items WHERE collection_id = ?', [c.id]))?.c || 0;
  }
  res.json(cols);
});

router.post('/sites/:id/collections', authenticateToken, async (req: AuthRequest, res) => {
  const site = await mySite(req, req.params.id);
  const { name, slug, fields } = req.body || {};
  const clean = String(slug || name || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  if (!clean || !name) throw new AppError('name and slug are required', 400);
  const r = await run('INSERT INTO site_collections (site_id, name, slug, fields) VALUES (?, ?, ?, ?)',
    [site.id, String(name).slice(0, 80), clean, JSON.stringify((fields || ['title', 'text']).slice(0, 20))]);
  res.json({ id: r.lastID, slug: clean, success: true });
});

router.post('/collections/:cid/items', authenticateToken, async (req: AuthRequest, res) => {
  const col = await get<any>(
    `SELECT c.* FROM site_collections c JOIN artist_sites s ON s.id = c.site_id WHERE c.id = ? AND s.artist_id = ?`,
    [req.params.cid, uid(req)]);
  if (!col) throw new AppError('Collection not found', 404);
  const fields = req.body?.fields || {};
  const r = await run('INSERT INTO site_collection_items (collection_id, fields, sort_order) VALUES (?, ?, ?)',
    [col.id, JSON.stringify(fields).slice(0, 40_000), Number(req.body?.sortOrder) || 0]);
  res.json({ id: r.lastID, success: true });
});

router.get('/collections/:cid/items', authenticateToken, async (req: AuthRequest, res) => {
  const col = await get<any>(
    `SELECT c.* FROM site_collections c JOIN artist_sites s ON s.id = c.site_id WHERE c.id = ? AND s.artist_id = ?`,
    [req.params.cid, uid(req)]);
  if (!col) throw new AppError('Collection not found', 404);
  const rows = await all<any>('SELECT * FROM site_collection_items WHERE collection_id = ? ORDER BY sort_order, id', [col.id]) || [];
  res.json(rows.map((r: any) => ({ ...r, fields: JSON.parse(r.fields || '{}') })));
});

router.delete('/collections/items/:itemId', authenticateToken, async (req: AuthRequest, res) => {
  await run(
    `DELETE FROM site_collection_items WHERE id = ? AND collection_id IN
     (SELECT c.id FROM site_collections c JOIN artist_sites s ON s.id = c.site_id WHERE s.artist_id = ?)`,
    [req.params.itemId, uid(req)]);
  res.json({ success: true });
});

/* ── Preview + publish (the compiler gate) ────────────────────────────── */

router.post('/pages/:pageId/preview', authenticateToken, async (req: AuthRequest, res) => {
  const page = await myPage(req, req.params.pageId);
  const input: SitePageInput = req.body?.layoutTree || JSON.parse(page.layoutTree || '{}');
  const collections = await loadCollections(page.siteId);
  const compiled = compilePage(input, collections, { formAction: (fid) => `/sites/${page.subdomain}/forms/${fid}` });
  const doc = renderDocument(input, compiled, page.title, `/sites/${page.subdomain}${page.slug === 'index' ? '' : '/' + page.slug}`);
  res.json({ html: doc, errors: compiled.errors, uses3d: compiled.uses3d });
});

router.post('/pages/:pageId/publish', authenticateToken, async (req: AuthRequest, res) => {
  const page = await myPage(req, req.params.pageId);
  const input: SitePageInput = JSON.parse(page.layoutTree || '{}');
  const collections = await loadCollections(page.siteId);
  const compiled = compilePage(input, collections, { formAction: (fid) => `/sites/${page.subdomain}/forms/${fid}` });
  if (compiled.errors.length) return res.status(400).json({ success: false, errors: compiled.errors });
  const doc = renderDocument(input, compiled, page.title, `/sites/${page.subdomain}${page.slug === 'index' ? '' : '/' + page.slug}`);
  await run('UPDATE site_pages SET compiled_html = ?, published = 1, published_at = ? WHERE id = ?', [doc, now(), page.id]);
  await run('UPDATE artist_sites SET published = 1 WHERE id = ?', [page.siteId]).catch(() => {});
  res.json({ success: true, liveUrl: `/sites/${page.subdomain}${page.slug === 'index' ? '' : '/' + page.slug}` });
});

router.post('/sites/:id/publish', authenticateToken, async (req: AuthRequest, res) => {
  const site = await mySite(req, req.params.id);
  const pages = await all<any>('SELECT * FROM site_pages WHERE site_id = ?', [site.id]) || [];
  const collections = await loadCollections(site.id);
  const published: string[] = [];
  const failures: any[] = [];
  for (const page of pages) {
    const input: SitePageInput = JSON.parse(page.layoutTree || '{}');
    const compiled = compilePage(input, collections, { formAction: (fid) => `/sites/${site.subdomain}/forms/${fid}` });
    if (compiled.errors.length) { failures.push({ slug: page.slug, errors: compiled.errors }); continue; }
    const doc = renderDocument(input, compiled, page.title || site.siteTitle, `/sites/${site.subdomain}${page.slug === 'index' ? '' : '/' + page.slug}`);
    await run('UPDATE site_pages SET compiled_html = ?, published = 1, published_at = ? WHERE id = ?', [doc, now(), page.id]);
    published.push(page.slug);
  }
  await run('UPDATE artist_sites SET published = 1 WHERE id = ?', [site.id]).catch(() => {});
  res.json({ success: failures.length === 0, published, failures, liveUrl: `/sites/${site.subdomain}` });
});

/* ── Form submissions inbox ───────────────────────────────────────────── */

router.get('/sites/:id/forms/submissions', authenticateToken, async (req: AuthRequest, res) => {
  const site = await mySite(req, req.params.id);
  const rows = await all<any>('SELECT * FROM site_form_submissions WHERE site_id = ? ORDER BY id DESC LIMIT 200', [site.id]) || [];
  res.json(rows.map((r: any) => ({ ...r, data: JSON.parse(r.data || '{}') })));
});

export default router;
