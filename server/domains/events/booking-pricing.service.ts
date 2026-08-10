/**
 * Booking dynamic-pricing engine, extracted from bookings.routes.ts (2026-07)
 * so the money math is a pure function that can be unit-tested. Behavior is
 * identical to the previous inline implementation.
 */

export interface ArtistPricingInfo {
  price: number;              // base price for the artist's standard duration
  duration: number;           // standard set duration (same unit as requested duration)
  marketPricing?: {
    peakDates?: string[];               // 'YYYY-MM-DD' dates with surge demand
    demandMultiplier?: number;          // applied on peak dates (default 1.5)
    locationFees?: Record<string, number>; // flat fee per named location
  } | null;
}

export interface BookingQuoteInput {
  startTime: string | Date;   // event start
  duration?: number;          // requested duration; defaults to artist standard
  location?: string;
  recentBookingCount: number; // artist's confirmed bookings in the next 30 days
  now?: Date;                 // injectable clock for deterministic tests
}

export interface BookingQuote {
  dynamicPrice: number;
  deposit: number;      // 50% of total
  commission: number;   // 10% platform commission
  breakdown: {
    demand: number;     // 0..1 demand score applied
    urgency: number;    // 1.3 when < 7 days out, else 1
    market: 'Applied' | 'Standard';
  };
}

export function computeBookingQuote(artist: ArtistPricingInfo, input: BookingQuoteInput): BookingQuote {
  const now = input.now ?? new Date();
  const startDt = new Date(input.startTime);
  const daysUntil = (startDt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const dayOfWeek = startDt.getDay(); // 0=Sun, 6=Sat

  let price = artist.price;
  const eventDur = input.duration || artist.duration;
  price *= eventDur / artist.duration; // duration scaling

  // Market & timing: demand dates and location fees
  const marketPricing = artist.marketPricing;
  if (marketPricing) {
    if (marketPricing.peakDates?.includes(startDt.toISOString().split('T')[0])) {
      price *= marketPricing.demandMultiplier || 1.5;
    }
    if (input.location && marketPricing.locationFees?.[input.location]) {
      price += marketPricing.locationFees[input.location];
    }
  }

  if (dayOfWeek === 0 || dayOfWeek === 6) price *= 1.2;  // weekend premium
  if (daysUntil < 7) price *= 1.3;                        // urgency premium

  // Demand pressure: caps at +20% once the artist has 10+ upcoming bookings
  const demand = Math.min(input.recentBookingCount / 10, 1);
  price *= (1 + demand * 0.2);

  const dynamicPrice = Math.round(price * 100) / 100;
  const deposit = Math.round(dynamicPrice * 0.5 * 100) / 100;
  const commission = Math.round(dynamicPrice * 0.1 * 100) / 100;

  return {
    dynamicPrice,
    deposit,
    commission,
    breakdown: {
      demand: Math.round(demand * 100) / 100,
      urgency: daysUntil < 7 ? 1.3 : 1,
      market: marketPricing ? 'Applied' : 'Standard',
    },
  };
}
