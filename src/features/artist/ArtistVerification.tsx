import React, { useState } from 'react';
import { Shield, Upload, CheckCircle2, AlertCircle, Instagram, Facebook, Globe, Twitter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { toast } from '../../components/ui/Toast';

export const ArtistVerification = () => {
  const { user, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [socialLinks, setSocialLinks] = useState({
    instagram: user?.socialLinks?.instagram || '',
    twitter: user?.socialLinks?.twitter || '',
    facebook: user?.socialLinks?.facebook || '',
    tiktok: user?.socialLinks?.tiktok || ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile && user?.verificationStatus === 'unverified') {
      toast.error('Please upload a valid ID for verification');
      return;
    }

    setIsUploading(true);
    try {
      // In a real app, we'd upload the file to storage first
      // For this demo, we'll simulate the upload and update the user doc
      const idImageUrl = idFile ? URL.createObjectURL(idFile) : user?.idImageUrl;
      
      await api.verification.submit({
        idImageUrl: idImageUrl,
        socialLinks: {
          instagram: socialLinks.instagram,
          twitter: socialLinks.twitter,
          facebook: socialLinks.facebook
        }
      });

      toast.success('Verification request submitted successfully!');
      await refreshUser();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit verification request');
    } finally {
      setIsUploading(false);
    }
  };

  if (user?.verificationStatus === 'verified') {
    return (
      <div className="p-12 text-center space-y-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[40px]">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
          <CheckCircle2 size={40} className="text-black" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight">Verified Artist</h2>
          <p className="text-zinc-400">Your account is fully verified. You have full access to distribution and monetization.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest">
          <Shield size={12} />
          Artist Protection
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tight">Artist Verification</h1>
        <p className="text-zinc-400 max-w-2xl">
          To protect your copyright and ensure platform integrity, we require all artists to verify their identity. This process helps us prevent unauthorized uploads and secure your royalties.
        </p>
      </header>

      {user?.verificationStatus === 'pending' && (
        <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-4">
          <AlertCircle className="text-blue-400" size={24} />
          <p className="text-sm font-bold text-blue-400">Your verification request is currently under review. This usually takes 24-48 hours.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Upload className="text-emerald-500" size={20} />
              Identity Verification
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">Upload a clear photo of your government-issued ID (Passport, Driver's License, or National ID).</p>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="p-12 border-2 border-dashed border-white/10 rounded-3xl text-center group-hover:border-emerald-500/50 transition-all bg-zinc-900/30">
                  {idFile ? (
                    <div className="space-y-2">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                      <p className="text-sm font-bold">{idFile.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={32} className="mx-auto text-zinc-700" />
                      <p className="text-sm font-bold">Click or drag to upload ID</p>
                      <p className="text-[10px] text-zinc-600 uppercase font-black">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Globe className="text-emerald-500" size={20} />
              Social Media Links
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Instagram size={12} /> Instagram
                </label>
                <input 
                  type="text"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                  placeholder="@yourhandle"
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Twitter size={12} /> Twitter / X
                </label>
                <input 
                  type="text"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                  placeholder="@yourhandle"
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Facebook size={12} /> Facebook
                </label>
                <input 
                  type="text"
                  value={socialLinks.facebook}
                  onChange={(e) => setSocialLinks({...socialLinks, facebook: e.target.value})}
                  placeholder="facebook.com/yourpage"
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[32px] space-y-6">
            <h3 className="text-xl font-bold">Why verify?</h3>
            <ul className="space-y-4">
              {[
                { title: 'Copyright Protection', desc: 'Ensure your music is protected and only you can claim royalties.' },
                { title: 'Priority Distribution', desc: 'Get your music on DSPs faster with our verified artist status.' },
                { title: 'Monetization', desc: 'Unlock full access to earnings, payouts, and direct sales.' },
                { title: 'Trust Badge', desc: 'Get a verification checkmark on your public profile.' }
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <button 
            type="submit"
            disabled={isUploading || user?.verificationStatus === 'pending'}
            className="w-full py-4 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/20"
          >
            {isUploading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </div>
      </form>
    </div>
  );
};
