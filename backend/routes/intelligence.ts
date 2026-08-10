import express from 'express';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { authenticateToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        storyboard: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              frame: { type: SchemaType.NUMBER },
              visuals: { type: SchemaType.STRING },
              audio: { type: SchemaType.STRING },
              mood: { type: SchemaType.STRING }
            },
            required: ["frame", "visuals", "audio", "mood"]
          }
        },
        scriptConcept: { type: SchemaType.STRING },
        v12StyleNotes: { type: SchemaType.STRING }
      },
      required: ["storyboard", "scriptConcept", "v12StyleNotes"]
    }
  }
});

router.post('/generate-concept', authenticateToken, async (req, res) => {
  try {
    const { goals, targetAudience, visualReference } = req.body;

    const prompt = `
      As a V12 Multimedia creative engineer, generate a high-end visual storyboard and script concept for a project with the following brief:
      Goals: ${goals}
      Target Audience: ${targetAudience || 'General Elite'}
      Visual Reference: ${visualReference || 'Cinematic / Cyberpunk'}

      The concept should be edgy, high-tech, and urban. Provide a structured storyboard with at least 5 key frames.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json(JSON.parse(text));
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

export default router;
