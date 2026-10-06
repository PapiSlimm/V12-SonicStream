import { useState } from 'react';
import { Video, Image } from 'lucide-react';
import { ContentRatingField } from '../../components/forms/ContentRatingField';
import { CategoryTagsField } from '../../components/forms/CategoryTagsField';
import { Input, Select } from '../../components/ui/Form';
import { Button } from '../../components/ui/Button';

export const VideoUploadForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    isrc: '',
    video_file: null as File | null,
    thumbnail: null as File | null,
    category: '',
    tags: [] as string[],
    content_rating: 'G',
    territory: 'worldwide',
    monetization: 'ad_supported',
    release_date: '',
    lyrics: false,
    performers: '',
    composers: ''
  });

  // VIDEO REQUIREMENTS VALIDATION
  const videoRequirements = {
    formats: ['video/mp4', 'video/quicktime', 'video/x-m4v'],
    max_size_mb: 30000, // 30GB (Industry standard spec)
    min_resolution: '1920x1080',
    codecs: ['H.264', 'ProRes 422', 'MPEG-2'],
    frame_rates: ['23.976', '24', '25', '30'],
    audio: '44.1kHz stereo'
  };

  const thumbnailRequirements = {
    formats: ['image/jpeg', 'image/png'],
    dimensions: '1280x720 min',
    max_size_mb: 10
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateVideoFile = (file: File) => {
    const errors: string[] = [];
    if (!videoRequirements.formats.includes(file.type)) {
      errors.push('Must be MP4, MOV, or M4V');
    }
    if (file.size > videoRequirements.max_size_mb * 1024 * 1024) {
      errors.push('Max 30GB file size');
    }
    return errors;
  };

  const validateThumbnail = (file: File) => {
    const errors: string[] = [];
    if (!thumbnailRequirements.formats.includes(file.type)) {
      errors.push('JPEG or PNG only');
    }
    if (file.size > thumbnailRequirements.max_size_mb * 1024 * 1024) {
      errors.push('Max 10MB');
    }
    return errors;
  };

  const handleSubmit = async () => {
    const videoErrors = formData.video_file ? validateVideoFile(formData.video_file) : ['No video'];
    const thumbErrors = formData.thumbnail ? validateThumbnail(formData.thumbnail) : ['No thumbnail'];
    
    if (videoErrors.length || thumbErrors.length) {
      alert(`Video: ${videoErrors.join(', ')}\nThumbnail: ${thumbErrors.join(', ')}`);
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value instanceof File) {
        data.append(key, value);
      } else if (Array.isArray(value)) {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, String(value));
      }
    });

    try {
      const response = await fetch('/api/video/upload', {
        method: 'POST',
        body: data
      });
      const result = await response.json();
      console.log('Video submitted:', result);
      alert('Video submitted successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload video');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-12 bg-zinc-900/50 border border-white/10 rounded-[2.5rem]">
      <h1 className="text-4xl font-black mb-12 bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
        🎥 Music Video Upload
      </h1>

      <div className="grid md:grid-cols-2 gap-12">
        {/* VIDEO FILE */}
        <div className="space-y-4">
          <label className="block text-lg font-bold text-white mb-2">
            Video File <span className="text-red-400">*</span>
          </label>
          <div className="border-2 border-dashed border-white/20 rounded-3xl p-12 text-center hover:border-emerald-400 transition-colors relative">
            <input
              type="file"
              accept={videoRequirements.formats.join(',')}
              onChange={(e) => setFormData({ ...formData, video_file: e.target.files?.[0] || null })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div>
              <Video size={64} className="mx-auto mb-4 text-zinc-500" />
              <div className="text-lg font-bold text-white">{formData.video_file?.name || 'Choose Video'}</div>
              <div className="text-sm text-zinc-500 mt-2">{formatFileSize(formData.video_file?.size)}</div>
            </div>
          </div>
          <div className="text-xs text-zinc-500 space-y-1">
            <div><strong>Requirements:</strong></div>
            <div>• MP4, MOV, M4V only (H.264/ProRes 422)</div>
            <div>• Max 30GB • 1080p+ (4K OK)</div>
            <div>• 23.976/24/25/30fps • Progressive scan</div>
            <div>• 44.1kHz stereo audio</div>
          </div>
        </div>

        {/* THUMBNAIL */}
        <div className="space-y-4">
          <label className="block text-lg font-bold text-white mb-2">
            Video Thumbnail <span className="text-red-400">*</span>
          </label>
          <div className="border-2 border-dashed border-white/20 rounded-3xl p-12 text-center hover:border-emerald-400 transition-colors relative">
            <input
              type="file"
              accept={thumbnailRequirements.formats.join(',')}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files?.[0] || null })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div>
              <Image size={64} className="mx-auto mb-4 text-zinc-500" />
              <div className="text-lg font-bold text-white">{formData.thumbnail?.name || 'Choose Thumbnail'}</div>
              <div className="text-sm text-zinc-500 mt-2">{formatFileSize(formData.thumbnail?.size)}</div>
            </div>
          </div>
          <div className="text-xs text-zinc-500 space-y-1">
            <div>• JPEG/PNG • 1280x720 minimum</div>
            <div>• Max 10MB • No watermarks/text</div>
          </div>
        </div>
      </div>

      {/* FORM FIELDS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 pt-16 border-t border-white/10">
        <Input
          label="Video Title *"
          placeholder="My Music Video"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        
        <Input
          label="ISRC Code *"
          placeholder="US-ABC-23-00001"
          value={formData.isrc}
          onChange={(e) => setFormData({ ...formData, isrc: e.target.value })}
        />
        
        <Input
          label="Artist Name *"
          placeholder="Your Artist Name"
          value={formData.artist}
          onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
        />

        <Select
          label="Territory Rights *"
          value={formData.territory}
          onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
          options={[
            { value: 'worldwide', label: 'Worldwide' },
            { value: 'us_canada', label: 'US/Canada' },
            { value: 'eu', label: 'European Union' }
          ]}
        />

        <Select
          label="Monetization *"
          value={formData.monetization}
          onChange={(e) => setFormData({ ...formData, monetization: e.target.value })}
          options={[
            { value: 'free', label: 'Free (Promotional)' },
            { value: 'ad_supported', label: 'Ad-Supported (Vevo)' },
            { value: 'rental', label: 'Rental ($2.99)' },
            { value: 'purchase', label: 'Purchase ($9.99)' }
          ]}
        />

        <Input
          label="Release Date"
          type="date"
          value={formData.release_date}
          onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
        />
      </div>

      <div className="mt-12 space-y-12">
        <ContentRatingField
          value={formData.content_rating}
          onChange={(rating) => setFormData({ ...formData, content_rating: rating })}
        />

        <CategoryTagsField
          tags={formData.tags}
          onChange={(tags) => setFormData({ ...formData, tags })}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Input
          label="Performers/Featured"
          placeholder="Feat. John Doe, Prod. by DJ Smith"
          value={formData.performers}
          onChange={(e) => setFormData({ ...formData, performers: e.target.value })}
        />
        <Input
          label="Composers"
          placeholder="Jane Doe, Mark Smith"
          value={formData.composers}
          onChange={(e) => setFormData({ ...formData, composers: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-3 mt-8 p-4 bg-zinc-900/30 rounded-2xl border border-white/5">
        <input
          type="checkbox"
          id="lyrics"
          checked={formData.lyrics}
          onChange={(e) => setFormData({ ...formData, lyrics: e.target.checked })}
          className="w-5 h-5 rounded border-white/10 bg-black text-emerald-500 focus:ring-emerald-500"
        />
        <label htmlFor="lyrics" className="text-sm font-medium text-zinc-300 cursor-pointer">
          Include Lyrics (Display lyrics on Vevo and other stores)
        </label>
      </div>

      {/* SUBMIT */}
      <div className="text-center mt-16">
        <Button
          onClick={handleSubmit}
          disabled={!formData.video_file || !formData.thumbnail}
          className="bg-gradient-to-r from-emerald-500 to-purple-500 text-white px-16 py-6 rounded-3xl font-black text-2xl shadow-2xl hover:shadow-black/50 transition-all disabled:opacity-50"
        >
          🚀 Submit for Distribution
        </Button>
        <div className="text-xs text-zinc-500 mt-4">
          Video will be processed and distributed to Vevo, Spotify Video, Apple Music
        </div>
      </div>
    </div>
  );
};
