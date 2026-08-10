import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import { Input, Select } from '../../components/ui/Form';

export interface ContentRating {
  id: string;
  code: string;
  label: string;
  description: string;
  color: string;
  age_gate: number;
  active: boolean;
  usage_count: number;
  platforms: string[];
  created_at: string;
}

export const ContentRatingsAdmin = () => {
  const [ratings, setRatings] = useState<ContentRating[]>([]);
  const [formData, setFormData] = useState<Partial<ContentRating>>({
    code: '',
    label: '',
    color: 'emerald',
    description: ''
  });

  const loadRatings = async () => {
    try {
      const response = await fetch('/api/admin/ratings');
      const data = await response.json();
      setRatings(data);
    } catch (err) {
      console.error('Failed to load ratings', err);
    }
  };

  const saveRating = async (rating: Partial<ContentRating>) => {
    const method = rating.id ? 'PUT' : 'POST';
    try {
      await fetch(`/api/admin/ratings${rating.id ? `/${rating.id}` : ''}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rating)
      });
      loadRatings();
    } catch (err) {
      console.error('Failed to save rating', err);
    }
  };

  const deleteRating = async (id: string) => {
    if (confirm('Delete this rating? Videos using it will lose the rating.')) {
      try {
        await fetch(`/api/admin/ratings/${id}`, { method: 'DELETE' });
        loadRatings();
      } catch (err) {
        console.error('Failed to delete rating', err);
      }
    }
  };

  useEffect(() => { loadRatings(); }, []);

  return (
    <div className="space-y-8">
      {/* Table */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900/50">
              <th className="p-6 font-bold text-zinc-200">Rating</th>
              <th className="p-6 font-bold text-zinc-200">Label</th>
              <th className="p-6 font-bold text-zinc-200">Usage</th>
              <th className="p-6 font-bold text-zinc-200">Platforms</th>
              <th className="p-6 text-right font-bold text-zinc-200">Status</th>
              <th className="p-6 text-right font-bold text-zinc-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ratings.map(rating => (
              <tr key={rating.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm bg-${rating.color}-400 text-black shadow-lg`}>
                    {rating.code}
                  </div>
                </td>
                <td className="p-6">
                  <div className="font-bold">{rating.label}</div>
                  <div className="text-xs text-zinc-500">{rating.description}</div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {rating.usage_count}
                    </div>
                    <span className="text-xs text-zinc-400">videos</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-wrap gap-1">
                    {rating.platforms?.map(p => (
                      <span key={p} className="px-2 py-0.5 bg-zinc-800 text-[10px] rounded-full text-zinc-400 border border-white/5">{p}</span>
                    ))}
                  </div>
                </td>
                <td className="p-6 text-right">
                  <Switch
                    checked={rating.active}
                    onCheckedChange={(checked: boolean) => saveRating({ ...rating, active: checked })}
                  />
                </td>
                <td className="p-6 text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteRating(rating.id)}
                    disabled={rating.usage_count > 0}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Add Form */}
      <div className="p-8 bg-zinc-900/50 border border-white/10 rounded-3xl">
        <h3 className="text-2xl font-bold mb-6">Add New Rating</h3>
        <div className="grid md:grid-cols-4 gap-6">
          <Input
            label="Code"
            placeholder="PG"
            value={formData.code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value })}
          />
          <Input
            label="Label"
            placeholder="PG - Parental Guidance"
            value={formData.label}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, label: e.target.value })}
          />
          <Select
            label="Color"
            value={formData.color}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, color: e.target.value })}
            options={[
              { value: 'emerald', label: 'Green' },
              { value: 'yellow', label: 'Yellow' },
              { value: 'orange', label: 'Orange' },
              { value: 'red', label: 'Red' },
              { value: 'rose', label: 'Rose' }
            ]}
          />
          <div className="flex items-end">
            <Button
              onClick={() => {
                saveRating({ 
                  ...formData, 
                  age_gate: 13, 
                  active: true, 
                  usage_count: 0, 
                  platforms: ['vevo'] 
                });
                setFormData({ code: '', label: '', color: 'emerald', description: '' });
              }}
              className="w-full"
            >
              Add Rating
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
