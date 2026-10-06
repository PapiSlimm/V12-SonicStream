import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/apiFetch';
import { Sparkles, Download, RefreshCw, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export const BrandIdentity: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLogo = async () => {
    setIsGenerating(true);
    try {
      const data = await apiFetch<any>('/api/ai/generate-image', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'A high impact, professional logo for "V12 SonicStream". The design should be modern, sleek, and high-tech. Incorporate a unique, non-literal geometric symbol that represents speed, sound waves, and premium quality. Use a color palette of emerald green, deep purple, and metallic silver on a dark background. The geometric symbol should be distinct and memorable, creating a strong brand identity.',
          aspectRatio: "1:1"
        })
      });

      if (data.imageUrl) {
        setLogoUrl(data.imageUrl);
        toast.success('V12 SonicStream Logo Generated!');
      } else {
        throw new Error('Image URL not received');
      }
    } catch (error) {
      console.error('Error generating logo:', error);
      toast.error('Failed to generate logo. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Generate initial logo if none exists
    if (!logoUrl) {
      generateLogo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-12 space-y-12">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
          <Sparkles size={12} />
          Brand Identity Engine
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tight">V12 SonicStream Assets</h1>
        <p className="text-zinc-400">AI-generated brand assets and geometric symbols for the next generation of streaming.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="aspect-square bg-zinc-900 rounded-[3rem] overflow-hidden border border-white/10 relative group shadow-2xl flex items-center justify-center">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="V12 SonicStream Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-zinc-700 animate-pulse">
              <Shield size={120} />
            </div>
          )}
          
          {isGenerating && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="animate-spin text-emerald-400" size={48} />
              <p className="text-emerald-400 font-black uppercase tracking-widest text-xs">Generating V12 Assets...</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-black uppercase tracking-tight">Geometric Identity</h2>
            <p className="text-zinc-400 leading-relaxed">
              The V12 SonicStream symbol is a non-literal geometric representation of sonic velocity. It combines sharp, aggressive angles with fluid curves to signify the intersection of high-performance technology and organic sound.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Primary Color</div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500" />
                <span className="font-mono text-xs text-white">#10B981</span>
              </div>
            </div>
            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-400">Accent Color</div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500" />
                <span className="font-mono text-xs text-white">#A855F7</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={generateLogo} 
              disabled={isGenerating}
              className="flex-1 bg-white text-white hover:bg-zinc-700 transition-all"
            >
              <RefreshCw className={isGenerating ? 'animate-spin' : ''} size={18} />
              Regenerate Logo
            </Button>
            <Button 
              disabled={!logoUrl}
              className="bg-zinc-800 text-white hover:bg-zinc-700"
              onClick={() => {
                if (logoUrl) {
                  const link = document.createElement('a');
                  link.href = logoUrl;
                  link.download = 'v12-sonicstream-logo.png';
                  link.click();
                }
              }}
            >
              <Download size={18} />
            </Button>
          </div>
        </div>
      </div>

      <section className="p-12 bg-zinc-900/50 border border-white/5 rounded-[3rem] space-y-8">
        <h3 className="text-2xl font-black uppercase tracking-tight">Brand Guidelines</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h4 className="font-bold text-white">The Symbol</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Never rotate or distort the geometric symbol. It must always maintain its 12-degree inclination to signify forward momentum.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white">Typography</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Use "Inter" for all UI elements and "Space Grotesk" for high-impact display headings.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white">Spacing</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Maintain a minimum clear space equal to 20% of the logo's width around all brand assets.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
