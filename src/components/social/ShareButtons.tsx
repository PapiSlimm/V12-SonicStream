import {
  Share2,
  Link as LinkIcon,
  CheckCircle2,
  Facebook,
  Youtube,
  Instagram,
  MessageCircle,
  Send,
  Ghost,
  Twitter,
  Music2,
  MessagesSquare,
  QrCode
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

/**
 * Share menu covering the world's ten largest social platforms by monthly active
 * users (2026): Facebook, YouTube, WhatsApp, Instagram, TikTok, WeChat,
 * Facebook Messenger, Telegram, Snapchat, and X.
 *
 * Platform notes:
 * - Facebook, WhatsApp, Messenger, Telegram, Snapchat, X: true web share intents.
 * - YouTube, Instagram, TikTok: no public web share-intent for third-party URLs -
 *   these copy the link and open the platform so the user can paste it into a
 *   post/story/bio (the standard industry approach).
 * - WeChat: sharing happens by scanning a QR code inside WeChat - we copy the
 *   link and show a QR of the URL.
 */
export const ShareButtons = ({ url, title, className }: ShareButtonsProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async (silent = false) => {
    try {
      await navigator.clipboard.writeText(url);
      if (!silent) {
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      }
      return true;
    } catch {
      if (!silent) toast.error('Could not copy link');
      return false;
    }
  };

  const copyThenOpen = async (destination: string, platformName: string) => {
    await copyLink(true);
    toast.success(`Link copied — paste it in your ${platformName} post`);
    window.open(destination, '_blank', 'noopener,noreferrer');
  };

  // Native share sheet (mobile) - covers every installed app in one tap.
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        setShowMenu(false);
        return;
      } catch { /* user cancelled - fall through to menu */ }
    }
    setShowMenu(!showMenu);
  };

  const intentPlatforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'hover:text-blue-500',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'hover:text-green-500',
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`
    },
    {
      name: 'Messenger',
      icon: MessagesSquare,
      color: 'hover:text-sky-500',
      href: `https://www.facebook.com/dialog/send?link=${encodedUrl}&redirect_uri=${encodedUrl}`
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'hover:text-sky-400',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
    },
    {
      name: 'Snapchat',
      icon: Ghost,
      color: 'hover:text-yellow-400',
      href: `https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`
    },
    {
      name: 'X',
      icon: Twitter,
      color: 'hover:text-zinc-300',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
    }
  ];

  const copyOpenPlatforms = [
    { name: 'Instagram', icon: Instagram, color: 'hover:text-fuchsia-400', dest: 'https://www.instagram.com/' },
    { name: 'TikTok', icon: Music2, color: 'hover:text-rose-400', dest: 'https://www.tiktok.com/upload' },
    { name: 'YouTube', icon: Youtube, color: 'hover:text-red-500', dest: 'https://studio.youtube.com/' }
  ];

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={nativeShare}
        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all group"
        title="Share"
        aria-label="Share"
      >
        <Share2 size={20} className="group-hover:scale-110 transition-transform" />
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setShowMenu(false); setShowQr(false); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full mb-4 right-0 w-80 bg-zinc-900 border border-white/10 rounded-3xl p-4 shadow-2xl z-50 space-y-4"
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2">Share to</div>

              <div className="grid grid-cols-3 gap-2">
                {intentPlatforms.map((platform) => (
                  <a
                    key={platform.name}
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowMenu(false)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-zinc-400',
                      platform.color
                    )}
                  >
                    <platform.icon size={20} />
                    <span className="text-[8px] font-bold uppercase tracking-widest">{platform.name}</span>
                  </a>
                ))}

                {copyOpenPlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => { copyThenOpen(platform.dest, platform.name); setShowMenu(false); }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-zinc-400',
                      platform.color
                    )}
                  >
                    <platform.icon size={20} />
                    <span className="text-[8px] font-bold uppercase tracking-widest">{platform.name}</span>
                  </button>
                ))}

                <button
                  onClick={() => { copyLink(true); setShowQr(!showQr); }}
                  className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-zinc-400 hover:text-emerald-400"
                >
                  <QrCode size={20} />
                  <span className="text-[8px] font-bold uppercase tracking-widest">WeChat</span>
                </button>
              </div>

              {showQr && (
                <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/5">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodedUrl}`}
                    alt="QR code for sharing on WeChat"
                    width={140}
                    height={140}
                    className="rounded-xl bg-white p-2"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                    Scan inside WeChat to share
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={() => copyLink()}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <LinkIcon size={16} className="text-zinc-500 group-hover:text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Copy Link</span>
                  </div>
                  {copied && <CheckCircle2 size={14} className="text-emerald-500" />}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
