import React, { useState } from 'react';
import { 
  Key, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Shield, 
  Zap,
  RefreshCw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APIKey } from '../../types';
import toast from 'react-hot-toast';
import { api } from '../../api';

export const ApiKeyManagement: React.FC = () => {
  const [keys, setKeys] = useState<APIKey[]>([
    { 
      id: '1', 
      name: 'Global Distribution Sync', 
      hashedKey: '$2b$12$ExampleHashedKeyRepresentationForSecurity', 
      lastFour: '8j92', 
      key: 'sk_live_51N...8j92', 
      createdAt: '2024-01-15T10:00:00Z', 
      lastUsed: '2024-03-08T15:30:00Z', 
      status: 'active' 
    }
  ]);
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateKey = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const actualKey = `sk_live_${Math.random().toString(36).substr(2, 24)}`;
      const newKey: APIKey = {
        id: Math.random().toString(36).substr(2, 9),
        name: `New Integration ${keys.length + 1}`,
        hashedKey: `$2b$12$${Math.random().toString(36).substr(2, 12)}`,
        lastFour: actualKey.slice(-4),
        key: actualKey,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      setKeys([newKey, ...keys]);
      setIsGenerating(false);
      toast.success('New API key generated');
    }, 1000);
  };

  const revokeKey = async (id: string) => {
    try {
      await api.integrations.deleteApiKey(id);
      setKeys(keys.filter(k => k.id !== id));
      toast.success('API key revoked');
    } catch {
      toast.error('Failed to revoke key');
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Key copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <Shield size={12} />
            Developer Access
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tight">API Key Management</h2>
          <p className="text-zinc-400 max-w-2xl">
            Generate and manage API keys for your own custom tools. Keep these keys secure.
          </p>
        </div>
        <button 
          onClick={generateKey}
          disabled={isGenerating}
          className="px-8 py-4 bg-zinc-700 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-zinc-600 transition-all shadow-xl shadow-black/20"
        >
          {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
          Generate New Key
        </button>
      </header>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {keys.map((key) => (
              <motion.div 
                key={key.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-8 bg-zinc-900/50 border border-white/5 rounded-[32px] space-y-6 group hover:border-white/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500">
                      <Key size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{key.name}</h3>
                      <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">Created {new Date(key.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Active
                    </div>
                    <button 
                      onClick={() => revokeKey(key.id)}
                      className="p-3 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Revoke Key"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                 <div className="flex items-center gap-4 bg-black/40 rounded-2xl p-4 border border-white/5">
                  <div className="flex-1 font-mono text-sm text-zinc-400 truncate">
                    {showKeyId === key.id ? (key.key || `sk_live_••••••••••••••••••••${key.lastFour}`) : '••••••••••••••••••••••••••••••••'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowKeyId(showKeyId === key.id ? null : key.id)}
                      className="p-2 text-zinc-500 hover:text-white transition-colors"
                    >
                      {showKeyId === key.id ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(key.key || `sk_live_••••••••••••••••••••${key.lastFour}`, key.id)}
                      className="p-2 text-zinc-500 hover:text-white transition-colors relative"
                    >
                      {copiedId === key.id ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  <div className="flex items-center gap-2">
                    <Zap size={12} className="text-purple-500" />
                    Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : 'Never'}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Full Access
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {keys.length === 0 && (
            <div className="p-24 text-center space-y-6 bg-zinc-900/20 border border-dashed border-white/10 rounded-[40px]">
              <Key size={64} className="mx-auto text-zinc-800" />
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tight">No API Keys</h3>
                <p className="text-zinc-500 text-sm">Generate your first API key to start integrating with external platforms.</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-8 space-y-8">
            <h3 className="text-xl font-black uppercase tracking-tight">Security Best Practices</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-emerald-400">
                  <Shield size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold">Never share your keys</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">API keys grant full access to your artist data. Never commit them to version control.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-purple-400">
                  <RefreshCw size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold">Rotate keys regularly</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">For maximum security, revoke and regenerate your keys every 90 days.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-blue-400">
                  <ExternalLink size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold">Use environment variables</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">Store keys in .env files or secure vault systems in your production environment.</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20 flex gap-4">
              <Info className="text-emerald-400 shrink-0" size={20} />
              <p className="text-[10px] text-emerald-400/80 leading-relaxed">
                Need help with integrations? Check out our <span className="underline cursor-pointer">Developer Documentation</span> for more info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
