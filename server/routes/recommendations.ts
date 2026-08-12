import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../domains/identity/auth.js';
import { all, get } from '../db.js';
import { Track, User } from '../types.js';
import { GoogleGenAI, Type } from "@google/genai";
import { config } from '../config.js';
import { RecommendationEngine } from '../services/RecommendationEngine.js';

const router = Router();

/**
 * Log user feedback loop interaction (click, play, skip, like)
 * POST /api/recommendations/feedback
 */
router.post('/feedback', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { itemId, itemType, action } = req.body;
  if (!itemId || !itemType || !action) {
    return res.status(400).json({ error: 'itemId, itemType, and action are required' });
  }

  await RecommendationEngine.recordFeedback(userId, itemId, itemType, action);
  res.json({ success: true, message: 'Behavior saved successfully' });
});

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  
  // 1. Get user preferences and history
  const user = await get<User>('SELECT preferred_genres FROM users WHERE id = ?', [userId]);
  const preferredGenres = user?.preferredGenres || [];
  
  // Get recently played tracks
  const history = await all<any>(`
    SELECT t.genre, t.artist, COUNT(*) as play_count 
    FROM play_history ph 
    JOIN tracks t ON ph.track_id = t.id 
    WHERE ph.user_id = ? 
    GROUP BY t.genre, t.artist 
    ORDER BY play_count DESC LIMIT 5
  `, [userId]);

  // Get liked tracks/artists
  const liked = await all<any>(`
    SELECT target_id, target_type FROM likes WHERE user_id = ?
  `, [userId]);

  // 2. Get all live tracks, artists, and events
  const tracks = await all<Track>("SELECT id, title, artist, genre, mood, description FROM tracks WHERE status = 'live'");
  const artists = await all<any>('SELECT id, name, genre, popularity FROM artists');
  const events = await all<any>('SELECT id, title, venue, city, genre FROM events WHERE date > CURRENT_TIMESTAMP');
  
  if (tracks.length === 0 && artists.length === 0 && events.length === 0) {
    return res.json([]);
  }

  // 3. Prepare list of items for the advanced Ranking & Similarity Embedding engine
  const unrankedItems: any[] = [];
  
  tracks.forEach(t => {
    unrankedItems.push({
      id: t.id,
      type: 'track',
      genre: t.genre || '',
      textProfile: `${t.title} ${t.artist} ${t.genre} ${t.mood || ''} ${t.description || ''}`
    });
  });

  artists.forEach(a => {
    unrankedItems.push({
      id: String(a.id),
      type: 'artist',
      genre: a.genre || '',
      textProfile: `${a.name} ${a.genre || ''}`
    });
  });

  events.forEach(e => {
    unrankedItems.push({
      id: String(e.id),
      type: 'event',
      genre: e.genre || '',
      textProfile: `${e.title} ${e.venue || ''} ${e.city || ''} ${e.genre || ''}`
    });
  });

  // Calculate high-fidelity rankings with behavior weighting
  const ranked = await RecommendationEngine.rankRecommendations(userId!, unrankedItems);

  // 4. Use Gemini to add contextual commentary/creative tags if API key is configured
  if (config.GEMINI_API_KEY && ranked.length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
      const prompt = `
      User Preferences:
      - Preferred Genres: ${preferredGenres.join(', ') || 'None'}
      - Recently Played Genres/Artists: ${history.map((h: any) => `${h.genre} by ${h.artist}`).join(', ')}
      - Liked Items: ${liked.map((l: any) => `${l.target_type}:${l.target_id}`).join(', ')}

      We have ranked these items using our internal vector matching engine:
      ${ranked.slice(0, 10).map(r => `Type:${r.type}, ID:${r.id}, Reason:${r.reason}`).join(' | ')}
      
      Generate a customized commentary message or dynamic caption for the top 5 item IDs that makes the recommendation feel organic and high quality.
      
      Return a JSON array of objects: { "type": "track"|"artist"|"event", "id": string, "score": number, "reason": string }.
      `;

      const response = await ai.models.generateContent({
         model: "gemini-3-flash-preview",
         contents: prompt,
         config: {
           responseMimeType: "application/json",
           responseSchema: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 type: { type: Type.STRING },
                 id: { type: Type.STRING },
                 score: { type: Type.NUMBER },
                 reason: { type: Type.STRING }
               },
               required: ["type", "id", "score", "reason"]
             }
           }
         }
      });

      const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const aiRecommendations = JSON.parse(responseText);
      if (Array.isArray(aiRecommendations) && aiRecommendations.length > 0) {
        return res.json(aiRecommendations);
      }
    } catch (error) {
      console.error('Gemini Recommendation Error, falling back to direct engine ranks:', error);
    }
  }

  res.json(ranked);
});

export default router;
