import { describe, it, expect } from 'vitest';
import { computeBookingQuote, ArtistPricingInfo } from '../booking-pricing.service.js';

// Fixed clock: Saturday 2026-08-01T12:00:00Z. Day-of-week assertions use midday UTC
// timestamps so the test is stable regardless of the runner's local timezone offset.
const NOW = new Date('2026-08-01T12:00:00Z');

// 2026-08-19 is a Wednesday, 18 days out: no weekend premium, no urgency premium.
const WEDNESDAY_FAR = '2026-08-19T12:00:00Z';
const SATURDAY_FAR = '2026-08-22T12:00:00Z';
const SUNDAY_FAR = '2026-08-23T12:00:00Z';
const WEDNESDAY_SOON = '2026-08-05T12:00:00Z'; // 4 days out: urgency applies

const baseArtist: ArtistPricingInfo = {
  price: 1000,
  duration: 2,
  marketPricing: null,
};

const baseInput = {
  startTime: WEDNESDAY_FAR,
  recentBookingCount: 0,
  now: NOW,
};

describe('computeBookingQuote', () => {
  it('baseline: standard duration, weekday, far out, zero demand → base price untouched', () => {
    const q = computeBookingQuote(baseArtist, baseInput);
    expect(q.dynamicPrice).toBe(1000);
    expect(q.deposit).toBe(500);        // always 50% of total
    expect(q.commission).toBe(100);     // always 10% of total
    expect(q.breakdown).toEqual({ demand: 0, urgency: 1, market: 'Standard' });
  });

  it('scales price linearly with requested duration vs the artist standard set', () => {
    const q = computeBookingQuote(baseArtist, { ...baseInput, duration: 4 }); // 2x standard
    expect(q.dynamicPrice).toBe(2000);

    const half = computeBookingQuote(baseArtist, { ...baseInput, duration: 1 });
    expect(half.dynamicPrice).toBe(500);
  });

  it('applies the 20% weekend premium on both Saturday and Sunday', () => {
    expect(computeBookingQuote(baseArtist, { ...baseInput, startTime: SATURDAY_FAR }).dynamicPrice).toBe(1200);
    expect(computeBookingQuote(baseArtist, { ...baseInput, startTime: SUNDAY_FAR }).dynamicPrice).toBe(1200);
  });

  it('applies the 30% urgency premium under 7 days out, and reports it in the breakdown', () => {
    const q = computeBookingQuote(baseArtist, { ...baseInput, startTime: WEDNESDAY_SOON });
    expect(q.dynamicPrice).toBe(1300);
    expect(q.breakdown.urgency).toBe(1.3);
  });

  it('applies the peak-date surge with a 1.5x default multiplier', () => {
    const artist: ArtistPricingInfo = {
      ...baseArtist,
      marketPricing: { peakDates: ['2026-08-19'] },
    };
    const q = computeBookingQuote(artist, baseInput);
    expect(q.dynamicPrice).toBe(1500);
    expect(q.breakdown.market).toBe('Applied');
  });

  it('honors an explicit demandMultiplier on peak dates', () => {
    const artist: ArtistPricingInfo = {
      ...baseArtist,
      marketPricing: { peakDates: ['2026-08-19'], demandMultiplier: 2 },
    };
    expect(computeBookingQuote(artist, baseInput).dynamicPrice).toBe(2000);
  });

  it('adds a flat location fee, and weekend premium multiplies the fee-inclusive total', () => {
    const artist: ArtistPricingInfo = {
      ...baseArtist,
      marketPricing: { locationFees: { NYC: 200 } },
    };
    // Weekday: 1000 + 200 = 1200
    expect(computeBookingQuote(artist, { ...baseInput, location: 'NYC' }).dynamicPrice).toBe(1200);
    // Saturday: (1000 + 200) * 1.2 = 1440 - the premium applies AFTER the fee is added
    expect(computeBookingQuote(artist, { ...baseInput, location: 'NYC', startTime: SATURDAY_FAR }).dynamicPrice).toBe(1440);
    // Unknown location: no fee
    expect(computeBookingQuote(artist, { ...baseInput, location: 'Nowhere' }).dynamicPrice).toBe(1000);
  });

  it('adds 2% per upcoming booking and hard-caps demand pressure at +20%', () => {
    const five = computeBookingQuote(baseArtist, { ...baseInput, recentBookingCount: 5 });
    expect(five.dynamicPrice).toBe(1100); // 1 + 0.5*0.2
    expect(five.breakdown.demand).toBe(0.5);

    const ten = computeBookingQuote(baseArtist, { ...baseInput, recentBookingCount: 10 });
    expect(ten.dynamicPrice).toBe(1200);

    const overloaded = computeBookingQuote(baseArtist, { ...baseInput, recentBookingCount: 250 });
    expect(overloaded.dynamicPrice).toBe(1200); // capped - not 6000
    expect(overloaded.breakdown.demand).toBe(1);
  });

  it('deposit and commission are always derived from the FINAL rounded total', () => {
    const q = computeBookingQuote(baseArtist, {
      ...baseInput,
      startTime: SATURDAY_FAR,
      recentBookingCount: 3,
    });
    // 1000 * 1.2 (weekend) * 1.06 (demand 0.3) = 1272
    expect(q.dynamicPrice).toBe(1272);
    expect(q.deposit).toBe(636);
    expect(q.commission).toBe(127.2);
  });

  it('rounds all money values to 2 decimal places', () => {
    const artist: ArtistPricingInfo = { price: 333.33, duration: 3, marketPricing: null };
    const q = computeBookingQuote(artist, { ...baseInput, duration: 1, recentBookingCount: 1 });
    // 333.33 * (1/3) * 1.02 = 113.3322 → 113.33
    expect(q.dynamicPrice).toBe(113.33);
    expect(Number.isInteger(q.deposit * 100)).toBe(true);
    expect(Number.isInteger(Math.round(q.commission * 100))).toBe(true);
  });

  it('full stack: duration + peak + location + weekend + urgency + capped demand compose in order', () => {
    const artist: ArtistPricingInfo = {
      price: 500,
      duration: 2,
      marketPricing: {
        peakDates: ['2026-08-02'],
        demandMultiplier: 1.5,
        locationFees: { ATL: 100 },
      },
    };
    // Sunday 2026-08-02, 1 day out, 4h set, ATL, 12 upcoming bookings:
    // 500 * (4/2) = 1000 → *1.5 peak = 1500 → +100 ATL = 1600
    // → *1.2 weekend = 1920 → *1.3 urgency = 2496 → *1.2 demand cap = 2995.2
    const q = computeBookingQuote(artist, {
      startTime: '2026-08-02T12:00:00Z',
      duration: 4,
      location: 'ATL',
      recentBookingCount: 12,
      now: NOW,
    });
    expect(q.dynamicPrice).toBe(2995.2);
    expect(q.deposit).toBe(1497.6);
    expect(q.commission).toBe(299.52);
    expect(q.breakdown).toEqual({ demand: 1, urgency: 1.3, market: 'Applied' });
  });
});
