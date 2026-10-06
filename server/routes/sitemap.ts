import { Router } from 'express';
import { all } from '../db.js';
import { config } from '../config.js';

const router = Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    res.header('Content-Type', 'application/xml');
    
    const [tracks, artists] = await Promise.all([
      all('SELECT id, created_at FROM tracks WHERE status = "live"'),
      all('SELECT id, created_at FROM users WHERE user_type = "artist"')
    ]);

    const baseUrl = config.APP_URL || 'https://v12sonicstream.com';
    
    // Discovery Hubs - Dynamic locations and genres
    const cities = ['Atlanta', 'Los Angeles', 'New York', 'London', 'Berlin'];
    const genres = ['Hip-Hop', 'Electronic', 'Indie', 'Alternative', 'R&B'];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>${baseUrl}/</loc><priority>1.0</priority></url>
        <url><loc>${baseUrl}/marketplace</loc><priority>0.9</priority></url>
        <url><loc>${baseUrl}/radio</loc><priority>0.8</priority></url>
        <url><loc>${baseUrl}/news</loc><priority>0.7</priority></url>
        <url><loc>${baseUrl}/discovery/trending</loc><priority>0.9</priority></url>
        <url><loc>${baseUrl}/discovery/releases</loc><priority>0.8</priority></url>
        
        ${cities.map(city => `
          <url>
            <loc>${baseUrl}/discovery/${city.toLowerCase().replace(' ', '-')}</loc>
            <priority>0.8</priority>
          </url>
          <url>
            <loc>${baseUrl}/discovery/events/${city.toLowerCase().replace(' ', '-')}</loc>
            <priority>0.7</priority>
          </url>`).join('')}

        ${genres.map(genre => `
          <url>
            <loc>${baseUrl}/discovery/genre/${genre.toLowerCase()}</loc>
            <priority>0.8</priority>
          </url>`).join('')}

        ${(tracks as any[]).map(t => `
          <url>
            <loc>${baseUrl}/tracks/${t.id}</loc>
            <lastmod>${new Date(t.created_at).toISOString()}</lastmod>
            <priority>0.8</priority>
          </url>`).join('')}
        ${(artists as any[]).map(a => `
          <url>
            <loc>${baseUrl}/artists/${a.id}</loc>
            <lastmod>${new Date(a.created_at).toISOString()}</lastmod>
            <priority>0.7</priority>
          </url>`).join('')}
      </urlset>`;

    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
