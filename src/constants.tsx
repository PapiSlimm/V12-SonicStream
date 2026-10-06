import { Sliders, Volume2, Zap, Music } from 'lucide-react';

export const APP_NAME = "V12 SonicStream";

export const MASTERING_PROFILES = [
  { id: 'balanced', name: 'Balanced', description: 'Natural enhancement for any genre', icon: Sliders },
  { id: 'warm', name: 'Warm & Analog', description: 'Rich low-mids and vintage character', icon: Volume2 },
  { id: 'bright', name: 'Modern Bright', description: 'Crisp highs and maximum clarity', icon: Zap },
  { id: 'club', name: 'Club Ready', description: 'Powerful bass and high-energy impact', icon: Music },
];
