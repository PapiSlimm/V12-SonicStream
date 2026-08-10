import { Router } from 'express';
import { authenticateToken, AuthRequest } from './auth.js';
import { run, get, all } from '../../db.js';
import { AppError } from '../../middleware/error.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { User } from '../../types.js';
import { getWritablePath, getGCSBucket, uploadToGCS } from '../../utils/storage.js';

const router = Router();
const upload = multer({ dest: getWritablePath('uploads/avatars/') });

router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  const user = await get<User>('SELECT id, email, name, user_type, is_pro, subscription_tier, balance, email_verified, avatar_url, bio, social_links, preferred_genres FROM users WHERE id = ?', [req.user?.id]);
  if (!user) throw new AppError('User not found', 404);
  
  res.json(user);
});

router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  const { name, bio, socialLinks, preferredGenres } = req.body;
  
  await run(
    'UPDATE users SET name = ?, bio = ?, social_links = ?, preferred_genres = ? WHERE id = ?',
    [name, bio, JSON.stringify(socialLinks), JSON.stringify(preferredGenres), req.user?.id]
  );

  const updatedUser = await get<User>('SELECT id, email, name, user_type, is_pro, subscription_tier, balance, email_verified, avatar_url, bio, social_links, preferred_genres FROM users WHERE id = ?', [req.user?.id]);
  res.json(updatedUser);
});

router.post('/avatar/upload', authenticateToken, upload.single('avatar'), async (req: AuthRequest, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const fileExt = path.extname(req.file.originalname);
  const fileName = `${req.user?.id}_${Date.now()}${fileExt}`;
  
  let avatarUrl = '';
  const bucketName = getGCSBucket();

  if (bucketName) {
    try {
      avatarUrl = await uploadToGCS(req.file.path, `avatars/${fileName}`);
      // Clean up the local temp file
      fs.unlinkSync(req.file.path);
    } catch (err: any) {
      console.error('Failed to upload avatar to GCS:', err);
      // Fallback local operation on error
      const targetPath = getWritablePath(path.join('uploads/avatars', fileName));
      const avatarsDir = getWritablePath('uploads/avatars');
      if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
      }
      fs.renameSync(req.file.path, targetPath);
      avatarUrl = `/uploads/avatars/${fileName}`;
    }
  } else {
    // Standard local fallback (dev or container-local)
    const targetPath = getWritablePath(path.join('uploads/avatars', fileName));
    const avatarsDir = getWritablePath('uploads/avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    fs.renameSync(req.file.path, targetPath);
    avatarUrl = `/uploads/avatars/${fileName}`;
  }

  await run('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user?.id]);
  
  res.json({ avatarUrl });
});

router.post('/upgrade', authenticateToken, async (req: AuthRequest, res) => {
  const { tier } = req.body;
  const validTiers = ['free', 'star', 'visionary', 'pro', 'enterprise'];
  if (!validTiers.includes(tier)) {
    throw new AppError('Invalid tier', 400);
  }

  const isProNum = (tier !== 'free') ? 1 : 0;
  const status = 'active';
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  const expiresAtStr = expiresAt.toISOString();

  await run(
    `UPDATE users 
     SET subscription_tier = ?, is_pro = ?, subscription_status = ?, subscription_expires_at = ?, subscription_cancel_at = NULL 
     WHERE id = ?`,
    [tier, isProNum, status, expiresAtStr, req.user?.id]
  );
  res.json({ success: true, tier, subscription_status: status, subscription_expires_at: expiresAtStr });
});

router.post('/update-payout-threshold', authenticateToken, async (req: AuthRequest, res) => {
  const { threshold } = req.body;
  if (typeof threshold !== 'number' || threshold < 10) {
    throw new AppError('Invalid threshold. Minimum is $10.00', 400);
  }

  await run('UPDATE users SET payout_threshold = ? WHERE id = ?', [threshold, req.user?.id]);
  res.json({ success: true, threshold });
});

router.get('/search', authenticateToken, async (req: AuthRequest, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') return res.json([]);

  const users = await all<any>(`
    SELECT id, name, email, avatar_url as avatarUrl
    FROM users 
    WHERE (name LIKE ? OR email LIKE ?) AND id != ?
    LIMIT 10
  `, [`%${q}%`, `%${q}%`, req.user?.id]);

  res.json(users);
});

export default router;
