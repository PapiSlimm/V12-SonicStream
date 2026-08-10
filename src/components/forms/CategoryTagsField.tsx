import { useState } from 'react';
import { cn } from '../../utils/cn';

interface CategoryTag {
  value: string;
  label: string;
  category: 'genre' | 'video_type' | 'mood' | 'content';
  popular: boolean;
}

const VIDEO_CATEGORY_SUGGESTIONS: CategoryTag[] = [
  // Genres
  { value: 'hip_hop', label: 'Hip-Hop/Rap', category: 'genre', popular: true },
  { value: 'pop', label: 'Pop', category: 'genre', popular: true },
  { value: 'rock', label: 'Rock', category: 'genre', popular: true },
  { value: 'electronic', label: 'Electronic/Dance', category: 'genre', popular: true },
  
  // Video Types
  { value: 'official_music_video', label: 'Official Music Video', category: 'video_type', popular: true },
  { value: 'lyric_video', label: 'Lyric Video', category: 'video_type', popular: true },
  { value: 'live_performance', label: 'Live Performance', category: 'video_type', popular: true },
  { value: 'performance_video', label: 'Performance Video', category: 'video_type', popular: true },
  
  // Moods
  { value: 'upbeat', label: 'Upbeat/Energetic', category: 'mood', popular: true },
  { value: 'emotional', label: 'Emotional/Heartfelt', category: 'mood', popular: true },
  { value: 'cinematic', label: 'Cinematic/Dramatic', category: 'mood', popular: false },
  
  // Content
  { value: '4k', label: '4K Video', category: 'content', popular: false },
  { value: 'live', label: 'Live Recording', category: 'content', popular: true },
  { value: 'remix', label: 'Remix/Official Remix', category: 'content', popular: true }
];

interface CategoryTagsFieldProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export const CategoryTagsField = ({ tags, onChange, maxTags = 12 }: CategoryTagsFieldProps) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tagValue: string) => {
    if (tags.length >= maxTags || tags.includes(tagValue)) return;
    onChange([...tags, tagValue]);
  };

  const removeTag = (tagValue: string) => {
    onChange(tags.filter(t => t !== tagValue));
  };

  const filteredSuggestions = VIDEO_CATEGORY_SUGGESTIONS.filter(suggestion => 
    !tags.includes(suggestion.value) && 
    suggestion.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold uppercase tracking-wider text-zinc-300">
        Categories & Tags <span className="text-red-400">*</span>
        <span className="text-zinc-500 ml-2">(Max {maxTags})</span>
      </label>

      {/* Active Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map(tag => {
          const suggestion = VIDEO_CATEGORY_SUGGESTIONS.find(s => s.value === tag);
          return (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-zinc-700 to-zinc-600 text-white text-sm rounded-full font-medium hover:from-zinc-600 group cursor-pointer"
            >
              {suggestion?.label || tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/20 group-hover:bg-white text-white opacity-75 hover:opacity-100 transition-all"
              >
                ×
              </button>
            </span>
          );
        })}
        {tags.length === 0 && (
          <span className="text-zinc-500 text-sm px-4 py-2 bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-700">
            Add tags for better discoverability...
          </span>
        )}
      </div>

      {/* Tag Input + Suggestions */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) {
                e.preventDefault();
                addTag(inputValue.trim().toLowerCase().replace(/\s+/g, '_'));
                setInputValue('');
              }
            }}
            placeholder="Type to search or create tags..."
            className="flex-1 bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 focus:outline-none placeholder-zinc-500 text-white"
            maxLength={30}
          />
          <button
            type="button"
            onClick={() => {
              if (inputValue.trim()) {
                addTag(inputValue.trim().toLowerCase().replace(/\s+/g, '_'));
                setInputValue('');
              }
            }}
            className="px-6 py-4 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-2xl transition-all whitespace-nowrap"
          >
            Add Tag
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {inputValue && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto z-50">
            {filteredSuggestions.map(suggestion => (
              <button
                key={suggestion.value}
                type="button"
                onClick={() => {
                  addTag(suggestion.value);
                  setInputValue('');
                }}
                className={cn(
                  "w-full text-left px-6 py-4 border-0 hover:bg-white/5 transition-all first:rounded-t-3xl last:rounded-b-3xl",
                  suggestion.popular && "bg-emerald-500/10 border-r-4 border-emerald-400"
                )}
              >
                <div className="font-medium text-sm text-white">{suggestion.label}</div>
                <div className="text-xs text-zinc-500">{suggestion.category}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Usage Guide */}
      <div className="text-xs text-zinc-500 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-700 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="font-bold text-emerald-400 text-xs text-white">Popular Tags</div>
          <div className="text-[10px]">official_music_video</div>
          <div className="text-[10px]">lyric_video</div>
          <div className="text-[10px]">live_performance</div>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-blue-400 text-xs text-white">Why Tags Matter</div>
          <div className="text-[10px]">Platform algorithm</div>
          <div className="text-[10px]">Search rankings</div>
          <div className="text-[10px]">Playlist inclusion</div>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-yellow-400 text-xs text-white">Best Practices</div>
          <div className="text-[10px]">3-8 tags max</div>
          <div className="text-[10px]">Primary genre first</div>
          <div className="text-[10px]">Video type always</div>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-purple-400 text-xs text-white">Examples</div>
          <div className="text-[10px]">hip_hop + live</div>
          <div className="text-[10px]">pop + lyric_video</div>
          <div className="text-[10px]">4k + official_music_video</div>
        </div>
      </div>
    </div>
  );
};
