import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface VerifyEmailStepProps {
  email: string;
  onSuccess: () => void;
}

export const VerifyEmailStep = ({ email, onSuccess }: VerifyEmailStepProps) => {
  const [status, setStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
  const [token, setToken] = useState('');

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email })
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(onSuccess, 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="text-center space-y-8 py-8">
      {status === 'pending' || status === 'loading' || status === 'error' ? (
        <>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white">Check your inbox</h2>
            <p className="text-zinc-400 max-w-sm mx-auto">
              We've sent a verification code to <span className="text-emerald-400 font-bold">{email}</span>. Please enter it below.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6 max-w-xs mx-auto">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl px-5 py-4 text-center text-2xl font-black tracking-[0.5em] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="000000"
              maxLength={6}
            />

            {status === 'error' && (
              <p className="text-red-400 text-sm font-medium">Invalid or expired code. Please try again.</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || token.length < 6}
              className="w-full bg-zinc-700 text-white font-black py-4 rounded-2xl text-lg shadow-xl hover:bg-zinc-600 transition-all disabled:opacity-50"
            >
              {status === 'loading' ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <p className="text-sm text-zinc-500">
            Didn't receive the email? <button className="text-emerald-400 font-bold hover:underline">Resend code</button>
          </p>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto border-4 border-emerald-500/50">
            <Check className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-emerald-400">Email Verified!</h2>
            <p className="text-zinc-400">Redirecting you to the next step...</p>
          </div>
        </div>
      )}
    </div>
  );
};
