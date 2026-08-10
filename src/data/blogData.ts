import { BlogPost } from '../types';

const generateArticles = (count: number, category: BlogPost['category'], prefix: string, sources: string[]): BlogPost[] => {
  const articles: BlogPost[] = [];
  const trends = [
    'Hip-Hop Marketing Evolution',
    'Urban Tech Gear 2026',
    'Multimedia in Street Culture',
    'Digital Distribution for Creators',
    'Independent Label Tech Stack',
    'Urban Media Festivals 2026',
    'Arts & Media Convergence',
    'iHeart Radio Urban Updates',
    'Cumulus Media Trends',
    'US Multimedia Landscape',
    'Short-Form Video Dominance',
    'Interactive Streaming Experiences',
    'Hyper-Personalized Marketing',
    'Web3 and the Creator Economy',
    'Augmented Reality in Advertising'
  ];

  const techGear = [
    'V12 SonicStream Pro',
    'Neural Audio Interface',
    'Holographic Display V4',
    'Urban Studio Master',
    'V12 Cinema Rig',
    'Next-Gen 8K Cameras',
    'AI-Powered Audio Interfaces',
    'Foldable Production Displays',
    'Cloud-Based Editing Suites',
    'Neural Processing Units for VFX'
  ];

  for (let i = 1; i <= count; i++) {
    const trend = trends[i % trends.length];
    const gear = techGear[i % techGear.length];
    const source = sources[i % sources.length];
    
    articles.push({
      id: `${prefix}-${i}`,
      title: i % 2 === 0 ? `${trend}: ${2026} Outlook` : `New Tech Alert: ${gear}`,
      excerpt: `Exploring the latest shifts in ${trend.toLowerCase()} and how ${gear.toLowerCase()} is changing the game for urban creators. Insights based on recent data from ${source}.`,
      content: `
        <p>The multimedia landscape is evolving rapidly in 2026. According to recent reports from ${source}, the integration of ${trend.toLowerCase()} is becoming a standard for creators aged 20-50 in urban centers across the United States.</p>
        <p>One of the most exciting developments is the release of ${gear}, which promises to streamline workflows and enhance production quality. This new technology is specifically designed to meet the demands of high-speed, high-fidelity content creation.</p>
        <p>Marketing trends are also shifting towards more authentic, community-driven narratives. As urban demographics continue to lead cultural conversations, brands are leveraging ${trend.toLowerCase()} to build deeper connections with their audiences.</p>
        <p>Stay tuned to ${prefix} for more updates on multimedia technology and marketing trends.</p>
      `,
      category: category,
      date: new Date(2026, 2, Math.max(1, 30 - (i % 30))).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase(),
      author: 'V12 EDITORIAL',
      image: `https://picsum.photos/seed/${prefix}-${i}-technology-media-production/800/450`,
      readTime: `${Math.floor(Math.random() * 5) + 3} MIN`
    });
  }
  return articles;
};

const v12NewsSources = ['AP Polls', 'ABC News', 'Google', 'CNN', 'Fox News'];
const v12MediaSources = ['iHeart Radio', 'Cumulus Media', 'AP Polls', 'ABC News', 'Google', 'CNN', 'Fox News'];

export const V12_NEWS_ARTICLES = generateArticles(50, 'V12News', 'news', v12NewsSources);
export const V12_MEDIA_ARTICLES = generateArticles(100, 'V12Media', 'media', v12MediaSources);

export const ALL_BLOG_POSTS: BlogPost[] = [
  ...V12_NEWS_ARTICLES,
  ...V12_MEDIA_ARTICLES
];
