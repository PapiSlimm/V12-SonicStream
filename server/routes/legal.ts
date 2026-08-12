import { Router } from 'express';
import { all, run } from '../db.js';

const router = Router();

// Ingestion Firewall Middleware (Defensive Perimeter)
export const ingestionFirewall = (req: any, res: any, next: any) => {
  const { title, metadata } = req.body;
  
  // Basic automated blacklist for prohibited metadata at ingestion
  const blacklist = ['test', 'leak', 'unreleased', 'stolen'];
  const content = (title + ' ' + (metadata || '')).toLowerCase();
  
  if (blacklist.some(term => content.includes(term))) {
    return res.status(403).json({ error: 'Ingestion Perimeter: Forbidden metadata terms detected.' });
  }
  
  next();
};

router.post('/dmca', async (req, res) => {
  const { trackTitle, artistName, reason, claimantEmail } = req.body;

  if (!trackTitle || !reason) {
    return res.status(400).json({ error: 'Incomplete DMCA claim' });
  }

  try {
    // Find matching track metadata
    const matchingTracks = await all(
      'SELECT id FROM tracks WHERE LOWER(title) = ? AND LOWER(display_artist_name) = ?',
      [trackTitle.toLowerCase(), artistName.toLowerCase()]
    );

    if (matchingTracks.length > 0) {
      // Automate "Dark Mode" (Takedown)
      for (const track of (matchingTracks as any[])) {
        await run(
          "UPDATE tracks SET status = 'takedown', updated_at = ? WHERE id = ?",
          [new Date().toISOString(), track.id]
        );
        console.log(`[DMCA] Automated Takedown executed for track ID: ${track.id}`);
      }

      // Log claim for legal records
      await run(
        'INSERT INTO notifications (user_id, type, message, created_at) VALUES (?, ?, ?, ?)',
        ['system_admin', 'dmca_claim', `DMCA processed for ${trackTitle} by ${claimantEmail}`, new Date().toISOString()]
      );

      res.json({ 
        status: 'processed', 
        message: 'Platform Safe Harbor active. Matching content removed from marketplace.',
        takedownCount: matchingTracks.length 
      });
    } else {
      res.json({ status: 'no_match', message: 'No content matching the provided metadata found.' });
    }
  } catch (err) {
    console.error('DMCA Process Error:', err);
    res.status(500).json({ error: 'Internal failure in Takedown Engine' });
  }
});

export default router;
