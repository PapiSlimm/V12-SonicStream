import { apiFetch } from '../api/apiFetch';

export const generateGrowthContent = async (type: 'tiktok' | 'reels' | 'caption', context: string) => {
  try {
    const data = await apiFetch<any>('/api/ai/growth-content', {
      method: 'POST',
      body: JSON.stringify({ type, context })
    });
    return data.content || '';
  } catch (err) {
    console.error('Error generating growth content:', err);
    return 'Failed to generate content: Please try again.';
  }
};

export const getSmartReleaseTiming = (genre: string) => {
  // Logic based on industry standards
  const timings = {
    'Electronic': 'Friday 00:00 EST (Global Release Day)',
    'Hip-Hop': 'Thursday 23:00 EST (Pre-release hype)',
    'Pop': 'Friday 00:00 EST',
    'Lo-Fi': 'Sunday 18:00 EST (Chill vibes for the week ahead)'
  };
  return timings[genre as keyof typeof timings] || 'Friday 00:00 EST';
};

export const autoPostToSocial = async (platform: 'twitter' | 'instagram' | 'facebook' | 'tiktok', content: string) => {
  // In a real app, this would use OAuth and social media APIs
  console.log(`Auto-posting to ${platform}: ${content}`);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, platform, timestamp: new Date().toISOString() };
};
