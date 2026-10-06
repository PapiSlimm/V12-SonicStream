import { Router } from 'express';
import { authenticateToken, AuthRequest, requireArtist } from '../identity/auth.js';
import { db } from '../../firebase-admin.js';
import { AppError } from '../../middleware/error.js';
import { notify, notifyAdmins } from '../social/notification.service.js';
import { all } from '../../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const eventsSnapshot = await db.collection('sonic_events').get();
    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/:id/go-live', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  let eventTitle = 'Live Music Showcase';
  
  try {
    const docRef = db.collection('events').doc(id);
    const doc = await docRef.get();
    if (doc.exists) {
      eventTitle = doc.data()?.title || eventTitle;
      await docRef.update({ isLive: true, status: 'live' });
    } else {
      const docRefSonic = db.collection('sonic_events').doc(id);
      const docSonic = await docRefSonic.get();
      if (docSonic.exists) {
        eventTitle = docSonic.data()?.title || eventTitle;
        await docRefSonic.update({ isLive: true, status: 'live' });
      }
    }
  } catch (err) {
    console.error('Error updating event status in Firestore:', err);
  }

  // Automatically send push notifications via the NotificationService
  try {
    const sqliteUsers = await all<{ id: number }>('SELECT id FROM users');
    for (const usr of sqliteUsers) {
      await notify(usr.id, 'event_go_live', `The event "${eventTitle}" is now LIVE! Engage with attendees in the real-time stream broadcast now!`);
    }
  } catch (err) {
    console.error('Error sending push notifications via SQLite:', err);
  }

  try {
    const usersSnap = await db.collection('users').get();
    for (const docUser of usersSnap.docs) {
      await notify(docUser.id, 'event_go_live', `The event "${eventTitle}" is now LIVE! Engage with attendees in the real-time stream broadcast now!`);
    }
  } catch (err) {
    console.error('Error sending push notifications via Firestore:', err);
  }

  try {
    await notifyAdmins('event_live_broadcast', `The event "${eventTitle}" (ID: ${id}) is now broadcasting live.`);
  } catch (err) {
    console.error('Error notifying admins about live event:', err);
  }

  // Trigger real-time notifications to connected websockets
  const io = req.app.get('socketio');
  if (io) {
    io.to(id).emit('event-went-live', { eventId: id, title: eventTitle });
    io.emit('global-notification', {
      type: 'event_go_live',
      message: `The event "${eventTitle}" is now LIVE! Broadcast stream is running.`,
      eventId: id
    });
  }

  res.json({ success: true, message: 'Event went live and attendees have been notified successfully.' });
});

router.post('/', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { title, description, date, venue, city, price, ticketsAvailable, artistId, artistName, imageUrl } = req.body;
  
  const eventData = {
    title,
    description,
    date,
    venue,
    city,
    price,
    ticketsAvailable,
    artistId,
    artistName,
    organizerId: req.user?.id,
    imageUrl,
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await db.collection('sonic_events').add(eventData);
    res.json({ id: docRef.id, ...eventData });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.put('/:id', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const docRef = db.collection('sonic_events').doc(id);
  
  try {
    const doc = await docRef.get();

    if (!doc.exists) throw new AppError('Event not found', 404);
    if (doc.data()?.organizerId !== req.user?.id) throw new AppError('Unauthorized', 403);

    await docRef.update(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating event:', err);
    if (err instanceof AppError) throw err;
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:id', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const docRef = db.collection('sonic_events').doc(id);
  
  try {
    const doc = await docRef.get();

    if (!doc.exists) throw new AppError('Event not found', 404);
    if (doc.data()?.organizerId !== req.user?.id) throw new AppError('Unauthorized', 403);

    await docRef.delete();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting event:', err);
    if (err instanceof AppError) throw err;
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
