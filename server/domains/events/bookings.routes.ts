import { Router } from 'express';
import { all, get, run } from '../../db.js';
import { authenticateToken, AuthRequest, requirePro } from '../identity/auth.js';
import { revenueBlocker } from '../../middleware/revenueBlocker.js';
import { z } from 'zod';
import { AppError } from '../../middleware/error.js';
import { Artist, Booking, LedgerTransactionType } from '../../types.js';
import { notify, notifyAdmins } from '../social/notification.service.js';
import { AuditService } from '../../services/AuditService.js';
import { LedgerService } from '../finance/ledger.service.js';
import { computeBookingQuote, ArtistPricingInfo } from './booking-pricing.service.js';

const router = Router();

const bookingSchema = z.object({
  artistId: z.number(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  startTime: z.string(),
  endTime: z.string(),
  riderCosts: z.number().optional().default(0),
  performanceGuaranteeId: z.string().optional(),
});

router.get('/artists', async (req, res) => {
  const artists = await all<Artist>('SELECT * FROM artists');
  res.json(artists);
});

router.post('/price', authenticateToken, requirePro, revenueBlocker, async (req: AuthRequest, res) => {
  const { artistId, startTime, duration, location } = req.body;
  const artist = await get<Artist>('SELECT * FROM artists WHERE id = ?', [artistId]);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });

  // Demand: confirmed bookings in the next 30d
  const booked = await get<{ cnt: number }>(`
    SELECT COUNT(*) as cnt FROM bookings 
    WHERE artist_id = ? AND start_time > CURRENT_TIMESTAMP AND status != 'cancelled'
  `, [artistId]);

  const basePrice = artist.price ?? (artist.priceCents ? artist.priceCents / 100 : 0);
  if (!basePrice || !artist.duration) {
    return res.status(422).json({ error: 'Artist has no valid pricing configured' });
  }

  const quote = computeBookingQuote(
    {
      price: basePrice,
      duration: artist.duration,
      marketPricing: (artist.marketPricing as ArtistPricingInfo['marketPricing']) ?? null,
    },
    {
      startTime,
      duration,
      location,
      recentBookingCount: booked?.cnt ?? 0,
    }
  );

  res.json(quote);
});

router.post('/bookings', authenticateToken, requirePro, revenueBlocker, async (req: AuthRequest, res) => {
  const validated = bookingSchema.parse(req.body);
  const { artistId, customerName, customerEmail, startTime, endTime, riderCosts, performanceGuaranteeId } = validated;

  const artist = await get<Artist>('SELECT * FROM artists WHERE id = ?', [artistId]);
  if (!artist) {
    throw new AppError('Artist not found', 404);
  }

  // 1. Conflict checking
  const conflict = await get(`
    SELECT id FROM bookings 
    WHERE artist_id = ? 
    AND status != 'cancelled'
    AND (
      (start_time <= ? AND end_time > ?) OR
      (start_time < ? AND end_time >= ?) OR
      (? <= start_time AND ? > start_time)
    )
  `, [artistId, startTime, startTime, endTime, endTime, startTime, endTime]);

  if (conflict) {
    throw new AppError('Artist is already booked for this time slot', 409);
  }

  // 2. Calculate final price (re-verify on server)
  const totalAmount = req.body.totalAmount || artist.price;
  const depositAmount = Math.round(totalAmount * 0.5 * 100) / 100;
  const commissionAmount = Math.round(totalAmount * 0.1 * 100) / 100;

  const result = await run(
    `INSERT INTO bookings (
      artist_id, user_id, customer_name, customer_email, start_time, end_time, 
      total_amount, deposit_amount, commission_amount, rider_costs, 
      performance_guarantee_id, status, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      artistId, req.user?.id, customerName, customerEmail, startTime, endTime, 
      totalAmount, depositAmount, commissionAmount, riderCosts, 
      performanceGuaranteeId, 'pending', 'pending'
    ]
  );

  // Notify admins
  await notifyAdmins('booking_inquiry', `New booking inquiry for artist ID ${artistId} from ${customerName}`);
  
  // Notify artist
  const artistUser = await get<{userId: string}>('SELECT user_id FROM artists WHERE id = ?', [artistId]);
  if (artistUser) {
    await notify(artistUser.userId, 'new_booking', `You have a new booking inquiry from ${customerName}`);
  }

  res.json({ id: result.lastID, totalAmount: artist.price });
});

router.get('/my-bookings', authenticateToken, async (req: AuthRequest, res) => {
  const bookings = await all<Booking>('SELECT * FROM bookings WHERE customer_email = ?', [req.user?.email]);
  res.json(bookings);
});

router.get('/artist/bookings', authenticateToken, async (req: AuthRequest, res) => {
  const artist = await get<{ id: number }>('SELECT id FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) {
    return res.json([]);
  }

  const bookings = await all<Booking>(`
    SELECT b.*, a.name as artist_name 
    FROM bookings b 
    JOIN artists a ON b.artist_id = a.id 
    WHERE b.artist_id = ? 
    ORDER BY b.start_time DESC
  `, [artist.id]);
  res.json(bookings);
});

router.get('/events', async (req, res) => {
  const { genre, popularity, startDate, endDate } = req.query;
  let query = `
    SELECT e.*, a.name as artist_name 
    FROM events e 
    JOIN artists a ON e.artist_id = a.id
    WHERE e.date > CURRENT_TIMESTAMP
  `;
  const params: any[] = [];

  if (genre) {
    query += ` AND e.genre = ?`;
    params.push(genre);
  }

  if (popularity) {
    query += ` AND e.popularity >= ?`;
    params.push(parseInt(popularity as string));
  }

  if (startDate) {
    query += ` AND e.date >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND e.date <= ?`;
    params.push(endDate);
  }

  query += ` ORDER BY e.date ASC`;

  const events = await all<SonicEvent>(query, params);
  res.json(events);
});

router.post('/events', authenticateToken, async (req: AuthRequest, res) => {
  const artist = await get<{ id: number }>('SELECT id FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) {
    throw new AppError('Only artists can create events', 403);
  }

  const { title, description, date, venue, city, price, ticketsAvailable, imageUrl, lat, lng } = req.body;
  
  const result = await run(
    `INSERT INTO events (
      artist_id, title, description, date, venue, city, price, tickets_available, image_url, lat, lng
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [artist.id, title, description, date, venue, city, price, ticketsAvailable, imageUrl, lat, lng]
  );

  res.json({ id: result.lastID, success: true });
});

router.get('/my-events', authenticateToken, async (req: AuthRequest, res) => {
  const artist = await get<{ id: number }>('SELECT id FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) {
    return res.json([]);
  }

  const events = await all<SonicEvent>('SELECT * FROM events WHERE artist_id = ? ORDER BY date DESC', [artist.id]);
  res.json(events);
});

router.put('/events/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const artist = await get<{ id: number }>('SELECT id FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) {
    throw new AppError('Only artists can edit events', 403);
  }

  const event = await get<{ artistId: number }>('SELECT artist_id FROM events WHERE id = ?', [id]);
  if (!event || event.artistId !== artist.id) {
    throw new AppError('Unauthorized', 403);
  }

  const { title, description, date, venue, city, price, ticketsAvailable, imageUrl, lat, lng } = req.body;
  
  await run(
    `UPDATE events SET 
      title = ?, description = ?, date = ?, venue = ?, city = ?, 
      price = ?, tickets_available = ?, image_url = ?, lat = ?, lng = ?
    WHERE id = ?`,
    [title, description, date, venue, city, price, ticketsAvailable, imageUrl, lat, lng, id]
  );

  res.json({ success: true });
});

router.delete('/events/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const artist = await get<{ id: number }>('SELECT id FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) {
    throw new AppError('Only artists can delete events', 403);
  }

  const event = await get<{ artistId: number }>('SELECT artist_id FROM events WHERE id = ?', [id]);
  if (!event || event.artistId !== artist.id) {
    throw new AppError('Unauthorized', 403);
  }

  await run('DELETE FROM events WHERE id = ?', [id]);
  res.json({ success: true });
});

router.post('/:id/confirm', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const artist = await get<{ userId: number }>('SELECT user_id FROM artists a JOIN bookings b ON a.id = b.artist_id WHERE b.id = ?', [id]);
  
  if (!artist || artist.userId !== req.user?.id) {
    throw new AppError('Unauthorized', 403);
  }

  await run('UPDATE bookings SET status = ? WHERE id = ?', ['confirmed', id]);
  res.json({ success: true, status: 'confirmed' });
});

router.post('/:id/reject', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const artist = await get<{ user_id: number }>('SELECT user_id FROM artists a JOIN bookings b ON a.id = b.artist_id WHERE b.id = ?', [id]);
  
  if (!artist || artist.user_id !== req.user?.id) {
    throw new AppError('Unauthorized', 403);
  }

  await run('UPDATE bookings SET status = ? WHERE id = ?', ['rejected', id]);
  res.json({ success: true, status: 'rejected' });
});

// Update event workflow state dynamically (pending, approved, scheduled, completed)
router.put('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'pending' | 'approved' | 'scheduled' | 'completed' | 'cancelled'
  const validStatuses = ['pending', 'approved', 'scheduled', 'completed', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid event workflow status', 400);
  }

  const booking = await get<{ artist_id: number, userId: string }>('SELECT artist_id, user_id as userId FROM bookings WHERE id = ?', [id]);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  await run('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);

  // Notify customer
  await notify(booking.userId, 'booking_status_updated', `Your booking status has been updated to "${status}".`);

  res.json({ success: true, bookingId: id, status });
});

// Create contract for a booking
router.post('/:id/contract', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { terms, refundPolicy, depositAmount, totalAmount } = req.body;

  const booking = await get('SELECT id, user_id FROM bookings WHERE id = ?', [id]);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const contractId = 'cont_' + Math.random().toString(36).substring(2, 11);
  const insertQuery = `
    INSERT INTO direct_sales (id, tenant_id, product_id, buyer_id, amount_cents, payment_status, shipping_details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  // Storing contract data in direct_sales as a secondary table fallback mapping
  await run(insertQuery, [
    contractId,
    req.user?.tenantId || 'default',
    `booking_contract_${id}`,
    req.user?.id || 'unknown',
    Math.round((totalAmount || 100) * 100),
    'pending',
    JSON.stringify({ terms, refundPolicy, depositAmount, bookingId: id })
  ]);

  res.json({
    success: true,
    contractId,
    bookingId: id,
    terms,
    refundPolicy,
    depositAmount,
    totalAmount,
    status: 'draft_pending_signature'
  });
});

// Create/Fetch Invoice & Deposit Details
router.get('/:id/invoice', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const booking = await get<any>('SELECT * FROM bookings WHERE id = ?', [id]);
  
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const basePrice = (booking.price || 1500); 
  const deposit = Math.round(basePrice * 0.3 * 100) / 100; // 30% Deposit standard
  const remaining = Math.round((basePrice - deposit) * 100) / 100;

  res.json({
    invoiceId: `inv_${id}_${Math.floor(Math.random() * 9000 + 1000)}`,
    bookingId: id,
    customerName: booking.customer_name || 'Valued Client',
    customerEmail: booking.customer_email,
    dateGenerated: new Date().toISOString().split('T')[0],
    pricing: {
      subtotal: basePrice,
      depositAmount: deposit,
      remainingAmount: remaining,
      currency: 'USD'
    },
    depositStatus: booking.status === 'confirmed' || booking.status === 'scheduled' ? 'paid' : 'pending',
    paymentTerms: 'Deposit required within 72 hours of booking approval'
  });
});

// Fetch Rooms, Assets & General Booking Resources
router.get('/resources', async (req, res) => {
  // Mock standard rooms and asset resources available for booking
  const rooms = [
    { id: 'rm_grand_center', name: 'R&B Grand Event Center Main Hall', capacity: 500, ratePerHour: 150, type: 'hall', address: '120 Studio Row' },
    { id: 'rm_studio_a', name: 'Acoustic Studio A', capacity: 15, ratePerHour: 75, type: 'studio', address: '120 Studio Row' },
    { id: 'rm_rooftop', name: 'OpenSky Rooftop Lounge', capacity: 120, ratePerHour: 200, type: 'lounge', address: '120 Studio Row' },
    { id: 'rm_rehearsal', name: 'Rehearsal Suite B', capacity: 8, ratePerHour: 40, type: 'suite', address: '120 Studio Row' }
  ];

  const assets = [
    { id: 'ast_pa_system', name: 'Pro-Power 2000W PA System', ratePerDay: 50, type: 'audio' },
    { id: 'ast_lighting', name: 'Ambiance Laser Suite & LED DMX', ratePerDay: 40, type: 'lighting' },
    { id: 'ast_bechstein', name: 'C. Bechstein Concert Grand Piano', ratePerDay: 120, type: 'instrument' }
  ];

  res.json({ rooms, assets });
});

// Book a Room/Asset Resource
router.post('/resources/book', authenticateToken, async (req: AuthRequest, res) => {
  const { resourceId, startTime, endTime, notes } = req.body;

  if (!resourceId || !startTime || !endTime) {
    throw new AppError('Missing resource booking parameters', 400);
  }

  // 1. Double check / auto-create resource reservations table
  await run(`
    CREATE TABLE IF NOT EXISTS resource_reservations (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'scheduled'
    )
  `);

  // 2. Resource Collision Check
  const conflict = await get(`
    SELECT id FROM resource_reservations 
    WHERE resource_id = ? 
    AND status != 'cancelled'
    AND (
      (start_time <= ? AND end_time > ?) OR
      (start_time < ? AND end_time >= ?) OR
      (? <= start_time AND ? > start_time)
    )
  `, [resourceId, startTime, startTime, endTime, endTime, startTime, endTime]);

  if (conflict) {
    throw new AppError('Resource is already booked/reserved for this overlapping time slot', 409);
  }

  const reservationId = 'res_' + Math.random().toString(36).substring(2, 11);
  
  await run(`
    INSERT INTO resource_reservations (id, resource_id, user_id, start_time, end_time, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [reservationId, resourceId, req.user!.id, startTime, endTime, notes || '', 'scheduled']);

  res.json({
    success: true,
    reservationId,
    resourceId,
    userId: req.user?.id,
    startTime,
    endTime,
    notes: notes || '',
    status: 'scheduled',
    message: 'Resource reserved successfully!'
  });
});

// Fetch Available Event & Production Packages
router.get('/packages', async (req, res) => {
  const packages = [
    {
      id: 'pkg_acoustic',
      name: 'Silver Live Acoustic Package',
      description: 'Ideal for intimate lounge gigs, solo artists, and small acoustic venues.',
      features: ['2-hour performance', 'Basic 4-channel PA & dynamic microphone', '1 sound technician included', 'Travel within 30 miles covered'],
      price: 500
    },
    {
      id: 'pkg_standard_stage',
      name: 'Gold Stage Show Package',
      description: 'The definitive full band and club performance package for regional crowd engagement.',
      features: ['3-hour performance', 'High-end 2000W PA system & monitor mix', '6 DMX scenic stage lights', 'Greenroom hospitality checklist', 'Travel up to 100 miles covered'],
      price: 1200
    },
    {
      id: 'pkg_festival',
      name: 'Platinum Full-Spectrum Festival Package',
      description: 'Designed for massive audiences, arenas, theaters, or multi-day concert festivals.',
      features: ['Unlimited showtime slots', '3D programmed visual laser mapping suite', 'Multi-camera HD livestreaming archive', 'Full logistics management (hotels, riders)', 'Unlimited travel range'],
      price: 3000
    }
  ];
  res.json({ success: true, packages });
});

// Sign/Consent to Booking Contract
router.post('/:id/contract/sign', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const contract = await get<any>("SELECT id, amount_cents FROM direct_sales WHERE product_id = ?", [`booking_contract_${id}`]);
  if (!contract) {
    throw new AppError('Associated contract draft not found for this booking.', 404);
  }

  // Update payment_status to indicate marked signed
  await run("UPDATE direct_sales SET payment_status = 'signed' WHERE id = ?", [contract.id]);

  const booking = await get<{ user_id: string, artist_id: string }>('SELECT user_id, artist_id FROM bookings WHERE id = ?', [id]);
  if (booking) {
    await notify(booking.user_id, 'contract_signed', `The technical contract rider for booking #${id} has been signed successfully!`);
    const artistUser = await get<{user_id: string}>('SELECT user_id FROM artists WHERE id = ?', [booking.artist_id]);
    if (artistUser) {
      await notify(artistUser.user_id, 'contract_signed', `The client has signed the booking contract rider for event #${id}!`);
    }
  }

  await AuditService.log(userId, 'contract_create', 'booking', id, { contractId: contract.id, status: 'signed' });

  res.json({
    success: true,
    contractId: contract.id,
    status: 'signed',
    message: 'Contract riders signed and approved! Preparing billing deposit.'
  });
});

// Process Booking Deposit Billing
router.post('/:id/deposit/pay', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const booking = await get<any>('SELECT * FROM bookings WHERE id = ?', [id]);
  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  const basePrice = booking.price || 1500;
  const depositAmount = Math.round(basePrice * 0.3 * 100) / 100; // 30% Deposit

  // Update booking status on successful deposit to scheduled/confirmed
  await run("UPDATE bookings SET status = 'scheduled' WHERE id = ?", [id]);

  // Track double entry deposit routing in system ledger
  const artistUser = await get<{user_id: string, tenant_id: string}>('SELECT user_id, tenant_id FROM artists WHERE id = ?', [booking.artist_id]);
  const artistUserId = artistUser?.user_id || 'system_artist';
  const tenantId = artistUser?.tenant_id || 'default';

  await LedgerService.createBalancedTransaction({
    tenantId,
    type: LedgerTransactionType.PAYMENT,
    description: `Booking Deposit for Event #${id}`,
    entries: [
      { accountType: 'PROCESSOR', amount: -depositAmount }, // Debit processor
      { accountType: 'USER', userId: artistUserId, amount: depositAmount } // Credit artist earnings wallet
    ]
  });

  await AuditService.log(userId, 'marketplace_order', 'booking', id, { depositAmount, total: basePrice });
  
  await notify(booking.user_id, 'booking_confirmed', `Your event deposit of $${depositAmount} has been verified. Your booking is officially scheduled!`);
  if (artistUser) {
    await notify(artistUser.user_id, 'event_confirmed', `Great news! Deposit of $${depositAmount} was paid for booking #${id}. The event is now officially scheduled.`);
  }

  res.json({
    success: true,
    bookingId: id,
    depositAmount,
    status: 'scheduled',
    message: 'Deposit payment processed. Event is officially scheduled!'
  });
});

export default router;
