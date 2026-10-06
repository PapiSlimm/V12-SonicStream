import { useState } from 'react';

export const useArtistBackground = (artistId: string | number, subscription: 'free' | 'premium') => {
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAIBackground = async (artistName: string) => {
    if (subscription !== 'premium') return '/default-concert.jpg';
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-background', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          artistId,
          prompt: `Professional live concert background featuring ${artistName} performing R&B/Hip-Hop, vibrant stage lighting, excited crowd, soundwaves, dynamic energy, 4K cinematic`
        })
      });
      
      const data = await response.json();
      if (data.imageUrl) {
        setBackgroundUrl(data.imageUrl);
        return data.imageUrl;
      }
    } catch (error) {
      console.error('AI Background generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
    return null;
  };

  return { backgroundUrl, generateAIBackground, isGenerating };
};
