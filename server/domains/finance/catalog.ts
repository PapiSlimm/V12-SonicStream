/**
 * Server-authoritative catalog for SonicStream's built-in showcase items
 * (beat leases, creator services, event tickets).
 *
 * Prices live HERE, not in the browser. Checkout resolves a cart item's SKU
 * against this table so a buyer can never tamper with the amount they pay.
 *
 * SKU formats (produced by the client cart):
 *   beat:<beatId>:<licenseId>   e.g. "beat:beat-3:basic"
 *   svc:<serviceId>             e.g. "svc:svc-1"
 *   tkt:<concertId>             e.g. "tkt:tkt-2"
 */

export interface CatalogLine {
  name: string;
  unitAmountCents: number;
}

const LICENSES: Record<string, { name: string; price: number }> = {
  basic: { name: 'Basic Lease', price: 19.99 },
  premium: { name: 'Premium Lease', price: 49.99 },
  unlimited: { name: 'Unlimited Lease', price: 149.99 },
  exclusive: { name: 'Exclusive Ownership', price: 499.99 },
};

const BEATS: Record<string, { title: string }> = {
  'beat-1': { title: 'Midnight Neon' },
  'beat-2': { title: 'Soul Drift' },
  'beat-3': { title: 'Glitch Horizon' },
  'beat-4': { title: 'Ethereal Flow' },
};

const SERVICES: Record<string, { title: string; price: number }> = {
  'svc-1': { title: 'World-Class Mastering', price: 49.0 },
  'svc-2': { title: 'Elite Vocal Mixing', price: 125.0 },
  'svc-3': { title: 'Interactive Cyber Cover Art', price: 75.0 },
};

const TICKETS: Record<string, { title: string; price: number }> = {
  'tkt-1': { title: 'SonicStream Genesis VR Live', price: 9.99 },
  'tkt-2': { title: 'Brutalist Club London (VIP)', price: 49.99 },
  'tkt-3': { title: 'Modular Synthesizer Grid Session', price: 25.0 },
};

const toCents = (dollars: number): number => Math.round(dollars * 100);

/** True if this id is a built-in catalog SKU (vs. a Firestore product id). */
export function isCatalogSku(productId: string): boolean {
  return /^(beat|svc|tkt):/.test(productId);
}

/**
 * Resolve a catalog SKU to an authoritative Stripe line item.
 * Returns null when the SKU is malformed or references an unknown item.
 */
export function resolveCatalogItem(productId: string): CatalogLine | null {
  if (productId.startsWith('beat:')) {
    const [, beatId, licenseId] = productId.split(':');
    const beat = BEATS[beatId];
    const lic = LICENSES[licenseId];
    if (!beat || !lic) return null;
    return { name: `${beat.title} [${lic.name}]`, unitAmountCents: toCents(lic.price) };
  }
  if (productId.startsWith('svc:')) {
    const svc = SERVICES[productId.slice(4)];
    return svc ? { name: `Creator Service: ${svc.title}`, unitAmountCents: toCents(svc.price) } : null;
  }
  if (productId.startsWith('tkt:')) {
    const tkt = TICKETS[productId.slice(4)];
    return tkt ? { name: `Ticket: ${tkt.title}`, unitAmountCents: toCents(tkt.price) } : null;
  }
  return null;
}
