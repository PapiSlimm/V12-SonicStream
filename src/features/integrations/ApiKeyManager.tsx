import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Shield, ExternalLink, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  service_name: string;
  created_at: string;
}

export const ApiKeyManager: React.FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState('');
  const [newKey, setNewKey] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const data = await api.integrations.getApiKeys();
      setKeys(data);
    } catch (err) {
      console.error('Failed to fetch API keys', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService || !newKey) return;

    try {
      await api.integrations.createApiKey(newService, newKey);
      toast.success('API key added successfully');
      setNewService('');
      setNewKey('');
      setIsAdding(false);
      fetchKeys();
    } catch {
      toast.error('Failed to add API key');
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      await api.integrations.deleteApiKey(id);
      toast.success('API key deleted');
      fetchKeys();
    } catch {
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">API Key Management</h2>
          <p className="text-zinc-500 text-sm">Securely manage your external service integrations</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-3 bg-zinc-700 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-600 transition-all"
        >
          <Plus size={20} />
          Generate New Key
        </button>
      </div>

      <div className="grid gap-6">
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 bg-zinc-900 border border-emerald-500/30 rounded-3xl shadow-2xl shadow-emerald-500/10"
            >
              <form onSubmit={handleAddKey} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Service Name</label>
                    <select 
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
                      required
                    >
                      <option value="">Select Service</option>
                      <option value="Ditto Music">Ditto Music</option>
                      <option value="Custom">Custom Integration</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">API Key / Secret</label>
                    <input 
                      type="password"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-zinc-700 text-white rounded-xl font-bold hover:bg-zinc-600 transition-all"
                  >
                    Save Integration
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500">Loading your integrations...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 bg-zinc-900/50 border border-white/5 rounded-3xl text-center space-y-4">
            <Key size={48} className="mx-auto text-zinc-800" />
            <p className="text-zinc-500">No active API integrations found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {keys.map((key) => (
              <div 
                key={key.id}
                className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/5">
                    <Shield size={24} className="text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{key.service_name}</h4>
                    <p className="text-xs text-zinc-500">Added on {new Date(key.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => copyToClipboard('••••••••••••', key.id)}
                    className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
                    title="Copy Key"
                  >
                    {copiedId === key.id ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDeleteKey(key.id)}
                    className="p-3 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all text-red-500"
                    title="Delete Integration"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-start gap-6">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
          <ExternalLink size={24} className="text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold">Need help with integrations?</h4>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Integrating your external catalog managers allows SonicStream to automatically sync your releases, metadata, and royalty statements. 
            Check our <button className="text-emerald-400 hover:underline">Integration Guide</button> for step-by-step instructions.
          </p>
        </div>
      </div>
    </div>
  );
};
