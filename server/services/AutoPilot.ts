import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';
import { logger } from '../middleware/error.js';
import { run } from '../db.js';
import { getGCSBucket, uploadToGCS } from '../utils/storage.js';

/**
 * V12 AUTOPILOT
 * =============
 * Autonomous product + promotion generator for the SonicStream ecosystem.
 *
 * Every cycle (default: 10x/hour):
 *   1. Rotates through a catalog of digital product templates.
 *   2. Uses Gemini to generate the product: name, description, price, and cover image.
 *   3. Lists it as a real, saleable product in the marketplace (Firestore `products`
 *      collection - the same collection the storefront reads).
 *   4. Auto-publishes a promotional post to the INTERNAL ecosystem social feed
 *      (our platform, our rules - safe to automate at full cadence).
 *   5. Generates EXTERNAL posts for the 10 largest social platforms as paced,
 *      ready-to-publish DRAFTS in `social_post_drafts`.
 *
 * Why drafts and not direct external blasting: every major platform requires
 * per-account OAuth through an approved developer app (Meta App Review, TikTok
 * audit, X pay-per-use API), and firing identical content in rapid bursts across
 * platforms trips spam detection even on sanctioned APIs. 240 external posts/day
 * is account-suicide; 240 internal posts/day is our own feed. The drafts queue
 * carries per-platform pacing metadata so a future connector (or a human with the
 * share sheet) publishes at platform-plausible cadence.
 */

// ---------------------------------------------------------------------------
// Pure, testable helpers
// ---------------------------------------------------------------------------

export interface ProductTemplate {
  key: string;
  displayType: string;   // marketplace product type
  namePrompt: string;    // steer for Gemini naming/description
  imagePrompt: string;   // steer for Gemini image generation
  priceRange: [number, number]; // USD
}

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  { key: 'cover_art_pack',   displayType: 'digital_download', namePrompt: 'a premium album cover art pack for independent artists',        imagePrompt: 'striking modern album cover art, bold typography space, dark cinematic palette with deep maroon accents', priceRange: [9, 29] },
  { key: 'flyer_template',   displayType: 'digital_download', namePrompt: 'a live event flyer template for promoters',                     imagePrompt: 'high-energy concert flyer design template, dramatic lighting, urban nightlife aesthetic',                 priceRange: [7, 19] },
  { key: 'social_banner_kit',displayType: 'digital_download', namePrompt: 'a social media banner kit for music creators',                  imagePrompt: 'cohesive social media banner set for a music brand, sleek dark design, chrome and maroon accents',        priceRange: [12, 24] },
  { key: 'lyric_sheet',      displayType: 'digital_download', namePrompt: 'a stylized printable lyric sheet template',                     imagePrompt: 'elegant printable lyric sheet design, minimalist typography on textured dark paper',                      priceRange: [5, 15] },
  { key: 'press_kit',        displayType: 'digital_download', namePrompt: 'an electronic press kit (EPK) template for artists',            imagePrompt: 'professional electronic press kit layout for a recording artist, editorial magazine style',               priceRange: [15, 39] },
  { key: 'visualizer_loop',  displayType: 'digital_download', namePrompt: 'a music visualizer background loop concept',                    imagePrompt: 'abstract audio-reactive visualizer frame, flowing particles, deep blacks with neon maroon light trails', priceRange: [10, 25] },
];

/** Deterministic template rotation: cycle N picks template N mod catalog size. */
export function pickTemplate(cycleIndex: number): ProductTemplate {
  const i = ((cycleIndex % PRODUCT_TEMPLATES.length) + PRODUCT_TEMPLATES.length) % PRODUCT_TEMPLATES.length;
  return PRODUCT_TEMPLATES[i];
}

/** Price snapped to .99 within the template's range - deterministic when rand provided. */
export function priceFor(t: ProductTemplate, rand: number = Math.random()): number {
  const [lo, hi] = t.priceRange;
  const raw = lo + rand * (hi - lo);
  return Math.max(lo, Math.floor(raw) + 0.99);
}

export interface ExternalDraft {
  platform: string;
  method: 'share_intent' | 'copy_open' | 'qr' | 'api_connector';
  shareUrl: string | null;   // pre-built intent URL where the platform supports one
  pacingNote: string;        // honest per-platform publishing guidance
}

/** The 10 largest platforms with honest per-platform publish mechanics. */
export function buildExternalDrafts(productUrl: string, caption: string): ExternalDraft[] {
  const u = encodeURIComponent(productUrl);
  const t = encodeURIComponent(caption);
  return [
    { platform: 'facebook',  method: 'share_intent', shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`, pacingNote: 'Graph API connector requires Meta App Review; intent link works today' },
    { platform: 'youtube',   method: 'copy_open',    shareUrl: null, pacingNote: 'No third-party post intent; use as community-post copy via YouTube Studio' },
    { platform: 'whatsapp',  method: 'share_intent', shareUrl: `https://api.whatsapp.com/send?text=${t}%20${u}`, pacingNote: 'Broadcast lists only to opted-in contacts' },
    { platform: 'instagram', method: 'copy_open',    shareUrl: null, pacingNote: 'Graph API publishing requires Business account + App Review; keep under ~50 posts/day hard cap, far fewer for organic reach' },
    { platform: 'tiktok',    method: 'copy_open',    shareUrl: null, pacingNote: 'Content Posting API requires TikTok audit; manual paste until connector approved' },
    { platform: 'wechat',    method: 'qr',           shareUrl: null, pacingNote: 'Share via QR scan inside WeChat' },
    { platform: 'messenger', method: 'share_intent', shareUrl: `https://www.facebook.com/dialog/send?link=${u}&redirect_uri=${u}`, pacingNote: 'Send dialog; no bulk automation' },
    { platform: 'telegram',  method: 'share_intent', shareUrl: `https://t.me/share/url?url=${u}&text=${t}`, pacingNote: 'Channel posting automatable via bot API on own channels' },
    { platform: 'snapchat',  method: 'share_intent', shareUrl: `https://www.snapchat.com/scan?attachmentUrl=${u}`, pacingNote: 'Creative Kit attachment link' },
    { platform: 'x',         method: 'share_intent', shareUrl: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, pacingNote: 'API is pay-per-use ($0.20/post with URL); keep to a human-plausible 2-5 posts/day per account' },
  ];
}

export function buildCaption(name: string, price: number, productUrl: string): string {
  return `🔥 NEW DROP on V12 SonicStream: ${name} — $${price.toFixed(2)}. Built for creators, ready today. ${productUrl}`;
}

// ---------------------------------------------------------------------------
// Cycle runner (side-effectful)
// ---------------------------------------------------------------------------

let cycleCounter = 0;
let timer: NodeJS.Timeout | null = null;

async function generateWithGemini(template: ProductTemplate): Promise<{ name: string; description: string; imageOutput: string | null }> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

  const textResp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate a marketplace listing for ${template.namePrompt}. Respond ONLY with JSON: {"name": "<catchy product name, max 8 words>", "description": "<2 sentence sales description>"} - no markdown fences.`,
  });
  let name = `V12 ${template.key.replace(/_/g, ' ')}`;
  let description = `Premium ${template.key.replace(/_/g, ' ')} generated by V12 AutoPilot.`;
  try {
    const parsed = JSON.parse((textResp.text || '').replace(/```json|```/g, '').trim());
    if (parsed.name) name = String(parsed.name).slice(0, 80);
    if (parsed.description) description = String(parsed.description).slice(0, 500);
  } catch { /* keep safe defaults */ }

  let imageOutput: string | null = null;
  try {
    const imgResp = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: template.imagePrompt }] },
      config: { imageConfig: { aspectRatio: '1:1' as any } },
    });
    for (const part of imgResp.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) { imageOutput = part.inlineData.data; break; }
    }
  } catch (err: any) {
    logger.warn(`[AutoPilot] Image generation failed (continuing without image): ${err?.message}`);
  }
  return { name, description, imageOutput };
}

export async function runAutoPilotCycle(): Promise<void> {
  const runId = `ap_${crypto.randomBytes(6).toString('hex')}`;
  const template = pickTemplate(cycleCounter++);
  const startedAt = new Date().toISOString();

  try {
    if (!config.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    const { name, description, imageOutput } = await generateWithGemini(template);
    const price = priceFor(template);

    // Persist product image
    let imageUrl: string | null = null;
    if (imageOutput) {
      imageUrl = `data:image/png;base64,${imageOutput}`;
      if (getGCSBucket()) {
        const tmp = path.join('/tmp', `${runId}.png`);
        fs.writeFileSync(tmp, Buffer.from(imageOutput, 'base64'));
        try { imageUrl = await uploadToGCS(tmp, `autopilot/${runId}.png`); }
        finally { try { fs.unlinkSync(tmp); } catch {} }
      }
    }

    // List in the marketplace (Firestore `products` - same collection the storefront reads)
    let productId: string | null = null;
    try {
      const { db: firestore } = await import('../firebase-admin.js');
      const doc = await (firestore as any).collection('products').add({
        sellerId: 'v12-autopilot',
        sellerName: 'V12 AutoPilot',
        name, description, price,
        type: template.displayType,
        imageUrl: imageUrl || null,
        status: 'active',
        isOfficial: true,
        brandName: 'V12 Multimedia',
        fulfillmentMethod: 'internal',
        createdAt: new Date().toISOString(),
      });
      productId = doc.id;
    } catch (err: any) {
      logger.warn(`[AutoPilot] Firestore product listing unavailable (${err?.message}); recording run without listing.`);
    }

    const productUrl = productId
      ? `${config.PUBLIC_BASE_URL || 'https://sonicstream.com'}/marketplace/${productId}`
      : `${config.PUBLIC_BASE_URL || 'https://sonicstream.com'}/marketplace`;
    const caption = buildCaption(name, price, productUrl);

    // Auto-publish to the INTERNAL ecosystem feed (full cadence is safe here)
    await run(
      `INSERT INTO posts (user_id, content, media_url, type, is_promotion, price, product_link, cta_link, cta_text)
       VALUES (?, ?, ?, 'product_drop', 1, ?, ?, ?, 'Shop Now')`,
      ['v12-autopilot', caption, imageUrl, price, productUrl, productUrl]
    ).catch(e => logger.warn(`[AutoPilot] Internal feed post failed: ${e.message}`));

    // Queue paced external drafts for the 10 largest platforms
    const drafts = buildExternalDrafts(productUrl, caption);
    for (const d of drafts) {
      await run(
        `INSERT INTO social_post_drafts (id, run_id, platform, method, share_url, caption, pacing_note, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ready')`,
        [`spd_${crypto.randomBytes(6).toString('hex')}`, runId, d.platform, d.method, d.shareUrl, caption, d.pacingNote]
      ).catch(() => {});
    }

    await run(
      `INSERT INTO autopilot_runs (id, template_key, product_id, product_name, price, image_url, status, started_at, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
      [runId, template.key, productId, name, price, imageUrl, startedAt, new Date().toISOString()]
    );
    logger.info(`[AutoPilot] Cycle ${runId} completed: "${name}" ($${price}) listed${productId ? ` as ${productId}` : ' (listing skipped)'}, 10 external drafts queued.`);
  } catch (err: any) {
    logger.error(`[AutoPilot] Cycle ${runId} failed: ${err?.message}`);
    await run(
      `INSERT INTO autopilot_runs (id, template_key, product_id, product_name, price, image_url, status, error_log, started_at, finished_at)
       VALUES (?, ?, NULL, NULL, NULL, NULL, 'failed', ?, ?, ?)`,
      [runId, template.key, err?.message || 'unknown', startedAt, new Date().toISOString()]
    ).catch(() => {});
  }
}

export function startAutoPilot(): void {
  if (timer) return;
  const perHour = Math.min(Math.max(config.AUTOPILOT_RUNS_PER_HOUR || 10, 1), 60);
  const intervalMs = Math.floor(3600000 / perHour);
  logger.info(`[AutoPilot] Starting: ${perHour} cycles/hour (every ${Math.round(intervalMs / 1000)}s). Estimated Gemini usage: ~${perHour * 24 * 2} calls/day.`);
  // First cycle after a short jitter so service startup isn't blocked
  setTimeout(() => { runAutoPilotCycle(); }, 15000);
  timer = setInterval(runAutoPilotCycle, intervalMs);
}

export function stopAutoPilot(): void {
  if (timer) { clearInterval(timer); timer = null; logger.info('[AutoPilot] Stopped.'); }
}
