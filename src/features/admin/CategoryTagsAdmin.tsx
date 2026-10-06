import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import { Input, Select } from '../../components/ui/Form';
import { cn } from '../../utils/cn';

export interface CategoryTag {
  id: string;
  value: string;
  label: string;
  category: 'genre' | 'video_type' | 'mood' | 'content';
  popular: boolean;
  usage_count: number;
  active: boolean;
  platforms: string[];
  created_at: string;
}

export const CategoryTagsAdmin = () => {
  const [tags, setTags] = useState<CategoryTag[]>([]);
  const [filters, setFilters] = useState({ category: 'all', popular: 'all' });
  const [search, setSearch] = useState('');

  const loadTags = async () => {
    try {
      const response = await fetch('/api/admin/tags');
      const data = await response.json();
      setTags(data);
    } catch (err) {
      console.error('Failed to load tags', err);
    }
  };

  const saveTag = async (tag: Partial<CategoryTag>) => {
    const method = tag.id ? 'PUT' : 'POST';
    try {
      await fetch(`/api/admin/tags${tag.id ? `/${tag.id}` : ''}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag)
      });
      loadTags();
    } catch (err) {
      console.error('Failed to save tag', err);
    }
  };

  const deleteTag = async (id: string) => {
    if (confirm('Delete this tag?')) {
      try {
        await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' });
        loadTags();
      } catch (err) {
        console.error('Failed to delete tag', err);
      }
    }
  };

  useEffect(() => { loadTags(); }, []);

  const filteredTags = tags.filter(tag => {
    if (filters.category !== 'all' && tag.category !== filters.category) return false;
    if (filters.popular !== 'all' && tag.popular !== (filters.popular === 'true')) return false;
    if (search && !tag.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-zinc-900/50 p-6 rounded-3xl border border-white/10 items-end">
        <Select
          label="Filter by Category"
          value={filters.category}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, category: e.target.value })}
          options={[
            { value: 'all', label: 'All Categories' },
            { value: 'genre', label: 'Genres' },
            { value: 'video_type', label: 'Video Types' },
            { value: 'mood', label: 'Moods' },
            { value: 'content', label: 'Content' }
          ]}
          containerClassName="w-48"
        />
        <Select
          label="Popularity"
          value={filters.popular}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, popular: e.target.value })}
          options={[
            { value: 'all', label: 'All' },
            { value: 'true', label: 'Popular' },
            { value: 'false', label: 'Standard' }
          ]}
          containerClassName="w-48"
        />
        <Input
          placeholder="Search tags..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          containerClassName="flex-1"
        />
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center justify-between p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
        <div className="flex gap-4">
          <Button variant="outline" size="sm">Enable Selected</Button>
          <Button variant="outline" size="sm">Disable Selected</Button>
          <Button variant="destructive" size="sm">Delete Selected</Button>
        </div>
        <Button className="bg-gradient-to-r from-emerald-500 to-purple-500">
          + New Tag Category
        </Button>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTags.map(tag => (
          <TagCard
            key={tag.id}
            tag={tag}
            onToggleActive={(active: boolean) => saveTag({ ...tag, active })}
            onDelete={() => deleteTag(tag.id)}
          />
        ))}
      </div>
    </div>
  );
};

const TagCard = ({ tag, onToggleActive, onDelete }: any) => (
  <div className="group bg-zinc-900/50 border border-white/10 hover:border-emerald-400/50 rounded-3xl p-6 h-full transition-all hover:shadow-2xl hover:shadow-emerald-500/20">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold",
          tag.popular 
            ? 'bg-zinc-700 text-white' 
            : 'bg-zinc-700 text-zinc-400'
        )}>
          {tag.popular ? 'POPULAR' : 'STANDARD'}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{tag.category}</div>
      </div>
      <Switch
        checked={tag.active}
        onCheckedChange={onToggleActive}
      />
    </div>
    
    <h3 className="font-bold text-lg mb-2 leading-tight text-white">{tag.label}</h3>
    <div className="flex items-center gap-2 mb-6">
      <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
        {tag.usage_count}
      </div>
      <span className="text-xs text-zinc-500">videos using this tag</span>
    </div>
    
    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
      <Button variant="ghost" size="sm" className="flex-1">Edit</Button>
      <Button variant="destructive" size="sm" onClick={onDelete}>Delete</Button>
    </div>
  </div>
);
