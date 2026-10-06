export const TEMPLATES = [
  {
    id: 'modern-artist',
    name: 'Modern Artist',
    description: 'Clean, bold design for electronic and pop artists.',
    thumbnail: 'https://picsum.photos/seed/template1/400/300',
    blocks: [
      { type: 'hero', props: { title: 'Sonic Pulse', subtitle: 'The New Era of Sound', cta: 'Listen Now' } },
      { type: 'music', props: { title: 'Latest Releases' } },
      { type: 'events', props: { title: 'On Tour' } }
    ]
  },
  {
    id: 'minimal-creator',
    name: 'Minimal Creator',
    description: 'Focus on your content and products with a clean layout.',
    thumbnail: 'https://picsum.photos/seed/template2/400/300',
    blocks: [
      { type: 'hero', props: { title: 'Creative Vision', subtitle: 'Exclusive Merch & Content', cta: 'Shop Now' } },
      { type: 'store', props: { title: 'Featured Products' } },
      { type: 'text', props: { content: 'Welcome to my official space.' } }
    ]
  },
  {
    id: 'dark-vibe',
    name: 'Dark Vibe',
    description: 'Moody and atmospheric design for underground sounds.',
    thumbnail: 'https://picsum.photos/seed/template3/400/300',
    blocks: [
      { type: 'hero', props: { title: 'Shadow Beats', subtitle: 'Underground Experience', cta: 'Enter' } },
      { type: 'gallery', props: { title: 'Visuals' } },
      { type: 'music', props: { title: 'The Vault' } }
    ]
  },
  // ... Imagine 47 more templates here ...
  ...Array.from({ length: 47 }).map((_, i) => ({
    id: `template-${i + 4}`,
    name: `V12 Style ${i + 4}`,
    description: `Professional V12 template for ${['R&B', 'Rock', 'Jazz', 'Lo-Fi', 'Techno'][i % 5]} creators.`,
    thumbnail: `https://picsum.photos/seed/template${i + 4}/400/300`,
    blocks: [
      { type: 'hero', props: { title: 'New Release', subtitle: 'Available Everywhere', cta: 'Stream' } },
      { type: 'music', props: { title: 'Discography' } }
    ]
  }))
];
