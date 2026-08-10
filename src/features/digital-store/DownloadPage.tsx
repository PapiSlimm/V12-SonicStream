import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Download, 
  Music, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  ExternalLink,
  Shield
} from 'lucide-react';

const DownloadPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      // In a real app, we'd fetch the purchased tracks for this session
      // For demo, we'll mock the purchased tracks
      setTimeout(() => {
        setDownloads([
          { id: '1', title: 'Neon Dreams', artist: 'Sonic Pulse', isrc: 'US-SNC-26-00001' },
          { id: '2', title: 'Midnight Rain', artist: 'Lofi Luna', isrc: 'US-SNC-26-00002' }
        ]);
        setLoading(false);
      }, 1500);
    }
  }, [sessionId]);

  const handleDownload = async (trackId: string) => {
    try {
      const response = await fetch(`/api/digital/download/${sessionId}/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.download_url) {
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = data.download_url;
        link.setAttribute('download', data.filename || `track-${trackId}.mp3`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Download failed. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to generate download link.');
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto">
            <Shield size={40} />
          </div>
          <h1 className="text-3xl font-black text-white">Invalid Session</h1>
          <p className="text-zinc-500">We couldn't find a valid purchase session.</p>
          <Link to="/digital" className="inline-flex items-center gap-2 text-emerald-400 font-bold hover:text-emerald-300 transition-all">
            <ArrowLeft size={18} />
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-5xl font-black text-white">Purchase Successful!</h1>
        <p className="text-xl text-zinc-400 max-w-xl mx-auto">
          Thank you for supporting independent artists. Your high-quality downloads are ready below.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-bold border border-blue-500/20">
          <Clock size={16} />
          Links expire in 24 hours
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-zinc-900/50 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          downloads.map(track => (
            <div key={track.id} className="group bg-zinc-900/50 border border-white/5 rounded-[32px] p-8 hover:bg-zinc-900 transition-all flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600 group-hover:text-emerald-400 transition-colors">
                <Music size={32} />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-1">{track.title}</h3>
                <p className="text-zinc-500 font-medium mb-2">{track.artist}</p>
                <div className="text-xs text-zinc-600 font-mono">ISRC: {track.isrc}</div>
              </div>

              <button 
                onClick={() => handleDownload(track.id)}
                className="w-full md:w-auto bg-zinc-700 hover:bg-zinc-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-black/20 transition-all flex items-center justify-center gap-3"
              >
                <Download size={24} />
                Download MP3
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-zinc-500 text-sm flex items-center gap-2">
          <Shield size={16} className="text-emerald-400" />
          Securely processed via Stripe
        </div>
        <div className="flex gap-6">
          <Link to="/catalog" className="text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-sm font-bold">
            Manage Catalog
            <ExternalLink size={16} />
          </Link>
          <Link to="/digital" className="text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-2 text-sm font-bold">
            Continue Shopping
            <ArrowLeft size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
