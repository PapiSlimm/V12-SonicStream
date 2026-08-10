import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { auth, db } from '../../firebase';
import { useSearchParams } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { cn } from '../../utils/cn';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 'signin' (default) or 'signup' - which tab the modal opens on */
  initialMode?: 'signin' | 'signup';
}

export const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', userType: 'listener' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          email: formData.email,
          name: formData.name,
          userType: formData.userType,
          isPro: false,
          balance: 0,
          emailVerified: false,
          referralCode: referralCode || null,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err.message || 'Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20} /></button>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Join SonicStream'}</h3>
            <p className="text-zinc-500 text-sm">{isLogin ? 'Access your distribution hub' : 'Start distributing your music globally'}</p>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-zinc-500 font-bold">Or continue with email</span></div>
          </div>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl text-center">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">I am a...</label>
                  <div className="flex gap-4 p-1 bg-black border border-white/10 rounded-xl">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, userType: 'creator' as any})}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                        formData.userType === 'creator' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      Creator
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, userType: 'artist' as any})}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                        formData.userType === 'artist' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      Artist
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, userType: 'listener' as any})}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                        formData.userType === 'listener' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      Organizer
                    </button>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Password</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" 
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-zinc-600 transition-all shadow-lg shadow-black/20 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
          <div className="text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
