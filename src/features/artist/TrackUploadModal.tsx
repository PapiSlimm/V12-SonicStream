import { useState, useRef } from 'react';
import { Upload, Music, X, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../api';
import { toast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';

interface TrackUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TrackUploadModal = ({ isOpen, onClose, onSuccess }: TrackUploadModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'upload' | 'details' | 'success'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    displayArtistName: user?.name || '',
    genre: 'Hip-Hop',
    album: '',
    price: 0.99,
    description: '',
    mood: '',
    lyrics: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const genres = ['Hip-Hop', 'R&B', 'Electronic', 'Pop', 'Jazz', 'Classical', 'Rock', 'Afrobeats'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStep('details');
      // Pre-fill title from filename
      setFormData(prev => ({
        ...prev,
        title: selectedFile.name.replace(/\.[^/.]+$/, "")
      }));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      // 1. Upload the audio file
      const uploadResponse = await api.tracks.uploadFile(file);
      const fileUrl = uploadResponse.url;
      
      // 2. Create the track record with metadata
        await api.tracks.upload({
          ...formData,
          fileUrl: fileUrl,
          streamUrl: fileUrl,
          duration: 180, // In a real app, we'd calculate this from the file
          isVideo: false,
          ownerUserId: user?.id || '',
          primaryArtistId: user?.id || ''
        });
      
      setStep('success');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload track');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl">
        <div className="p-8 flex justify-between items-center border-b border-white/5">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Music className="text-emerald-400" />
            Upload New Track
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {step === 'upload' && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center space-y-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group"
            >
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={32} className="text-zinc-500 group-hover:text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">Click to select audio file</p>
                <p className="text-sm text-zinc-500">MP3, WAV, or FLAC (Max 50MB)</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="audio/*" 
                onChange={handleFileChange}
              />
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Music className="text-emerald-400" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{file?.name}</p>
                  <p className="text-xs text-zinc-500">{(file?.size || 0 / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button onClick={() => setStep('upload')} className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Change</button>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Track Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
                      placeholder="e.g. Midnight City"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Artist Name</label>
                    <input 
                      type="text" 
                      value={formData.displayArtistName}
                      onChange={(e) => setFormData({...formData, displayArtistName: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
                      placeholder="e.g. M83"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Album / Release Name</label>
                    <input 
                      type="text" 
                      value={formData.album}
                      onChange={(e) => setFormData({...formData, album: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
                      placeholder="e.g. Hurry Up, We're Dreaming"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Genre</label>
                  <select 
                    value={formData.genre}
                    onChange={(e) => setFormData({...formData, genre: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all appearance-none"
                  >
                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Price (USD)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Mood</label>
                  <input 
                    type="text" 
                    value={formData.mood}
                    onChange={(e) => setFormData({...formData, mood: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. Energetic, Chill, Dark"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Lyrics (Optional)</label>
                <textarea 
                  value={formData.lyrics}
                  onChange={(e) => setFormData({...formData, lyrics: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all h-32 resize-none"
                  placeholder="Paste your lyrics here for better searchability..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Description (Optional)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all h-24 resize-none"
                  placeholder="Tell your fans about this track..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={isUploading || !formData.title}
                  className="flex-1 py-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                  {isUploading ? 'Uploading...' : 'Upload Track'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} className="text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Upload Successful!</h3>
                <p className="text-zinc-500 max-w-sm">
                  Your track has been submitted for moderation. It will be live on SonicStream once approved.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="px-12 py-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-2xl font-bold transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
