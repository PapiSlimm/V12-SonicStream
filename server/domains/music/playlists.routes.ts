import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../identity/auth.js';
import { all, get, run } from '../../db.js';
import { AppError } from '../../middleware/error.js';

const router = Router();

// Get all playlists for the current user (including collaborative ones)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  const playlists = await all(`
    SELECT p.* 
    FROM playlists p
    LEFT JOIN playlist_collaborators pc ON p.id = pc.playlist_id
    WHERE p.user_id = ? OR pc.user_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `, [req.user?.id, req.user?.id]);
  res.json(playlists);
});

// Create a new playlist
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const { title, description, isPublic = 1, isCollaborative = 0, coverType = 'custom' } = req.body;
  if (!title) throw new AppError('Title is required', 400);

  const result = await run(
    'INSERT INTO playlists (user_id, title, description, is_public, is_collaborative, cover_type) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user?.id, title, description, isPublic, isCollaborative, coverType]
  );

  // Add owner as collaborator
  await run(
    'INSERT INTO playlist_collaborators (playlist_id, user_id, role) VALUES (?, ?, ?)',
    [result.lastID, req.user?.id, 'owner']
  );

  // 2026-10-08: was `is_public, is_collaborative, cover_type` — undefined
  // identifiers (destructured camelCase above), so every playlist create 500'd.
  res.json({ id: result.lastID, title, description, isPublic, isCollaborative, coverType });
});

// Which of the current user's playlists contain a given track.
// (2026-10-08, Firebase removal phase 2: AddToPlaylistModal used to read
// trackIds arrays straight out of Firestore; SQL keeps membership in
// playlist_tracks, so the client asks here instead.)
// NOTE: must be registered before '/:id'.
router.get('/membership/:trackId', authenticateToken, async (req: AuthRequest, res) => {
  // CAST to TEXT so a non-numeric id never explodes Postgres's strict typing
  // ("invalid input syntax for type integer") — SQLite was lenient here.
  const rows = await all<{ playlistId: number }>(`
    SELECT DISTINCT pt.playlist_id
    FROM playlist_tracks pt
    JOIN playlists p ON p.id = pt.playlist_id
    LEFT JOIN playlist_collaborators pc ON pc.playlist_id = p.id
    WHERE CAST(pt.track_id AS TEXT) = ? AND (p.user_id = ? OR pc.user_id = ?)
  `, [String(req.params.trackId), req.user?.id, req.user?.id]).catch(() => []);
  res.json({ playlistIds: (rows || []).map(r => String(r.playlistId)) });
});

// Get a single playlist with its tracks
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const playlist = await get('SELECT * FROM playlists WHERE id = ?', [id]);
  if (!playlist) throw new AppError('Playlist not found', 404);

  const tracks = await all(`
    SELECT t.*, pt.position 
    FROM tracks t 
    JOIN playlist_tracks pt ON t.id = pt.track_id 
    WHERE pt.playlist_id = ? 
    ORDER BY pt.position ASC
  `, [id]);

  const collaborators = await all(`
    SELECT pc.*, u.name, u.avatar_url
    FROM playlist_collaborators pc
    JOIN users u ON pc.user_id = u.id
    WHERE pc.playlist_id = ?
  `, [id]);

  res.json({ ...playlist, tracks, collaborators });
});

// Update a playlist
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, description, isPublic, isCollaborative, coverType, artworkUrl } = req.body;

  // Check if user is owner or collaborator with editor role
  const collab = await get('SELECT role FROM playlist_collaborators WHERE playlist_id = ? AND user_id = ?', [id, req.user?.id]);
  if (!collab) throw new AppError('Access denied', 403);

  const playlist = await get<any>('SELECT * FROM playlists WHERE id = ?', [id]);
  if (!playlist) throw new AppError('Playlist not found', 404);

  await run(
    'UPDATE playlists SET title = ?, description = ?, is_public = ?, is_collaborative = ?, cover_type = ?, artwork_url = ? WHERE id = ?',
    [
      title || playlist.title, 
      description || playlist.description, 
      isPublic !== undefined ? isPublic : playlist.isPublic,
      isCollaborative !== undefined ? isCollaborative : playlist.isCollaborative,
      coverType || playlist.coverType,
      artworkUrl || playlist.artworkUrl,
      id
    ]
  );

  res.json({ success: true });
});

// Add a collaborator
router.post('/:id/collaborators', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { userId, role = 'editor' } = req.body;

  // Only owner can add collaborators
  const collab = await get('SELECT role FROM playlist_collaborators WHERE playlist_id = ? AND user_id = ?', [id, req.user?.id]);
  if (!collab || collab.role !== 'owner') throw new AppError('Only owner can add collaborators', 403);

  await run(
    'INSERT INTO playlist_collaborators (playlist_id, user_id, role) VALUES (?, ?, ?)',
    [id, userId, role]
  );

  res.json({ success: true });
});

// Remove a collaborator
router.delete('/:id/collaborators/:userId', authenticateToken, async (req: AuthRequest, res) => {
  const { id, userId } = req.params;

  // Only owner can remove collaborators, or user can remove themselves
  const collab = await get('SELECT role FROM playlist_collaborators WHERE playlist_id = ? AND user_id = ?', [id, req.user?.id]);
  if (!collab) throw new AppError('Access denied', 403);
  
  if (collab.role !== 'owner' && req.user?.id !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  await run('DELETE FROM playlist_collaborators WHERE playlist_id = ? AND user_id = ?', [id, userId]);
  res.json({ success: true });
});

// Add a track to a playlist
router.post('/:id/tracks', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { trackId } = req.body;

  // Check if user is owner or collaborator with editor role
  const collab = await get('SELECT role FROM playlist_collaborators WHERE playlist_id = ? AND user_id = ?', [id, req.user?.id]);
  if (!collab || collab.role === 'viewer') throw new AppError('Access denied', 403);

  // Get current max position
  const lastTrack = await get('SELECT MAX(position) as maxPos FROM playlist_tracks WHERE playlist_id = ?', [id]);
  const position = (lastTrack?.maxPos || 0) + 1;

  try {
    await run(
      'INSERT INTO playlist_tracks (playlist_id, track_id, position, added_by) VALUES (?, ?, ?, ?)',
      [id, trackId, position, req.user?.id]
    );
    res.json({ success: true });
  } catch {
    throw new AppError('Track already in playlist', 400);
  }
});

// Remove a track from a playlist
router.delete('/:id/tracks/:trackId', authenticateToken, async (req: AuthRequest, res) => {
  const { id, trackId } = req.params;

  // Check if user is owner or collaborator with editor role
  const collab = await get('SELECT role FROM playlist_collaborators WHERE playlist_id = ? AND user_id = ?', [id, req.user?.id]);
  if (!collab || collab.role === 'viewer') throw new AppError('Access denied', 403);

  await run('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?', [id, trackId]);
  res.json({ success: true });
});

// Reorder tracks in a playlist
router.put('/:id/reorder', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { trackIds } = req.body; // Array of track IDs in new order

  if (!Array.isArray(trackIds)) throw new AppError('trackIds must be an array', 400);

  // Check if user is owner or collaborator with editor role
  const collab = await get('SELECT role FROM playlist_collaborators WHERE playlist_id = ? AND user_id = ?', [id, req.user?.id]);
  if (!collab || collab.role === 'viewer') throw new AppError('Access denied', 403);

  // Use a transaction for reordering
  await run('BEGIN TRANSACTION');
  try {
    const whenClauses = trackIds.map(() => `WHEN track_id = ? THEN ?`).join(' ');
    const params: any[] = [];
    trackIds.forEach((tid, index) => {
      params.push(tid, index + 1);
    });
    params.push(id);

    const sql = `
      UPDATE playlist_tracks 
      SET position = CASE 
        ${whenClauses}
      END
      WHERE playlist_id = ?
    `;
    
    await run(sql, params);
    await run('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await run('ROLLBACK');
    console.error('Reorder failed:', err);
    throw new AppError('Failed to reorder tracks', 500);
  }
});

export default router;
