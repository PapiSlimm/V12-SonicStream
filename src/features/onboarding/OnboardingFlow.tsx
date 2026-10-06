import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignUpStep } from './SignUpStep';
import { VerifyEmailStep } from './VerifyEmailStep';
import { UserTypeStep } from './UserTypeStep';
import { ProfileSetupStep } from './ProfileSetupStep';
import { SuccessStep } from './SuccessStep';

interface OnboardingFlowProps {
  onFinish: () => void;
}

export const OnboardingFlow = ({ onFinish }: OnboardingFlowProps) => {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<any>({});

  const steps = [
    { id: 1, component: <SignUpStep onSuccess={(data) => { setUserData({...userData, ...data}); setStep(2); }} /> },
    { id: 2, component: <VerifyEmailStep email={userData.email} onSuccess={() => setStep(3)} /> },
    { id: 3, component: <UserTypeStep onSuccess={(type) => { setUserData({...userData, type}); setStep(4); }} /> },
    { id: 4, component: <ProfileSetupStep userData={userData} onSuccess={() => setStep(5)} /> },
    { id: 5, component: <SuccessStep onFinish={onFinish} /> }
  ];

  return (
    <div className="min-h-screen bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />

      <div className="w-full max-w-3xl relative z-10">
        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-4 mb-16">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500 border-2 ${
                s === step 
                  ? 'bg-zinc-700 text-white border-emerald-500 shadow-2xl shadow-black/50 scale-110' 
                  : s < step
                    ? 'bg-zinc-700/20 text-emerald-500 border-emerald-500/30'
                    : 'bg-zinc-900/50 text-zinc-600 border-white/5'
              }`}>
                {s}
              </div>
              {s < 5 && (
                <div className={`w-8 h-0.5 mx-2 rounded-full transition-all duration-500 ${
                  s < step ? 'bg-emerald-500/50' : 'bg-white/5'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Current Step Container */}
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-[48px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {steps[step - 1]?.component}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-sm">
            Step {step} of 5 • Secure Onboarding • V12 SonicStream
          </p>
        </div>
      </div>
    </div>
  );
};
