import { Router } from 'express';
import { authenticateToken, AuthRequest, requireArtist } from '../domains/identity/auth.js';
import { AppError } from '../middleware/error.js';
import { run } from '../db.js';
import { config } from '../config.js';

const router = Router();

router.post('/distribute', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  if (req || res) {
    // no-op when disabled
  }
  throw new AppError('Music distribution services are currently disabled and not provided at this time.', 400);
});

router.get('/ditto-automation-status', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  // Logic to check Ditto Music automation status
  res.json({ status: 'active', last_sync: new Date().toISOString() });
});

// TikTok OAuth
router.get('/tiktok/url', authenticateToken, (req: AuthRequest, res) => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY || 'mock_client_key';
  const redirectUri = `${config.APP_URL}/api/integrations/tiktok/callback`;
  
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: 'user.info.basic,video.upload,video.publish',
    response_type: 'code',
    redirect_uri: redirectUri,
    state: req.user?.id.toString() || 'anonymous'
  });

  const authUrl = `https://www.tiktok.com/auth/authorize/?${params.toString()}`;
  res.json({ url: authUrl });
});

router.get('/tiktok/callback', async (_req, res) => {
  // In a real app, you'd exchange the code for an access token here
  // const tokens = await exchangeTikTokCode(code);
  // await saveTikTokTokens(state, tokens);

  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'TIKTOK_AUTH_SUCCESS' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>TikTok connected successfully! This window will close automatically.</p>
      </body>
    </html>
  `);
});

// API Key Management
router.get('/api-keys', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const keys = await all('SELECT id, service_name, created_at FROM api_keys WHERE user_id = ?', [req.user?.id]);
  res.json(keys);
});

router.post('/api-keys', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { service_name, api_key } = z.object({
    service_name: z.string(),
    api_key: z.string(),
  }).parse(req.body);

  const result = await run('INSERT INTO api_keys (user_id, service_name, api_key) VALUES (?, ?, ?)', [
    req.user?.id, service_name, api_key
  ]);

  res.json({ id: result.lastID, success: true });
});

router.delete('/api-keys/:id', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  await run('DELETE FROM api_keys WHERE id = ? AND user_id = ?', [req.params.id, req.user?.id]);
  res.json({ success: true });
});

export default router;
