import { useState } from 'react';
import { Mail, Lock, Github, Chrome } from 'lucide-react';

interface SignUpStepProps {
  onSuccess: (data: any) => void;
}

export const SignUpStep = ({ onSuccess }: SignUpStepProps) => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain 1 uppercase letter');
      return false;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain 1 number');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!acceptedTerms) {
      setError('You must explicitly accept the Terms of Service & Privacy Policy');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tosAccepted: true,
          agreementVersion: "v2.4.0",
          acceptedAt: new Date().toISOString(),
          ipAddress: "127.0.0.1" // Mock standard local client ip
        })
      });

      if (res.ok) {
        // Log to local storage the agreement event for verification audit
        const agreementObj = {
          userId: formData.email,
          agreementVersion: "v2.4.0",
          acceptedAt: new Date().toISOString(),
          ipAddress: "127.0.0.1"
        };
        localStorage.setItem('user_agreements_audit', JSON.stringify(agreementObj));
        onSuccess(formData);
      } else {
        const data = await res.json();
         setError(data.error || 'Sign up failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-purple-500 bg-clip-text text-transparent">
          Join SonicStream
        </h1>
        <p className="text-zinc-400">
          Create your artist/creator account in 2 minutes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="yourname@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="Minimum 8 characters"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-300 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="Repeat your password"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
          <input
            id="accept-terms-checkbox"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 w-5 h-5 bg-zinc-800 border-white/10 rounded accent-emerald-500 text-emerald-500 focus:ring-emerald-500 cursor-pointer shrink-0"
          />
          <label htmlFor="accept-terms-checkbox" className="text-xs text-zinc-400 leading-relaxed cursor-pointer select-none">
            I explicitly accept the <a href="/terms" target="_blank" className="font-bold text-emerald-400 hover:underline" onClick={(e) => e.stopPropagation()}>Terms of Service</a>, Acceptable Use Policies, digital licensing limitations, and agree to the data collection detailed in the <a href="/privacy" target="_blank" className="font-bold text-emerald-400 hover:underline" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
          </label>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-purple-500 text-white font-black py-5 rounded-2xl text-lg shadow-xl hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-zinc-900 text-zinc-500">Or sign up with</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 rounded-2xl transition-all">
            <Chrome className="w-5 h-5 text-zinc-400" />
            <span className="font-bold">Google</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 rounded-2xl transition-all">
            <Github className="w-5 h-5 text-zinc-400" />
            <span className="font-bold">GitHub</span>
          </button>
        </div>
      </div>
    </div>
  );
};
