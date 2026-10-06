/**
 * Public site renderer — /sites/:subdomain (2026-09-22). NO auth: this is the
 * live web output of the Site Builder. Serves the pre-compiled, sanitized
 * documents the publish step produced (never compiles raw user JSON on this
 * path), the per-site sitemap.xml, and the native form handler.
 */
import { Router } from 'express';
import { all, get, run } from '../db.js';
import { renderSitemap } from '../services/SiteCompiler.js';

const router = Router();

async function liveSite(subdomain: string) {
  const clean = String(subdomain || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
  if (!clean) return null;
  return get<any>('SELECT * FROM artist_sites WHERE subdomain = ?', [clean]);
}

router.get('/:subdomain/sitemap.xml', async (req, res) => {
  const site = await liveSite(req.params.subdomain);
  if (!site) return res.status(404).send('Not found');
  const pages = await all<{ slug: string }>(
    'SELECT slug FROM site_pages WHERE site_id = ? AND published = 1', [site.id]) || [];
  res.setHeader('Content-Type', 'application/xml');
  res.send(renderSitemap(`${req.protocol}://${req.get('host')}/sites/${site.subdomain}`, pages.map(p => p.slug)));
});

router.post('/:subdomain/forms/:formId', async (req, res) => {
  const site = await liveSite(req.params.subdomain);
  if (!site) return res.status(404).send('Not found');
  const body = req.body || {};
  // Honeypot: real visitors never fill _hp; bots do. Accept silently, store nothing.
  if (!body._hp) {
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(body)) {
      if (k.startsWith('_')) continue;
      data[String(k).slice(0, 60)] = String(v).slice(0, 4000);
      if (Object.keys(data).length >= 30) break;
    }
    await run('INSERT INTO site_form_submissions (site_id, form_id, data) VALUES (?, ?, ?)',
      [site.id, String(req.params.formId).slice(0, 48), JSON.stringify(data)]).catch(() => {});
  }
  // Friendly confirmation for native (non-JS) form posts.
  res.send(`<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Thank you</title></head>
<body style="margin:0;display:grid;place-items:center;min-height:100vh;font-family:Inter,system-ui,sans-serif;background:#0b0d15;color:#fff">
<div style="text-align:center"><h1 style="margin:0 0 8px">Message sent ✓</h1>
<p style="color:#8b90a5">Thanks — you'll hear back soon.</p>
<a href="/sites/${site.subdomain}" style="color:#0d9488;font-weight:700">← Back to site</a></div></body></html>`);
});

router.get('/:subdomain/:slug?', async (req, res) => {
  const site = await liveSite(req.params.subdomain);
  if (!site) return res.status(404).send('Site not found');
  const slug = String(req.params.slug || 'index').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60) || 'index';
  const page = await get<any>(
    'SELECT compiled_html, published FROM site_pages WHERE site_id = ? AND slug = ?', [site.id, slug]);
  if (!page || !page.published || !page.compiledHtml) {
    return res.status(404).send(`<!doctype html><html><body style="margin:0;display:grid;place-items:center;min-height:100vh;font-family:system-ui;background:#0b0d15;color:#fff"><div style="text-align:center"><h1>Coming soon</h1><p style="color:#8b90a5">This page hasn't been published yet.</p></div></body></html>`);
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.send(page.compiledHtml);
});

export default router;
