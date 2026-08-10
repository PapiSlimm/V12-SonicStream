import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Chrome, ArrowRight, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-v12-gray-900 flex items-center justify-center p-6 relative overflow-hidden">
      <Helmet>
        <title>{isLogin ? 'Login' : 'Sign Up'} | V12 SonicStream</title>
      </Helmet>
      
      <div className="absolute inset-0 grid-bg opacity-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="border-4 border-v12-red bg-black p-8 shadow-[12px_12px_0px_0px_rgba(239,68,68,0.3)]">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-v12-red flex items-center justify-center font-black italic">V12</div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Authentication_Required</h1>
          </div>

          {error && (
            <div className="bg-v12-red/20 border border-v12-red p-4 mb-6 text-v12-red text-xs font-bold uppercase tracking-widest">
              Error: {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-v12-gray-400 mb-2">Email_Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-v12-gray-800 border-2 border-white/10 p-4 text-white outline-none focus:border-v12-red transition-colors"
                placeholder="USER@V12.ENGINE"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-v12-gray-400 mb-2">Access_Key</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-v12-gray-800 border-2 border-white/10 p-4 text-white outline-none focus:border-v12-red transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-v12-red text-white py-4 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:text-v12-red transition-all group"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {isLogin ? 'Initialize Login' : 'Register Engine'}
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full border-2 border-white/10 py-4 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
            >
              <Chrome size={18} />
              Continue with Google
            </button>

            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400 hover:text-v12-red transition-colors text-center"
            >
              {isLogin ? "Don't have an account? Register here" : "Already registered? Login here"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
