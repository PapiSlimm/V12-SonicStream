import { Response, NextFunction } from 'express';
import { AuthRequest } from '../domains/identity/auth.js';
import { AppError } from './error.js';
import { get, run } from '../db.js';

export async function checkAILimits(req: AuthRequest, _res: Response, next: NextFunction) {
  const userId = req.user?.id;
  if (!userId) throw new AppError('Unauthorized', 401);

  const user = await get<any>('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) throw new AppError('User not found', 404);

  const tier = user.subscriptionTier || 'free';

  // Non-paying users can not use any AI tools
  if (tier === 'free') {
    throw new AppError('AI tools are only available for SonicPro and SonicVisionary users.', 403);
  }

  // SonicVisionary Packages only allowed 100 generations a year
  if (tier === 'visionary') {
    const now = new Date();
    const lastReset = new Date(user.lastAiGenerationReset);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    // Reset count if more than a year has passed
    if (lastReset < oneYearAgo) {
      await run('UPDATE users SET ai_generations_count = 0, last_ai_generation_reset = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
      user.aiGenerationsCount = 0;
    }

    if (user.aiGenerationsCount >= 100) {
      throw new AppError('You have reached your annual limit of 100 AI generations.', 403);
    }
  }

  // Increment usage
  await run('UPDATE users SET ai_generations_count = ai_generations_count + 1 WHERE id = ?', [userId]);

  next();
}
