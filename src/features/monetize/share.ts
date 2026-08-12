/**
 * One-click sharing to the top 20 worldwide social platforms — with the
 * all-in price (services included) baked into every caption.
 *
 * Usage anywhere in the app:
 *   const links = await fetchShareLinks({ title: track.title, link: trackUrl, sellerSetCents: 1299, kind: 'track' });
 *   shareTo(links[0]);   // opens the intent, or copies caption+link for app-first platforms
 */
import toast from 'react-hot-toast';

export interface ShareLinkDto {
  platform: string;
  name: string;
  mode: 'intent' | 'copy';
  url: string | null;
  caption: string;
  link: string;
}

function authHeader(): Record<string, string> {
  try {
    const token = localStorage.getItem('token') ?? localStorage.getItem('authToken') ?? '';
    return token ? { authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function fetchShareLinks(args: {
  title: string;
  link: string;
  sellerSetCents?: number;
  kind?: 'track' | 'product' | 'station' | 'profile';
}): Promise<ShareLinkDto[]> {
  const res = await fetch('/api/monetize/share-links', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeader() },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`share-links failed: HTTP ${res.status}`);
  const data = await res.json();
  return data.links as ShareLinkDto[];
}

/** Open a web intent, or copy caption + link for app-first platforms. */
export async function shareTo(target: ShareLinkDto): Promise<void> {
  if (target.mode === 'intent' && target.url) {
    window.open(target.url, '_blank', 'noopener,noreferrer,width=680,height=560');
    return;
  }
  // Instagram / TikTok / YouTube / WeChat / Snapchat: no web intent exists —
  // copy the ready-made caption + link for pasting into the app.
  try {
    await navigator.clipboard.writeText(`${target.caption}\n${target.link}`);
    toast.success(`Caption + link copied — paste it in ${target.name}`);
  } catch {
    toast.error('Could not copy — long-press the link to copy manually.');
  }
}

/** Native share sheet when available (mobile) — falls back to the 20-target list. */
export async function shareNative(caption: string, link: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await (navigator as any).share({ title: caption, text: caption, url: link });
      return true;
    } catch { /* user cancelled or unsupported payload */ }
  }
  return false;
}
