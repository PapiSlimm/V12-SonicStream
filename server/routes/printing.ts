import { Router } from 'express';
import { all, run, get } from '../db.js';
import { authenticateToken, AuthRequest, authenticateAdmin } from '../domains/identity/auth.js';
import { revenueBlocker } from '../middleware/revenueBlocker.js';
import { z } from 'zod';
import Stripe from 'stripe';
import { config } from '../config.js';

const router = Router();
let stripeInstance: Stripe | null = null;
const getStripe = () => {
  if (!stripeInstance) {
    if (!config.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required. Set it in .env');
    }
    stripeInstance = new Stripe(config.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

const MARKUPMULTIPLIER = 1.7; // 70% markup

const printOrderSchema = z.object({
  cart: z.array(z.any()),
  shippingAddress: z.any(),
  email: z.string().email().optional(),
});

// 1) Create PaymentIntent for print cart
router.post('/create-payment-intent', authenticateToken, revenueBlocker, async (req: AuthRequest, res) => {
  try {
    const { cart, shippingAddress, email } = printOrderSchema.parse(req.body);
    const user = req.user!;

    // Calculate total (our price, already includes 70% markup)
    const subtotal = cart.reduce((sum, item) => {
      return sum + (item.product.our_price || 0);
    }, 0);

    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    // Create Stripe PaymentIntent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: user.id.toString(),
        cart: JSON.stringify(
          cart.map((item) => ({
            id: item.product.id,
            name: item.product.name,
            quantity: item.options?.quantity || 1,
            price: item.product.our_price,
          }))
        ),
        shippingAddress: JSON.stringify(shippingAddress),
        orderType: 'print_order',
      },
      receipt_email: email || user.email,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      total,
      zooCostEstimate: subtotal / MARKUPMULTIPLIER,
    });
  } catch (error: any) {
    console.error('Stripe error', error);
    res.status(500).json({ error: error.message });
  }
});

// 2) Stripe Checkout Session (used by PrintCheckout.tsx)
router.post('/checkout', authenticateToken, revenueBlocker, async (req: AuthRequest, res) => {
  try {
    const { items, shipping_address, print_file_name } = req.body;
    const user = req.user!;

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: `${item.format} - File: ${print_file_name}`,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${config.APP_URL}/printing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.APP_URL}/printing?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        orderType: 'print_order',
        shippingAddress: JSON.stringify(shipping_address),
        printFileName: print_file_name
      }
    });

    // We'll insert into DB after successful payment via webhook in a real app,
    // but for this applet we'll insert a pending order now.
    const zooCostEstimate = subtotal / MARKUPMULTIPLIER;
    const profitEstimate = subtotal - zooCostEstimate;

    await run(
      `INSERT INTO printorders (userid, paymentintentid, customeremail, cart, shippingaddress, amountcharged, zoocostestimate, profitestimate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        session.id,
        user.email,
        JSON.stringify(items),
        JSON.stringify(shipping_address),
        total,
        zooCostEstimate,
        profitEstimate,
        'pending'
      ]
    );

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error', error);
    res.status(500).json({ error: error.message });
  }
});

// 3) Get order by session ID (for success page)
router.get('/order-by-session/:sessionId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const user = req.user!;

    const order = await get(
      `SELECT * FROM printorders WHERE paymentintentid = ? AND userid = ?`,
      [sessionId, user.id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      id: order.id.toString(),
      total: order.amountcharged,
      customerEmail: order.customeremail,
      cart: JSON.parse(order.cart),
      shippingAddress: JSON.parse(order.shippingaddress),
      status: order.status,
      date: order.created_at
    });
  } catch (error: any) {
    console.error('Get order error', error);
    res.status(500).json({ error: error.message });
  }
});

// 4) Create print order + profit estimate (after checkout)
router.post('/orders', authenticateToken, revenueBlocker, async (req: AuthRequest, res) => {
  const { cart } = req.body;
  const user = req.user!;

  // Our revenue vs ZooPrinting cost
  const ourRevenue = cart.reduce((sum: number, item: any) => {
    return sum + (item.product.our_price || 0);
  }, 0);

  const zooCost = cart.reduce((sum: number, item: any) => {
    // zoo_price is implied base cost; our_price = zoo_price * MARKUPMULTIPLIER
    return sum + (item.product.zoo_price || (item.product.our_price || 0) / MARKUPMULTIPLIER);
  }, 0);

  const profit = ourRevenue - zooCost;

  // Forward to ZooPrinting API (simulated)
  try {
    // In real app: call ZooPrinting API here
    const zooOrderId = `zoo-${Date.now()}`;
    const trackingUrl = `https://zooprinting.com/track/${Date.now()}`;

    console.log(
      `Print Order Profit ${profit.toFixed(
        2
      )} (70% markup) for User ${user.id}`
    );

    // Log in admin logs
    await run(
      `INSERT INTO adminlogs (adminid, action, targettype, targetid, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        1,
        'print_order',
        'user',
        user.id,
        `Profit ${profit.toFixed(2)}, Revenue ${ourRevenue.toFixed(2)}`,
      ]
    );

    res.json({
      success: true,
      orderId: zooOrderId,
      totalCharged: ourRevenue,
      zooCost,
      estimatedProfit: profit,
      trackingUrl,
    });
  } catch (error) {
    console.error('Printing order error', error);
    res.status(500).json({ error: 'Order processing failed' });
  }
});

router.post('/buy-ticket', authenticateToken, async (req: AuthRequest, res) => {
  const { eventId, tickets } = req.body;
  
  const event = await get<any>('SELECT * FROM events WHERE id = ?', [eventId]);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  if (event.tickets_available < tickets) {
    return res.status(400).json({ error: 'Not enough tickets available' });
  }
  
  const stripe = getStripe();
  
  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Ticket for ${event.title}`,
          description: `Event at ${event.venue}, ${event.city} on ${event.date}`,
        },
        unit_amount: Math.round(event.price * 100),
      },
      quantity: tickets,
    }],
    mode: 'payment',
    success_url: `${config.APP_URL}/events/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.APP_URL}/events/cancel`,
    metadata: {
      userId: req.user?.id,
      eventId: eventId.toString(),
      tickets: tickets.toString(),
      orderType: 'event_ticket'
    }
  });
  
  res.json({ url: session.url });
});

router.get('/my-orders', authenticateToken, async (req: AuthRequest, res) => {
  const printOrders = await all('SELECT * FROM printorders WHERE userid = ? ORDER BY created_at DESC', [req.user?.id]);
  const ticketOrders = await all(`
    SELECT es.*, e.title as event_title, e.date as event_date, e.venue as event_venue
    FROM event_sales es
    JOIN events e ON es.event_id = e.id
    WHERE es.user_id = ?
    ORDER BY es.created_at DESC
  `, [req.user?.id]);
  
  res.json({ printOrders, ticketOrders });
});

// Admin routes
router.get('/admin/stats', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const stats = await get(`
      SELECT 
        SUM(amountcharged) as totalRevenue,
        SUM(zoocostestimate) as totalCost,
        SUM(profitestimate) as totalProfit,
        COUNT(*) as totalOrders
      FROM printorders
      WHERE status != 'cancelled'
    `);
    
    const recentOrders = await all(`
      SELECT p.*, u.name as userName
      FROM printorders p
      JOIN users u ON p.userid = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    res.json({
      stats: {
        totalRevenue: stats.totalRevenue || 0,
        totalCost: stats.totalCost || 0,
        totalProfit: stats.totalProfit || 0,
        totalOrders: stats.totalOrders || 0
      },
      recentOrders
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/orders', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const orders = await all(`
      SELECT p.*, u.name as userName
      FROM printorders p
      JOIN users u ON p.userid = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
