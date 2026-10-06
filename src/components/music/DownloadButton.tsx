import { Download } from 'lucide-react';
import { useState } from 'react';
import { CheckoutModal } from '../commerce/CheckoutModal';

interface DownloadButtonProps {
  trackId: string;
  trackTitle: string;
  artistName: string;
  price?: number;
}

export const DownloadButton = ({ trackId, trackTitle, price = 0.99 }: DownloadButtonProps) => {
  const [showCheckout, setShowCheckout] = useState(false);

  const handleDownloadClick = () => {
    setShowCheckout(true);
  };

  return (
    <>
      <button 
        onClick={handleDownloadClick}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-black/10"
      >
        <Download size={14} />
        Download MP3 (${price})
      </button>

      <CheckoutModal 
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        items={[{
          id: trackId,
          name: `${trackTitle} (Digital Download)`,
          price: price,
          type: 'download',
          imageUrl: `https://picsum.photos/seed/${trackId}/100/100`
        }]}
      />
    </>
  );
};
