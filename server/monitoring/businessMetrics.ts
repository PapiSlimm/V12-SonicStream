import promClient from 'prom-client';
import { register } from './metrics.js';

// Marketplace Metrics
export const ordersCreated = new promClient.Counter({
  name: 'sonic_orders_created_total',
  help: 'Total marketplace orders created',
  labelNames: ['category'],
  registers: [register]
});

export const ordersFailed = new promClient.Counter({
  name: 'sonic_orders_failed_total',
  help: 'Total marketplace orders that failed',
  labelNames: ['reason'],
  registers: [register]
});

export const cartAbandonments = new promClient.Counter({
  name: 'sonic_cart_abandonments_total',
  help: 'Total abandonments of digital shopping carts',
  registers: [register]
});

// Bookings Metrics
export const bookingRequests = new promClient.Counter({
  name: 'sonic_booking_requests_total',
  help: 'Total session booking requests submitted',
  labelNames: ['type'],
  registers: [register]
});

export const bookingFailures = new promClient.Counter({
  name: 'sonic_booking_failures_total',
  help: 'Total session booking failures',
  labelNames: ['reason'],
  registers: [register]
});

// Ticketing Metrics
export const ticketsSold = new promClient.Counter({
  name: 'sonic_tickets_sold_total',
  help: 'Total virtual admission tickets sold',
  labelNames: ['eventId'],
  registers: [register]
});

export const ticketFailures = new promClient.Counter({
  name: 'sonic_ticket_failures_total',
  help: 'Total ticket purchasing process failures',
  registers: [register]
});

// Memberships Metrics
export const activeSubscriptions = new promClient.Gauge({
  name: 'sonic_active_subscriptions',
  help: 'Current active subscription volume',
  labelNames: ['tier'],
  registers: [register]
});

export const subscriptionRenewals = new promClient.Counter({
  name: 'sonic_subscription_renewals_total',
  help: 'Total successful auto-recurring renewals',
  labelNames: ['tier'],
  registers: [register]
});

export const subscriptionFailures = new promClient.Counter({
  name: 'sonic_subscription_failures_cumulative',
  help: 'Cumulative count of active subscription payment errors/revocations',
  labelNames: ['tier', 'reason'],
  registers: [register]
});

// Affiliate Program Metrics
export const affiliateClicks = new promClient.Counter({
  name: 'sonic_affiliate_clicks_total',
  help: 'Total traffic generated via affiliate links',
  labelNames: ['referralCode'],
  registers: [register]
});

export const affiliateConversions = new promClient.Counter({
  name: 'sonic_affiliate_conversions_total',
  help: 'Total successful buyouts/actions completed via affiliate links',
  labelNames: ['referralCode'],
  registers: [register]
});

export const affiliatePayouts = new promClient.Counter({
  name: 'sonic_affiliate_payouts_total',
  help: 'Total payload/volume paid to affiliate marketers',
  labelNames: ['affiliateId'],
  registers: [register]
});

// Creator Revenue Gauge
export const creatorRevenue = new promClient.Gauge({
  name: 'sonic_creator_revenue_usd',
  help: 'Total tracked revenue disbursed to creators in USD',
  labelNames: ['creatorId', 'type'],
  registers: [register]
});
