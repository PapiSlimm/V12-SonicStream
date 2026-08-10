import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export const AgeGate = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('sonic_age_verified');
    if (!verified) {
      setIsOpen(true);
    }
  }, []);

  const handleVerify = () => {
    const year = parseInt(birthYear);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (isNaN(year) || year < 1900 || year > currentYear) {
      setError('Please enter a valid birth year.');
      return;
    }

    if (age < 13) {
      setError('You must be at least 13 years old to use SonicStream.');
      return;
    }

    localStorage.setItem('sonic_age_verified', 'true');
    setIsVerified(true);
    setTimeout(() => setIsOpen(false), 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="max-w-md w-full bg-zinc-900 border border-white/10 p-10 rounded-[40px] shadow-2xl space-y-8 text-center"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto">
              {isVerified ? (
                <CheckCircle2 className="text-emerald-400" size={40} />
              ) : (
                <ShieldAlert className="text-emerald-400" size={40} />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter">Age Verification</h2>
              <p className="text-zinc-500 text-sm">SonicStream requires all users to be at least 13 years of age. Please enter your birth year to continue.</p>
            </div>

            {!isVerified ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <input 
                    type="number" 
                    placeholder="YYYY"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className={cn(
                      "w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-widest focus:border-emerald-500 outline-none transition-all",
                      error && "border-red-500/50"
                    )}
                  />
                  {error && (
                    <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold">
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleVerify}
                  className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-black/20 transition-all"
                >
                  Verify Age
                </button>

                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 text-emerald-400 font-black text-xl"
              >
                Access Granted
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
