export interface LofiTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  energy: string;
  vibes: string;
}

export interface LofiStation {
  id: string;
  name: string;
  genre: string;
  description: string;
  listeners: number;
  image: string;
  color: string;
  is_live: boolean;
  tracks: LofiTrack[];
}

export const EXCLUSIVE_LOFI_STATIONS: LofiStation[] = [
  {
    id: 'lofi-jazz',
    name: 'Jazz Deep House Exclusive',
    genre: 'Jazz Deep House',
    description: 'A luxurious blend of velvet-smooth saxophones, warm vintage Rhodes chords, and hypnotic deep house organic beats.',
    listeners: 3240,
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop',
    color: 'from-amber-600 to-amber-950',
    is_live: true,
    tracks: [
      { id: 'jdh-1', title: 'Velvet Horizon', artist: 'SonicStream AI Jazz Lab', duration: '3:45', energy: 'Medium', vibes: 'Smooth' },
      { id: 'jdh-2', title: 'Rhodes Reflection', artist: 'SonicStream AI Jazz Lab', duration: '4:12', energy: 'Chill', vibes: 'Sophisticated' },
      { id: 'jdh-3', title: 'Subterranean Samba', artist: 'SonicStream AI Jazz Lab', duration: '3:58', energy: 'Medium', vibes: 'Groovy' },
      { id: 'jdh-4', title: 'Midnight Sax Lounge', artist: 'SonicStream AI Jazz Lab', duration: '4:30', energy: 'Low', vibes: 'Romantic' },
      { id: 'jdh-5', title: 'Warm Breeze Loft', artist: 'SonicStream AI Jazz Lab', duration: '3:32', energy: 'Chill', vibes: 'Breezy' },
      { id: 'jdh-6', title: 'Lowpass Penthouse', artist: 'SonicStream AI Jazz Lab', duration: '4:05', energy: 'Medium', vibes: 'Vibrant' },
      { id: 'jdh-7', title: 'Blue Note Groove', artist: 'SonicStream AI Jazz Lab', duration: '3:50', energy: 'Chill', vibes: 'Classic' },
      { id: 'jdh-8', title: 'Flute Fluidity', artist: 'SonicStream AI Jazz Lab', duration: '3:41', energy: 'Medium', vibes: 'Organic' },
      { id: 'jdh-9', title: 'Cozy Corner Sessions', artist: 'SonicStream AI Jazz Lab', duration: '4:15', energy: 'Low', vibes: 'Warm' },
      { id: 'jdh-10', title: 'Dusk Till Dawn', artist: 'SonicStream AI Jazz Lab', duration: '4:48', energy: 'Medium', vibes: 'Deep' },
      { id: 'jdh-11', title: 'Afterhours Velvet', artist: 'SonicStream AI Jazz Lab', duration: '3:52', energy: 'Low', vibes: 'Relaxed' },
      { id: 'jdh-12', title: 'Streetlight Soliloquy', artist: 'SonicStream AI Jazz Lab', duration: '4:02', energy: 'Low', vibes: 'Mysterious' },
      { id: 'jdh-13', title: 'Vintage Varnish', artist: 'SonicStream AI Jazz Lab', duration: '3:37', energy: 'Medium', vibes: 'Dusty' },
      { id: 'jdh-14', title: 'Wandering Double Bass', artist: 'SonicStream AI Jazz Lab', duration: '4:24', energy: 'Low', vibes: 'Acoustic' },
      { id: 'jdh-15', title: 'Sonic Streamliner', artist: 'SonicStream AI Jazz Lab', duration: '3:59', energy: 'Medium', vibes: 'Driving' }
    ]
  },
  {
    id: 'lofi-hiphop',
    name: 'Trap Soul & Hip Hop Lo-Fi',
    genre: 'Hip Hop / Trap Soul',
    description: 'Soulful vocal chops, classic MPC swing, warm analog sub-basses, and organic vinyl dust crackling softly in the background.',
    listeners: 4850,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
    color: 'from-purple-800 to-indigo-950',
    is_live: true,
    tracks: [
      { id: 'hhp-1', title: 'Vinyl Whispers', artist: 'MPC Core Collective', duration: '2:45', energy: 'Low', vibes: 'Dusty & Nostalgic' },
      { id: 'hhp-2', title: 'Subway Chills', artist: 'MPC Core Collective', duration: '3:02', energy: 'Medium', vibes: 'Urban Atmospheric' },
      { id: 'hhp-3', title: 'Bedside Soul', artist: 'MPC Core Collective', duration: '2:50', energy: 'Low', vibes: 'Intimate' },
      { id: 'hhp-4', title: 'Raindrops on Zinc', artist: 'MPC Core Collective', duration: '3:15', energy: 'Low', vibes: 'Cozy Rainy' },
      { id: 'hhp-5', title: '808 Heartbeats', artist: 'MPC Core Collective', duration: '2:58', energy: 'Medium', vibes: 'Heavy but Chill' },
      { id: 'hhp-6', title: 'Faded Coffee Stains', artist: 'MPC Core Collective', duration: '3:12', energy: 'Low', vibes: 'Melancholic' },
      { id: 'hhp-7', title: 'Sleepless in Tokyo', artist: 'MPC Core Collective', duration: '2:40', energy: 'Medium', vibes: 'Midnight City' },
      { id: 'hhp-8', title: 'Chillhop Boulevard', artist: 'MPC Core Collective', duration: '3:05', energy: 'Medium', vibes: 'Smooth Walker' },
      { id: 'hhp-9', title: 'Sunset Neon Chaser', artist: 'MPC Core Collective', duration: '2:51', energy: 'Medium', vibes: 'Vaporwave' },
      { id: 'hhp-10', title: 'Hologram Nostalgia', artist: 'MPC Core Collective', duration: '3:20', energy: 'Low', vibes: 'Dreamy' },
      { id: 'hhp-11', title: 'Mellow Mood Swing', artist: 'MPC Core Collective', duration: '2:38', energy: 'Low', vibes: 'Jazzy Trap' },
      { id: 'hhp-12', title: 'Midnight Courier', artist: 'MPC Core Collective', duration: '3:04', energy: 'Medium', vibes: 'Lo-Fi Beat' },
      { id: 'hhp-13', title: 'Soulful Resonance', artist: 'MPC Core Collective', duration: '2:59', energy: 'Low', vibes: 'Warm Soul' },
      { id: 'hhp-14', title: 'Memory Lane Chords', artist: 'MPC Core Collective', duration: '3:10', energy: 'Low', vibes: 'Nostalgic' }
    ]
  },
  {
    id: 'lofi-tribal',
    name: 'Tribal Lounge Exclusive',
    genre: 'Tribal Lounge',
    description: 'An immersive digital jungle safari. Shamanic hand-percussions, wooden flutes, organic animal soundscapes, and deep desert drones.',
    listeners: 2110,
    image: 'https://images.unsplash.com/photo-1548815229-eadd0a552917?w=800&auto=format&fit=crop',
    color: 'from-emerald-700 to-stone-900',
    is_live: true,
    tracks: [
      { id: 'trl-1', title: 'Shamanic Pulse', artist: 'Deep Forest Synthesis', duration: '5:12', energy: 'Medium', vibes: 'Hypnotic' },
      { id: 'trl-2', title: 'Amazonian Shimmer', artist: 'Deep Forest Synthesis', duration: '4:45', energy: 'Low', vibes: 'Lush Organic' },
      { id: 'trl-3', title: 'Desert Rose Ambient', artist: 'Deep Forest Synthesis', duration: '5:30', energy: 'Low', vibes: 'Mystic' },
      { id: 'trl-4', title: 'Djembe Drift', artist: 'Deep Forest Synthesis', duration: '4:15', energy: 'Medium', vibes: 'Rhythmic' },
      { id: 'trl-5', title: 'Serengeti Solace', artist: 'Deep Forest Synthesis', duration: '5:01', energy: 'Low', vibes: 'Peaceful' },
      { id: 'trl-6', title: 'Sacred Root Meditation', artist: 'Deep Forest Synthesis', duration: '6:10', energy: 'Low', vibes: 'Deep Grounding' },
      { id: 'trl-7', title: 'Oasis Mirage Rhythm', artist: 'Deep Forest Synthesis', duration: '4:38', energy: 'Medium', vibes: 'Wandering' },
      { id: 'trl-8', title: 'Canopy Rain Dance', artist: 'Deep Forest Synthesis', duration: '4:55', energy: 'Medium', vibes: 'Refreshing' },
      { id: 'trl-9', title: 'Dune Winds whispering', artist: 'Deep Forest Synthesis', duration: '5:22', energy: 'Low', vibes: 'Ethereal Space' },
      { id: 'trl-10', title: 'Equatorial Resonance', artist: 'Deep Forest Synthesis', duration: '4:50', energy: 'Medium', vibes: 'Focusing' }
    ]
  },
  {
    id: 'lofi-therapy',
    name: 'Therapy Vibe Soul & Healing',
    genre: 'Therapy Vibe Soul',
    description: 'Specially engineered emotional sanctuary. Soothing 432Hz ambient sound waves, comforting warm soul keys, and gentle therapeutic pacing.',
    listeners: 5120,
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&auto=format&fit=crop',
    color: 'from-pink-700 to-rose-950',
    is_live: true,
    tracks: [
      { id: 'ths-1', title: 'Breathing Space (432Hz)', artist: 'Aura Healing Acoustics', duration: '6:30', energy: 'Low', vibes: 'Soothing Rest' },
      { id: 'ths-2', title: 'Weighted Blanket of Sound', artist: 'Aura Healing Acoustics', duration: '5:45', energy: 'Low', vibes: 'Comforting' },
      { id: 'ths-3', title: 'Inner Child Sanctuary', artist: 'Aura Healing Acoustics', duration: '5:12', energy: 'Low', vibes: 'Kind & Warm' },
      { id: 'ths-4', title: 'Somatic Release', artist: 'Aura Healing Acoustics', duration: '4:58', energy: 'Low', vibes: 'Cathartic' },
      { id: 'ths-5', title: 'Delta Stream Chords', artist: 'Aura Healing Acoustics', duration: '6:02', energy: 'Low', vibes: 'Deep Sleep' },
      { id: 'ths-6', title: 'Chakra Heart Alignment', artist: 'Aura Healing Acoustics', duration: '5:20', energy: 'Low', vibes: 'Harmonious' },
      { id: 'ths-7', title: 'Warm Organic Cocoon', artist: 'Aura Healing Acoustics', duration: '4:42', energy: 'Low', vibes: 'Secured' },
      { id: 'ths-8', title: 'Quiet Self-Reflection', artist: 'Aura Healing Acoustics', duration: '5:05', energy: 'Low', vibes: 'Meditative' },
      { id: 'ths-9', title: 'Ethereal Velvet Hug', artist: 'Aura Healing Acoustics', duration: '4:18', energy: 'Low', vibes: 'Gentle' },
      { id: 'ths-10', title: 'Calming Tide Frequencies', artist: 'Aura Healing Acoustics', duration: '5:50', energy: 'Low', vibes: 'Oceanic' },
      { id: 'ths-11', title: 'Somatic Reset Session', artist: 'Aura Healing Acoustics', duration: '4:35', energy: 'Low', vibes: 'Grounding' },
      { id: 'ths-12', title: 'Mindfulness Flowing Key', artist: 'Aura Healing Acoustics', duration: '5:10', energy: 'Low', vibes: 'Centered' },
      { id: 'ths-13', title: 'Vagus Nerve Resonance', artist: 'Aura Healing Acoustics', duration: '6:15', energy: 'Low', vibes: 'Anxiety Relief' },
      { id: 'ths-14', title: 'Serenity Coding Base', artist: 'Aura Healing Acoustics', duration: '4:40', energy: 'Low', vibes: 'Mental Clarity' },
      { id: 'ths-15', title: 'Tranquility Pulse Warmth', artist: 'Aura Healing Acoustics', duration: '5:02', energy: 'Low', vibes: 'Peaceful Ambient' },
      { id: 'ths-16', title: 'The Healing Rebirth', artist: 'Aura Healing Acoustics', duration: '5:33', energy: 'Low', vibes: 'Transformative' },
      { id: 'ths-17', title: 'Soft Radiance Chamber', artist: 'Aura Healing Acoustics', duration: '4:22', energy: 'Low', vibes: 'Luminous Glow' },
      { id: 'ths-18', title: 'Golden Hour Relief', artist: 'Aura Healing Acoustics', duration: '4:56', energy: 'Low', vibes: 'Optimistic' },
      { id: 'ths-19', title: 'Solfeggio Balance (528Hz)', artist: 'Aura Healing Acoustics', duration: '6:45', energy: 'Low', vibes: 'Cellular Repair' },
      { id: 'ths-20', title: 'Aura Repair Keys', artist: 'Aura Healing Acoustics', duration: '5:15', energy: 'Low', vibes: 'Restorative' },
      { id: 'ths-21', title: 'Zen Sand Garden', artist: 'Aura Healing Acoustics', duration: '5:38', energy: 'Low', vibes: 'Mindful Sandbox' },
      { id: 'ths-22', title: 'Deep Solitude Comfort', artist: 'Aura Healing Acoustics', duration: '4:49', energy: 'Low', vibes: 'Introverted' },
      { id: 'ths-23', title: 'Peaceful Coexistence', artist: 'Aura Healing Acoustics', duration: '5:04', energy: 'Low', vibes: 'Harmony' },
      { id: 'ths-24', title: 'Forest Bathing Symphony', artist: 'Aura Healing Acoustics', duration: '6:12', energy: 'Low', vibes: 'Eco Therapy' },
      { id: 'ths-25', title: 'Universal Compassion', artist: 'Aura Healing Acoustics', duration: '5:18', energy: 'Low', vibes: 'Warm & Infinite' },
      { id: 'ths-26', title: 'Lunar Cradle Lullaby', artist: 'Aura Healing Acoustics', duration: '4:30', energy: 'Low', vibes: 'Sleep Therapy' },
      { id: 'ths-27', title: 'Endless Horizon Calm', artist: 'Aura Healing Acoustics', duration: '6:25', energy: 'Low', vibes: 'Limitless Peace' }
    ]
  }
];
