import { describe, it, expect } from 'vitest';
import {
  PRODUCT_TEMPLATES,
  pickTemplate,
  priceFor,
  buildExternalDrafts,
  buildCaption,
} from '../AutoPilot.js';

describe('pickTemplate', () => {
  it('rotates deterministically through the whole catalog and wraps around', () => {
    const n = PRODUCT_TEMPLATES.length;
    const firstPass = Array.from({ length: n }, (_, i) => pickTemplate(i).key);
    expect(new Set(firstPass).size).toBe(n); // every template used once per pass
    expect(pickTemplate(n).key).toBe(pickTemplate(0).key); // wraps
    expect(pickTemplate(-1).key).toBe(pickTemplate(n - 1).key); // negative-safe
  });
});

describe('priceFor', () => {
  it('always lands within the template range and ends in .99', () => {
    for (const t of PRODUCT_TEMPLATES) {
      for (const r of [0, 0.25, 0.5, 0.99]) {
        const p = priceFor(t, r);
        expect(p).toBeGreaterThanOrEqual(t.priceRange[0]);
        expect(p).toBeLessThanOrEqual(t.priceRange[1] + 0.99);
        expect(Math.round((p % 1) * 100)).toBe(99);
      }
    }
  });
});

describe('buildExternalDrafts', () => {
  const drafts = buildExternalDrafts('https://sonicstream.com/marketplace/abc123', 'New drop: Test Pack — $19.99');

  it('covers exactly the 10 largest platforms', () => {
    expect(drafts.map(d => d.platform).sort()).toEqual(
      ['facebook', 'instagram', 'messenger', 'snapchat', 'telegram', 'tiktok', 'wechat', 'whatsapp', 'x', 'youtube'].sort()
    );
  });

  it('only claims a share intent URL where one genuinely exists', () => {
    const intentPlatforms = drafts.filter(d => d.method === 'share_intent');
    const noIntent = drafts.filter(d => d.method !== 'share_intent');
    intentPlatforms.forEach(d => expect(d.shareUrl).toMatch(/^https:\/\//));
    // Instagram, TikTok, YouTube have no public third-party post intent; WeChat is QR.
    noIntent.forEach(d => expect(d.shareUrl).toBeNull());
    expect(noIntent.map(d => d.platform).sort()).toEqual(['instagram', 'tiktok', 'wechat', 'youtube']);
  });

  it('URL-encodes the product link and caption into intent URLs', () => {
    const fb = drafts.find(d => d.platform === 'facebook')!;
    expect(fb.shareUrl).toContain(encodeURIComponent('https://sonicstream.com/marketplace/abc123'));
    expect(fb.shareUrl).not.toContain(' '); // caption spaces must be encoded
  });

  it('every draft carries a pacing note - external posting is paced, never blind', () => {
    drafts.forEach(d => expect(d.pacingNote.length).toBeGreaterThan(10));
  });
});

describe('buildCaption', () => {
  it('includes name, formatted price, and the product URL', () => {
    const c = buildCaption('Neon Nights Cover Pack', 19.99, 'https://sonicstream.com/marketplace/xyz');
    expect(c).toContain('Neon Nights Cover Pack');
    expect(c).toContain('$19.99');
    expect(c).toContain('https://sonicstream.com/marketplace/xyz');
  });
});
