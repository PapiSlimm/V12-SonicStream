import { Router } from 'express';
import { all, run, get } from '../../db.js';
import { authenticateToken, AuthRequest } from '../identity/auth.js';
import { AppError } from '../../middleware/error.js';
import { Room } from '../../types.js';

const router = Router();

// 1. LIST ROOMS (Live + Discovery)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  const rooms = await all<Room>(`
    SELECT r.*, u.name as hostName, u.avatar_url as hostAvatar,
           (SELECT COUNT(*) FROM room_participants WHERE roomId = r.id) as participant_count
    FROM rooms r
    JOIN users u ON r.hostId = u.id
    WHERE r.status = 'live'
    ORDER BY participant_count DESC, r.created_at DESC
  `);
  res.json(rooms);
});

// 2. CREATE ROOM (Monetization Hook)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const { title, type, isPaid, price } = req.body;
  if (!title) throw new AppError('Room title is required', 400);

  const id = `room_${Math.random().toString(36).substr(2, 9)}`;
  
  await run(`
    INSERT INTO rooms (id, title, hostId, type, status, isPaid, price)
    VALUES(?, ?, ?, ?, ?, ?, ?)
  `, [id, title, req.user?.id, type || 'audio', 'live', isPaid ? 1 : 0, price || 0]);

  // Join as host
  await run(`
    INSERT INTO room_participants (roomId, userId, role)
    VALUES(?, ?, ?)
  `, [id, req.user?.id, 'host']);

  res.json({ roomId: id });
});

// 3. JOIN ROOM (Payment verification for paid rooms)
router.post('/:roomId/join', authenticateToken, async (req: AuthRequest, res) => {
  const { roomId } = req.params;
  const room = await get<Room>('SELECT * FROM rooms WHERE id = ?', [roomId]);
  if (!room) throw new AppError('Room not found', 404);

  if (room.status !== 'live') throw new AppError('Room has ended', 400);

  // If paid room, check for purchase or Pro status
  if (room.isPaid && room.hostId !== req.user?.id) {
    const purchase = await get('SELECT id FROM room_purchases WHERE roomId = ? AND userId = ?', [roomId, req.user?.id]);
    if (!purchase && !req.user?.isPro) {
      return res.status(402).json({ error: 'Payment required to join this premium room', price: room.price });
    }
  }

  // Add participant
  await run(`
    INSERT INTO room_participants (roomId, userId, role)
    VALUES(?, ?, 'listener')
    ON CONFLICT (roomId, userId) DO UPDATE SET role = excluded.role
  `, [roomId, req.user?.id]);

  // Emit real-time Join Event
  const io = (req.app as any).get('io');
  if (io) {
    io.to(`room-${roomId}`).emit('user_joined', { 
      userId: req.user?.id, 
      roomId,
      userName: req.user?.name 
    });
  }

  res.json({ success: true });
});

// 4. END ROOM
router.post('/:roomId/end', authenticateToken, async (req: AuthRequest, res) => {
  const { roomId } = req.params;
  const room = await get<Room>('SELECT * FROM rooms WHERE id = ?', [roomId]);
  
  if (!room) throw new AppError('Room not found', 404);
  if (room.hostId !== req.user?.id) throw new AppError('Only host can end room', 403);

  await run("UPDATE rooms SET status = 'ended' WHERE id = ?", [roomId]);
  
  const io = (req.app as any).get('io');
  if (io) {
    io.to(`room-${roomId}`).emit('room_ended', { roomId });
  }

  res.json({ success: true });
});

export default router;
