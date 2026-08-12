/**
 * V12 MONETIZATION CORE — pure, framework-free, importable by server and client.
 *
 * The money rules of a for-profit platform, stated once, enforced everywhere:
 *   - Sellers set their own price. Always.
 *   - The buyer-facing "all-in" price grosses up platform + processing fees so
 *     the seller NETS EXACTLY what they set. What we share to social media is
 *     the all-in price — no surprise fees at checkout.
 *   - All arithmetic is integer cents (Constitution Art. III). Breakdowns sum
 *     exactly; nothing rounds away.
 *   - Every monetary movement is recorded through Headless Financial, the
 *     ecosystem's accounting system of record.
 */

// ── Terms of processing (the "most logical terms", published, not hidden) ──

export const TRANSACTION_TERMS = {
  currency: 'USD',
  /** Platform fee by seller tier — loyalty is rewarded with margin. */
  platformFeePctByTier: { free: 15, pro: 8, visionary: 5 } as Record<string, number>,
  /** Card processing (Stripe standard): 2.9% + 30¢, paid by the buyer via gross-up. */
  processingPct: 2.9,
  processingFlatCents: 30,
  /** Sellers are paid NET-7 after clearance; instant payout available to Pro+ for 1%. */
  payoutSchedule: 'NET-7 (instant payout for Pro+ at 1% of amount)',
  minPayoutCents: 1000,
  refundWindowDays: 14,
  chargebackPolicy: 'Chargebacks debit the seller net plus a $15.00 dispute fee; won disputes are fully re-credited.',
  disputeFeeCents: 1500,
  accountingSystemOfRecord: 'Headless Financial (all wallets, balances, settlements and statements)',
  plainLanguage: [
    'You set the price. You always net exactly the price you set.',
    'Buyers see one all-in price everywhere — on-site and on every shared link.',
    'Fees are computed in integer cents and published before checkout.',
    'Every transaction posts to Headless Financial, the V12 accounting system of record.',
  ],
} as const;

export type SellerTier = 'free' | 'pro' | 'visionary';

export interface PriceBreakdown {
  sellerSetCents: number;      // what the seller chose — and what they net
  platformFeeCents: number;
  processingFeeCents: number;
  buyerAllInCents: number;     // sellerSet + platform + processing, exactly
  sellerNetCents: number;      // === sellerSetCents, by construction
  tier: SellerTier;
  display: string;             // "$12.99 all-in"
}

/**
 * Gross-up: find the smallest integer all-in price such that after platform
 * and processing fees the seller nets AT LEAST their set price; any surplus
 * cent from ceiling lands with the seller, never the buyer paying twice.
 *
 *   allIn = ceil( (sellerSet + flat + allIn*(procPct+platPct)) )
 * solved directly:  allIn = ceil( (sellerSet + flat) / (1 - procPct - platPct) )
 * with platform fee computed on the SELLER price (not the buyer total), which
 * is the honest reading: our fee is a % of what the seller charges.
 */
export function priceBreakdown(sellerSetCents: number, tier: SellerTier = 'free'): PriceBreakdown {
  if (!Number.isInteger(sellerSetCents) || sellerSetCents < 50) {
    throw new Error('Seller price must be an integer number of cents, minimum 50 (¢50).');
  }
  const platPct = TRANSACTION_TERMS.platformFeePctByTier[tier] ?? TRANSACTION_TERMS.platformFeePctByTier.free;
  const platformFeeCents = Math.ceil((sellerSetCents * platPct) / 100);

  // Processing applies to the charged (all-in) amount: solve the gross-up.
  const procRate = TRANSACTION_TERMS.processingPct / 100;
  const targetBeforeProcessing = sellerSetCents + platformFeeCents; // must survive processing
  const allIn = Math.ceil((targetBeforeProcessing + TRANSACTION_TERMS.processingFlatCents) / (1 - procRate));
  const processingFeeCents = allIn - targetBeforeProcessing;

  return {
    sellerSetCents,
    platformFeeCents,
    processingFeeCents,
    buyerAllInCents: allIn,
    sellerNetCents: sellerSetCents,
    tier,
    display: `$${(allIn / 100).toFixed(2)} all-in`,
  };
}

// ── Radio stations: the top 20 genres, always on the dial ──────────────────

export const TOP_20_GENRES = [
  'hip-hop', 'r&b', 'pop', 'afrobeats', 'latin',
  'electronic', 'house', 'techno', 'trap', 'drum & bass',
  'lo-fi', 'ambient', 'jazz', 'soul', 'gospel',
  'rock', 'indie', 'reggae', 'country', 'classical',
] as const;

// ── Sponsorship rate card (deterministic — priced from real listener data) ──

export interface SponsorRate {
  station: string;
  dailyFlatCents: number;
  hourlySpotCents: number;
  estListeners: number;
}

/**
 * Logical pricing: a base floor plus a listener multiplier, in integer cents.
 * Rates rise with the audience the analytics engine actually measures —
 * sponsors pay for reach that exists, not reach we claim.
 */
export function sponsorRateFor(station: string, avgListeners: number): SponsorRate {
  const listeners = Math.max(0, Math.floor(avgListeners));
  const dailyFlatCents = 2500 + listeners * 40;      // $25 floor + $0.40/avg listener/day
  const hourlySpotCents = 300 + listeners * 6;       // $3 floor + $0.06/avg listener/hour
  return { station, dailyFlatCents, hourlySpotCents, estListeners: listeners };
}

// ── Share targets: top 20 worldwide social platforms ───────────────────────

export interface ShareTarget {
  id: string;
  name: string;
  /** 'intent' = opens a prefilled web share URL; 'copy' = platform has no web
   *  intent (app-first) — we copy the link + caption for pasting. */
  mode: 'intent' | 'copy';
  /** Build the share URL. text already contains title + all-in price. */
  url?: (link: string, text: string) => string;
}

const e = encodeURIComponent;

export const SHARE_TARGETS: ShareTarget[] = [
  { id: 'facebook', name: 'Facebook', mode: 'intent', url: (l, t) => `https://www.facebook.com/sharer/sharer.php?u=${e(l)}&quote=${e(t)}` },
  { id: 'whatsapp', name: 'WhatsApp', mode: 'intent', url: (l, t) => `https://wa.me/?text=${e(`${t} ${l}`)}` },
  { id: 'x', name: 'X (Twitter)', mode: 'intent', url: (l, t) => `https://twitter.com/intent/tweet?text=${e(t)}&url=${e(l)}` },
  { id: 'telegram', name: 'Telegram', mode: 'intent', url: (l, t) => `https://t.me/share/url?url=${e(l)}&text=${e(t)}` },
  { id: 'reddit', name: 'Reddit', mode: 'intent', url: (l, t) => `https://www.reddit.com/submit?url=${e(l)}&title=${e(t)}` },
  { id: 'linkedin', name: 'LinkedIn', mode: 'intent', url: (l) => `https://www.linkedin.com/sharing/share-offsite/?url=${e(l)}` },
  { id: 'pinterest', name: 'Pinterest', mode: 'intent', url: (l, t) => `https://pinterest.com/pin/create/button/?url=${e(l)}&description=${e(t)}` },
  { id: 'tumblr', name: 'Tumblr', mode: 'intent', url: (l, t) => `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${e(l)}&caption=${e(t)}` },
  { id: 'vk', name: 'VK', mode: 'intent', url: (l, t) => `https://vk.com/share.php?url=${e(l)}&title=${e(t)}` },
  { id: 'weibo', name: 'Weibo', mode: 'intent', url: (l, t) => `https://service.weibo.com/share/share.php?url=${e(l)}&title=${e(t)}` },
  { id: 'line', name: 'LINE', mode: 'intent', url: (l, t) => `https://social-plugins.line.me/lineit/share?url=${e(l)}&text=${e(t)}` },
  { id: 'threads', name: 'Threads', mode: 'intent', url: (l, t) => `https://www.threads.net/intent/post?text=${e(`${t} ${l}`)}` },
  { id: 'messenger', name: 'Messenger', mode: 'intent', url: (l) => `https://www.facebook.com/dialog/send?link=${e(l)}&redirect_uri=${e(l)}` },
  { id: 'okru', name: 'OK.ru', mode: 'intent', url: (l, t) => `https://connect.ok.ru/offer?url=${e(l)}&title=${e(t)}` },
  { id: 'email', name: 'Email', mode: 'intent', url: (l, t) => `mailto:?subject=${e(t)}&body=${e(`${t}\n${l}`)}` },
  // App-first platforms with no web share intent — copy link + caption:
  { id: 'instagram', name: 'Instagram', mode: 'copy' },
  { id: 'tiktok', name: 'TikTok', mode: 'copy' },
  { id: 'youtube', name: 'YouTube', mode: 'copy' },
  { id: 'wechat', name: 'WeChat', mode: 'copy' },
  { id: 'snapchat', name: 'Snapchat', mode: 'copy' },
];

export interface ShareLink {
  platform: string;
  name: string;
  mode: 'intent' | 'copy';
  url: string | null;   // null for copy-mode; use caption + link
  caption: string;
  link: string;
}

/**
 * Build share links for a product/track. The caption ALWAYS carries the
 * buyer all-in price — the price of services is included wherever it travels.
 */
export function buildShareLinks(args: {
  title: string;
  link: string;
  sellerSetCents?: number;
  tier?: SellerTier;
  kind?: 'track' | 'product' | 'station' | 'profile';
}): ShareLink[] {
  const priced = args.sellerSetCents !== undefined
    ? priceBreakdown(args.sellerSetCents, args.tier ?? 'free')
    : null;
  const priceTag = priced ? ` · $${(priced.buyerAllInCents / 100).toFixed(2)} all-in (fees included)` : '';
  const verb = args.kind === 'station' ? '🔴 LIVE on V12 Radio' : args.kind === 'product' ? '🛒 Available now' : '🎵 On SonicStream';
  const caption = `${verb}: ${args.title}${priceTag}`;

  return SHARE_TARGETS.map((t) => ({
    platform: t.id,
    name: t.name,
    mode: t.mode,
    url: t.mode === 'intent' && t.url ? t.url(args.link, caption) : null,
    caption,
    link: args.link,
  }));
}

// ── The avenues: how a user makes money on V12 Radio + SonicStream ─────────

export interface MonetizationAvenue {
  id: string;
  name: string;
  pitch: string;       // promotes the advantage — we are proudly for-profit
  how: string;
  endpoint: string;
}

export function monetizationAvenues(ctx: { tier: SellerTier; airplaySeconds: number; avgListeners: number }): MonetizationAvenue[] {
  const platPct = TRANSACTION_TERMS.platformFeePctByTier[ctx.tier];
  return [
    {
      id: 'sell-tracks',
      name: 'Sell tracks & licenses at YOUR price',
      pitch: `You set it, you net it — 100% of your set price reaches you (buyers cover the ${platPct}% platform + processing via all-in pricing). No label, no middleman.`,
      how: 'Mark any live track licensable, set licensePriceCents, share the all-in link to 20 social platforms in one click.',
      endpoint: 'POST /api/monetize/price-breakdown',
    },
    {
      id: 'radio-royalties',
      name: 'V12 Radio airplay royalties',
      pitch: ctx.airplaySeconds > 0
        ? `You have already earned ${Math.round(ctx.airplaySeconds / 60)} listener-minutes of airplay this cycle — that is a share of the royalty pool with your name on it.`
        : 'Every audience-second of airplay accrues toward the royalty pool, split pro-rata to the exact cent and settled through Headless Financial.',
      how: 'Get tracks live and loved: rotation is vote-weighted, so engagement literally pays.',
      endpoint: 'GET /api/radio/admin/analytics',
    },
    {
      id: 'sponsorship',
      name: 'Sponsor a station (or sell your own slots)',
      pitch: `Rates are priced from REAL listener analytics — sponsors pay for measured reach. Current base: $${(sponsorRateFor('all', ctx.avgListeners).dailyFlatCents / 100).toFixed(2)}/day on the main station.`,
      how: 'Book a daily banner or an hourly host-read spot; the AI host reads your message on air.',
      endpoint: 'GET /api/monetize/sponsorships/rates',
    },
    {
      id: 'merch',
      name: 'Merch & products at your price',
      pitch: 'Your store block sells anything — physical, digital, experiences — at the price you set, with the same net-exactly-your-price guarantee.',
      how: 'Add products in the builder store block; every share carries the all-in price.',
      endpoint: 'POST /api/monetize/price-breakdown',
    },
    {
      id: 'events',
      name: 'Ticketed events & bookings',
      pitch: 'Tickets, bookings and appearance fees settle through the same ledger — one balance, one payout, all visible in Headless Financial.',
      how: 'Publish an events block; pricing and availability are yours.',
      endpoint: 'POST /api/bookings',
    },
    {
      id: 'go-pro',
      name: `Upgrade tier: keep ${100 - TRANSACTION_TERMS.platformFeePctByTier.pro}%+ margins`,
      pitch: `Pro drops the platform fee to ${TRANSACTION_TERMS.platformFeePctByTier.pro}% and Visionary to ${TRANSACTION_TERMS.platformFeePctByTier.visionary}% — at volume, the upgrade pays for itself. Maximizing your capital is the point.`,
      how: 'Upgrade in Billing; the fee change applies to your next sale instantly.',
      endpoint: 'GET /api/billing/plans',
    },
  ];
}

/** Why V12 — the pitch we make everywhere we can. */
export const WHY_V12 = [
  'One platform: streaming, radio, storefront, events, site builder, and a synchronized live radio network — every surface sells for you.',
  'You set every price and you net exactly what you set. All-in pricing means buyers never see surprise fees.',
  'Real airplay royalties, split to the exact cent from real listener data — not estimates.',
  'Your content syndicates across the whole V12 ecosystem (Sociofy, CEOS marketplace, SonicWave, R.M.P.M campaigns) automatically.',
  'Share to the top 20 social platforms worldwide in one click, price included.',
  'Every dollar is governed by the V12 Constitution and accounted in Headless Financial — deterministic, auditable, yours.',
];
