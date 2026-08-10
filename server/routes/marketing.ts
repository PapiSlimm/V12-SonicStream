import { Router } from 'express';
import { authenticateToken, AuthRequest, requirePro } from '../domains/identity/auth.js';
import { get, all } from '../db.js';
import { GoogleGenAI, Type } from "@google/genai";
import { config } from '../config.js';
import { z } from 'zod';

const router = Router();

router.get('/overview', authenticateToken, requirePro, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  
  const metrics = await get(`
    SELECT 
      COUNT(DISTINCT fan_id) as new_fans,
      AVG(session_duration) as avg_session,
      SUM(earnings) as total_earnings
    FROM marketing_analytics 
    WHERE creator_id = ? AND date >= date('now', '-3 months')
  `, [userId]);
  
  res.json(metrics);
});

router.get('/templates', authenticateToken, requirePro, async (req, res) => {
  res.json([
    { id: 'release_launch', name: 'New Release Launch', assets: 'link_to_kit' },
    { id: 'impact_update', name: 'Impact Update', assets: 'link_to_kit' }
  ]);
});

router.get('/scripts', authenticateToken, requirePro, async (req, res) => {
  const scripts = await all<any>('SELECT * FROM marketing_scripts ORDER BY display_order ASC');
  // Map display_order to order for backward compatibility with existing frontends/types
  res.json(scripts.map(s => ({
    ...s,
    order: s.display_order ?? s.order ?? 0
  })));
});

// AI Marketing Suite Generator API
router.post('/generate', authenticateToken, async (req: AuthRequest, res) => {
  const { textType, releaseName, genre, description, tone } = z.object({
    textType: z.enum(['ad_copy', 'social_post', 'email_blast', 'full_campaign']),
    releaseName: z.string(),
    genre: z.string(),
    description: z.string(),
    tone: z.string().optional()
  }).parse(req.body);

  if (!config.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API is not configured on this environment.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
    const prompt = `
      You are an expert music marketing agent in the SonicStream team.
      Create professional marketing assets with tone: "${tone || 'creative'}".
      Assigned Track/Release: "${releaseName}"
      Genre/Mood: "${genre}"
      Theme detail: "${description}"
      Form Type requested: "${textType}"

      Return a comprehensive set of promotional material with distinct parts.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            adCopy: { type: Type.STRING, description: 'Compelling ad copy with hook and call to action' },
            socialPost: { type: Type.STRING, description: 'Facebook/Instagram/X post text with emojis and hashtags' },
            emailSubject: { type: Type.STRING, description: 'High open-rate subject line' },
            emailBody: { type: Type.STRING, description: 'Complete fan newsletter body context' },
            suggestedVisuals: { type: Type.STRING, description: 'AI image/video prompt suggestions for ad creative' },
            distributionStrategy: { type: Type.STRING, description: 'Targeting advice and timeline hints' }
          },
          required: ['adCopy', 'socialPost', 'emailSubject', 'emailBody', 'suggestedVisuals', 'distributionStrategy']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return res.json({ success: true, result });
  } catch (err: any) {
    console.error('[AI Marketing Engine Failure]', err);
    return res.status(500).json({ error: 'Failed to generate AI marketing material.', details: err.message });
  }
});

export default router;

