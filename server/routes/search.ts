import { Router } from 'express';
import { all } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { q, type, genre, location, date } = req.query;
  
  const results: any = {
    tracks: [],
    artists: [],
    events: []
  };

  if (!type || type === 'track') {
    let sql = 'SELECT * FROM tracks WHERE status = "live"';
    const params: any[] = [];
    if (q) {
      sql += ' AND (title LIKE ? OR display_artist_name LIKE ? OR artist LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (genre) {
      sql += ' AND genre = ?';
      params.push(genre);
    }
    results.tracks = await all(sql, params);
  }

  if (!type || type === 'artist') {
    let sql = 'SELECT * FROM artists';
    const params: any[] = [];
    if (q) {
      sql += ' WHERE (name LIKE ? OR bio LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (genre) {
      sql += (q ? ' AND' : ' WHERE') + ' genre = ?';
      params.push(genre);
    }
    if (location) {
      sql += (q || genre ? ' AND' : ' WHERE') + ' location LIKE ?';
      params.push(`%${location}%`);
    }
    results.artists = await all(sql, params);
  }

  // For "events", we search for artists who have availability on the specified date
  if (!type || type === 'event') {
    let sql = 'SELECT a.* FROM artists a';
    const params: any[] = [];
    
    if (date) {
      const dayOfWeek = new Date(date as string).getDay();
      sql += ' JOIN artist_availability av ON a.id = av.artist_id WHERE av.day_of_week = ?';
      params.push(dayOfWeek);
    } else {
      sql += ' WHERE 1=1';
    }

    if (q) {
      sql += ' AND (a.name LIKE ? OR a.bio LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (location) {
      sql += ' AND a.location LIKE ?';
      params.push(`%${location}%`);
    }
    
    results.events = await all(sql, params);
  }

  res.json(results);
});

export default router;
