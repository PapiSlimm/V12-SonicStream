import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../domains/identity/auth.js';
import { db } from '../firebase-admin.js';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const assetsSnapshot = await db.collection('pro_assets').get();
    const assets = assetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by user tier
    const userTier = req.user?.subscription_tier || 'free';
    const filteredAssets = assets.filter((asset: any) => {
      if (userTier === 'pro') return true;
      if (userTier === 'visionary' && asset.required_tier === 'visionary') return true;
      return false;
    });

    res.json(filteredAssets);
  } catch (err) {
    console.error('Error fetching assets:', err);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

export default router;
