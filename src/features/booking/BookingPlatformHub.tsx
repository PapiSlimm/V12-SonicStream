import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Calendar as CalendarIcon, DollarSign, FileText, Sparkles, 
  Layers, Compass, Users, Music, Activity, 
  Plus, Trash2, UserCheck, Smartphone, MapPin, Star, 
  Award, ShieldCheck, Globe, 
  FileCheck, Cpu, Send, RefreshCw, Zap,
  CalendarCheck, CheckCircle2, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  connectGoogleCalendar, 
  isGoogleCalendarConnected, 
  getConnectedEmail 
} from '../../services/googleCalendar';

// --- TYPES ---
export interface BookingRequest {
  id: string;
  artistId: string;
  artistName: string;
  clientId: string;
  clientName: string;
  eventType: string;
  venue: string;
  city: string;
  state: string;
  date: string;
  budget: number;
  guestCount: number;
  status: 'Inquiry' | 'Pending' | 'Accepted' | 'Contract' | 'Payment' | 'Completed';
  contractGenerated: boolean;
  contractType?: 'Performance Agreement' | 'Appearance Agreement' | 'Venue Agreement';
  escrowStatus: 'none' | 'held' | 'released' | 'refunded';
  agentFee: number;
  escrowFee: number;
  netArtistPay: number;
  timeline: { status: string; date: string; note: string }[];
}

export interface BookingPackage {
  id: string;
  name: string;
  price: number;
  isCustom: boolean;
  durationMins: number;
  description: string;
  features: string[];
}

export interface EPKData {
  bio: string;
  pressQuotes: string[];
  photos: string[];
  videoUrl: string;
  musicSamples: { title: string; duration: string; url: string }[];
  stagePlot: {
    inputs: { channel: number; source: string; micType: string; stand: string }[];
    positions: { item: string; x: number; y: number }[];
  };
  bookingContact: { name: string; email: string; phone: string };
}

export interface CreatorProfile {
  id: string;
  name: string;
  type: 'Band' | 'DJ' | 'Producer' | 'Podcaster' | 'Speaker' | 'Church Musician';
  genre: string;
  location: string;
  rating: number;
  image: string;
  baseBudget: number;
  availability: {
    availableDates: string[];
    unavailableDates: string[];
    tourDates: { date: string; city: string; venue: string }[];
    blackoutDates: string[];
  };
  packages: BookingPackage[];
  epk: EPKData;
}

// --- INITIAL MOCK CREATORS DATA ---
const INITIAL_CREATORS: CreatorProfile[] = [
  {
    id: 'c1',
    name: 'V12 Collective',
    type: 'Band',
    genre: 'Synthwave / Pop',
    location: 'Los Angeles, CA',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=400&fit=crop',
    baseBudget: 1500,
    availability: {
      availableDates: ['2026-06-15', '2026-06-16', '2026-06-20', '2026-07-04'],
      unavailableDates: ['2026-06-10', '2026-06-11'],
      tourDates: [
        { date: '2026-06-25', city: 'San Francisco', venue: 'The Chapel' },
        { date: '2026-06-27', city: 'Seattle', venue: 'Neumos' }
      ],
      blackoutDates: ['2026-06-05', '2026-06-06']
    },
    packages: [
      { id: 'p1_1', name: 'Live Performance Set', price: 1500, isCustom: false, durationMins: 90, description: 'Dual oscillator keyboard rigs, energetic backing drums, full immersive laser visuals.', features: ['90-min live show', 'Technical director included', 'Social post cross-promo'] },
      { id: 'p1_2', name: 'Premium Performance with Q&A', price: 2500, isCustom: false, durationMins: 150, description: 'Exclusive VIP extended set plus an interactive modular electronics workshop.', features: ['120-min set', '30-min modular masterclass', 'Interactive Q&A', 'VIP merch gift bags'] }
    ],
    epk: {
      bio: 'V12 Collective is a premier Los Angeles retro synthwave act, pairing rich analog synthesizers with live acoustic drums and cyberpunk visual architecture.',
      pressQuotes: [
        '"The gold standard of neo-analog touring spectacles." - Sonic Horizon Magazine',
        '"A sensory storm that leaves you begging for more neon." - Retro Future Times'
      ],
      photos: [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=250&fit=crop'
      ],
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-retro-futuristic-music-visualizer-background-40748-large.mp4',
      musicSamples: [
        { title: 'Neon Horizons', duration: '3:45', url: '#' },
        { title: 'Sub-bass Zenith', duration: '5:12', url: '#' }
      ],
      stagePlot: {
        inputs: [
          { channel: 1, source: 'Synth Stereo L', micType: 'DI Box', stand: 'None' },
          { channel: 2, source: 'Synth Stereo R', micType: 'DI Box', stand: 'None' },
          { channel: 3, source: 'Kick Drum', micType: 'Beta 52A', stand: 'Short Boom' },
          { channel: 4, source: 'Lead Volcal', micType: 'SM58', stand: 'Tall Boom' }
        ],
        positions: [
          { item: 'Drum Kit (Rear Center)', x: 50, y: 30 },
          { item: 'Stereo Synth Rig (Stage Left)', x: 20, y: 60 },
          { item: 'Lead Vocal Stand (Stage Center)', x: 50, y: 75 }
        ]
      },
      bookingContact: { name: 'Austin Miller (Agent)', email: 'austin@v12collective.com', phone: '+1 (310) 555-8290' }
    }
  },
  {
    id: 'c2',
    name: 'DJ Shadow Glitch',
    type: 'DJ',
    genre: 'Future Bass / IDM',
    location: 'Berlin, Germany',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=400&h=400&fit=crop',
    baseBudget: 1000,
    availability: {
      availableDates: ['2026-06-18', '2026-06-19', '2026-07-10'],
      unavailableDates: ['2026-06-12', '2026-06-14'],
      tourDates: [
        { date: '2026-06-30', city: 'London', venue: 'Fabric' }
      ],
      blackoutDates: ['2026-06-03']
    },
    packages: [
      { id: 'p2_1', name: 'Club Appearance', price: 1000, isCustom: false, durationMins: 120, description: 'Dark, immersive glitch-hop and future breakbeat hybrid set with real-time visual syncing.', features: ['120-min set (up to 140BPM)', 'Pioneer DJM-V10 rider compatibility', 'Interactive MIDI control visual interface'] },
      { id: 'p2_2', name: 'Extended Underground Gig', price: 1800, isCustom: false, durationMins: 240, description: 'Deconstructive minimal house to cyber industrial techno marathon set.', features: ['4-hour continuous stream', 'Pre-event visual ambient soundset', 'SonicStream VIP live broadcast integration'] }
    ],
    epk: {
      bio: 'Operating out of Berlin\'s industrial underground, DJ Shadow Glitch fuses algorithmic acoustic glitching, deep bass synthesis, and hyper-reactive lights.',
      pressQuotes: [
        '"Revising what glitch-hop can convey in large dark arenas." - Resonance Press',
        '"A cerebral, heavy, and unforgiving low-end workout." - Berlin Nocturnal'
      ],
      photos: [
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=250&fit=crop'
      ],
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-motion-of-sound-waves-41381-large.mp4',
      musicSamples: [
        { title: 'Fractured Binary', duration: '4:10', url: '#' },
        { title: 'Asymmetric Echoes', duration: '6:02', url: '#' }
      ],
      stagePlot: {
        inputs: [
          { channel: 1, source: 'DJ Mixer Master L', micType: 'XLR Cable', stand: 'None' },
          { channel: 2, source: 'DJ Mixer Master R', micType: 'XLR Cable', stand: 'None' },
          { channel: 3, source: 'Booth Monitor L', micType: 'TRS Cable', stand: 'None' }
        ],
        positions: [
          { item: 'DJ Console Deck (Center Front)', x: 50, y: 70 },
          { item: 'Booth Monitor Monitor L', x: 25, y: 65 },
          { item: 'Booth Monitor Monitor R', x: 75, y: 65 }
        ]
      },
      bookingContact: { name: 'Elena Richter', email: 'management@shadowglitch.de', phone: '+49 30 8493012' }
    }
  },
  {
    id: 'c3',
    name: 'Luna Ray & The Tide',
    type: 'Band',
    genre: 'Indie Folk / Acoustic',
    location: 'Brooklyn, NY',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=400&fit=crop',
    baseBudget: 800,
    availability: {
      availableDates: ['2026-06-12', '2026-06-13', '2026-06-14', '2026-06-28'],
      unavailableDates: [],
      tourDates: [],
      blackoutDates: []
    },
    packages: [
      { id: 'p3_1', name: 'Acoustic Trios Set', price: 800, isCustom: false, durationMins: 75, description: 'Warm acoustic guitars, vocal cello harmonies, and custom-tuned upright bass.', features: ['75-min intimate show', 'Custom visual projection kit', 'Includes hand-signed posters'] }
    ],
    epk: {
      bio: 'Luna Ray is a Brooklyn singer-songwriter known for celestial storytelling and acoustic landscapes with upright double bass, cello, and vocal loops.',
      pressQuotes: [
        '"A hauntingly fragile vocal range that completely silence a room of thousands." - The Village Indie Review'
      ],
      photos: [],
      videoUrl: '',
      musicSamples: [
        { title: 'Tethered to Stars', duration: '3:50', url: '#' }
      ],
      stagePlot: {
        inputs: [
          { channel: 1, source: 'Acoustic Guitar DI', micType: 'DI Box', stand: 'None' },
          { channel: 2, source: 'Lead Vocal Luna', micType: 'KSM9', stand: 'Tall Boom' },
          { channel: 3, source: 'Cello Pickups', micType: 'DI Box', stand: 'None' }
        ],
        positions: [
          { item: 'Vocal/Guitar Luna (Center Front)', x: 50, y: 70 },
          { item: 'Cello Rig (Stage Right)', x: 30, y: 60 }
        ]
      },
      bookingContact: { name: 'Luna Ray', email: 'luna@lunaraytide.com', phone: '+1 (917) 555-0104' }
    }
  }
];

// --- INITIAL CRM MASTER LIST ---
const INITIAL_REQUESTS: BookingRequest[] = [
  {
    id: 'req-001',
    artistId: 'c1',
    artistName: 'V12 Collective',
    clientId: 'user101',
    clientName: 'Grand Hyatt Plaza Ballroom',
    eventType: 'Corporate Event',
    venue: 'Hyatt Regency Ballroom',
    city: 'San Francisco',
    state: 'CA',
    date: '2026-06-25',
    budget: 2500,
    guestCount: 350,
    status: 'Inquiry',
    contractGenerated: false,
    escrowStatus: 'none',
    agentFee: 375, // 15% booking
    escrowFee: 62.5, // 2.5% escrow
    netArtistPay: 2062.5,
    timeline: [
      { status: 'Inquiry', date: '2026-06-01', note: 'Inquiry submitted for Corporate Gala.' }
    ]
  },
  {
    id: 'req-002',
    artistId: 'c2',
    artistName: 'DJ Shadow Glitch',
    clientId: 'user99',
    clientName: 'Waterfront Warehouse',
    eventType: 'Club Appearance',
    venue: 'Grid Club & Vaults',
    city: 'Berlin',
    state: 'Berlin',
    date: '2026-06-18',
    budget: 1000,
    guestCount: 200,
    status: 'Accepted',
    contractGenerated: true,
    contractType: 'Performance Agreement',
    escrowStatus: 'none',
    agentFee: 150,
    escrowFee: 25,
    netArtistPay: 825,
    timeline: [
      { status: 'Inquiry', date: '2026-05-24', note: 'Initial club inquiries for sub-bass glitch performance.' },
      { status: 'Pending', date: '2026-05-26', note: 'Awaiting venue sound specs.' },
      { status: 'Accepted', date: '2026-06-02', note: 'Creator confirmed calendar date.' }
    ]
  },
  {
    id: 'req-003',
    artistId: 'c3',
    artistName: 'Luna Ray & The Tide',
    clientId: 'user45',
    clientName: 'Brooklyn Botanical Society',
    eventType: 'Live Performance',
    venue: 'Palm Greenhouse',
    city: 'Brooklyn',
    state: 'NY',
    date: '2026-06-12',
    budget: 800,
    guestCount: 90,
    status: 'Payment',
    contractGenerated: true,
    contractType: 'Performance Agreement',
    escrowStatus: 'held',
    agentFee: 120,
    escrowFee: 20,
    netArtistPay: 660,
    timeline: [
      { status: 'Inquiry', date: '2026-05-15', note: 'Greenhouse fundraiser session proposal.' },
      { status: 'Accepted', date: '2026-05-20', note: 'Dates verified and agreed.' },
      { status: 'Contract', date: '2026-05-22', note: 'Contract signed by agent and executive buyer.' },
      { status: 'Payment', date: '2026-05-25', note: 'Stripe Escrow Connect hold verified ($800.00).' }
    ]
  }
];

// --- MAIN PORTAL COMPONENT ---
export function BookingPlatformHub() {
  const { user } = useAuth();
  
  // Tab Routing State
  const [activeTab, setActiveTab] = useState<'marketplace' | 'crm' | 'calendar' | 'packages' | 'epk' | 'escrow' | 'team'>('marketplace');
  
  // Core Business State
  const [creators, setCreators] = useState<CreatorProfile[]>(INITIAL_CREATORS);
  const [requests, setRequests] = useState<BookingRequest[]>(INITIAL_REQUESTS);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('c1');
  
  // Custom Filters for Marketplace Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [budgetRange, setBudgetRange] = useState<number>(3000);
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'tour'>('all');

  // Google Calendar Integration Details
  const [gcalConnected, setGcalConnected] = useState(false);
  const [connectedEmailAddress, setConnectedEmailAddress] = useState<string | null>(null);

  // New Booking Proposal Dialog
  const [showInquiryModal, setShowInquiryModal] = useState<CreatorProfile | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    eventType: 'Live Performance',
    venue: '',
    city: '',
    state: '',
    date: '2026-06-20',
    budget: 1500,
    guestCount: 150
  });

  // AI Assistant Chat state
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ sender: 'user' | 'assistant'; text: string; action?: any }[]>([
    { sender: 'assistant', text: 'Hi! I am your SonicStream AI Booking Agent. I can help you compile contract clauses, suggest optimal event budgets based on genre multipliers, evaluate local venues, and auto-reply to client inquiries. What would you like to build or check?' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Synchronise Google Calendar connection on lifecycle load
  useEffect(() => {
    setGcalConnected(isGoogleCalendarConnected());
    setConnectedEmailAddress(getConnectedEmail());
  }, []);

  const selectedCreator = useMemo(() => {
    return creators.find(c => c.id === selectedCreatorId) || creators[0];
  }, [creators, selectedCreatorId]);

  // Handle Google Calendar Activation
  const handleConnectGoogleCalendar = async () => {
    try {
      const response = await connectGoogleCalendar();
      if (response) {
        setGcalConnected(true);
        setConnectedEmailAddress(response.email);
        toast.success(`Connected Google Calendar with ${response.email}`);
      }
    } catch {
      toast.error('Google Calendar authorization failed or cancelled.');
    }
  };

  // Switch Selected Creator for Editing Press Kit / Calendar
  const handleCreatorChange = (id: string) => {
    setSelectedCreatorId(id);
  };

  // Marketplace Search Filter logic
  const filteredCreators = useMemo(() => {
    return creators.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || c.type === selectedType;
      const matchesGenre = genreFilter === 'all' || c.genre.toLowerCase().includes(genreFilter.toLowerCase());
      const matchesBudget = c.baseBudget <= budgetRange;
      
      let matchesAvailability = true;
      if (availabilityFilter === 'available') {
        matchesAvailability = c.availability.availableDates.length > 0;
      } else if (availabilityFilter === 'tour') {
        matchesAvailability = c.availability.tourDates.length > 0;
      }

      return matchesSearch && matchesType && matchesGenre && matchesBudget && matchesAvailability;
    });
  }, [creators, searchQuery, selectedType, genreFilter, budgetRange, availabilityFilter]);

  // Calculate Escrow Pricing Split (SonicStream Platform maintains standard 15% booking fees and 2.5% escrow management fee)
  const calculateFees = (budget: number) => {
    const agentFee = Math.round(budget * 0.15 * 100) / 100;
    const escrowFee = Math.round(budget * 0.025 * 100) / 100;
    const netArtistPay = Math.round((budget - agentFee - escrowFee) * 100) / 100;
    return { agentFee, escrowFee, netArtistPay };
  };

  // Submit Inquiry Pipeline Event
  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInquiryModal) return;

    const { agentFee, escrowFee, netArtistPay } = calculateFees(inquiryForm.budget);
    
    const newReq: BookingRequest = {
      id: `req-${Math.floor(100+Math.random()*900)}`,
      artistId: showInquiryModal.id,
      artistName: showInquiryModal.name,
      clientId: user?.id || 'client-anon',
      clientName: user?.name || 'Local Organizer',
      eventType: inquiryForm.eventType,
      venue: inquiryForm.venue,
      city: inquiryForm.city,
      state: inquiryForm.state,
      date: inquiryForm.date,
      guestCount: inquiryForm.guestCount,
      budget: inquiryForm.budget,
      status: 'Inquiry',
      contractGenerated: false,
      escrowStatus: 'none',
      agentFee,
      escrowFee,
      netArtistPay,
      timeline: [
        { status: 'Inquiry', date: new Date().toISOString().split('T')[0], note: `Inquiry submitted for ${inquiryForm.eventType} at ${inquiryForm.venue || 'TBD'}` }
      ]
    };

    setRequests(prev => [newReq, ...prev]);
    setShowInquiryModal(null);
    toast.success('Your booking proposal has been submitted to the artist\'s CRM pipelines!');
    setActiveTab('crm');
  };

  // CRM status change action handler + business transitions
  const handleTransitionRequest = (requestId: string, nextStatus: BookingRequest['status']) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      
      let escrowStatus = r.escrowStatus;
      let contractGenerated = r.contractGenerated;
      let contractType = r.contractType;

      if (nextStatus === 'Contract') {
        contractGenerated = true;
        contractType = r.contractType || 'Performance Agreement';
      }
      if (nextStatus === 'Payment' && r.status === 'Contract') {
        escrowStatus = 'held';
        toast.success(`Client deposit matching 50% locked safely into Stripe Connect Escrow!`);
      }
      if (nextStatus === 'Completed' && r.status === 'Payment') {
        escrowStatus = 'released';
        toast.success(`Event verified completed. Total payout released directly into the creator's Stripe balance!`);
      }

      return {
        ...r,
        status: nextStatus,
        escrowStatus,
        contractGenerated,
        contractType,
        timeline: [...r.timeline, { status: nextStatus, date: new Date().toISOString().split('T')[0], note: `Request escalated to state ${nextStatus}` }]
      };
    }));
  };

  // Update Packages Config
  const handleUpdatePackagePrice = (packageId: string, value: number) => {
    setCreators(prev => prev.map(c => {
      if (c.id !== selectedCreatorId) return c;
      return {
        ...c,
        packages: c.packages.map(p => p.id === packageId ? { ...p, price: value } : p)
      };
    }));
    toast.success('Package rate update synchronized in the cloud DB!');
  };

  const handleAddPackage = (name: string, price: number, description: string) => {
    const newPkg: BookingPackage = {
      id: `p-${Math.random().toString(36).substr(2, 5)}`,
      name,
      price,
      isCustom: true,
      durationMins: 90,
      description,
      features: ['Full live amplification', 'Direct local stage engineering support']
    };

    setCreators(prev => prev.map(c => {
      if (c.id !== selectedCreatorId) return c;
      return {
        ...c,
        packages: [...c.packages, newPkg]
      };
    }));
    toast.success(`Successfully published new package "${name}"!`);
  };

  // EPK Input handlers
  const handleSaveBio = (bioText: string) => {
    setCreators(prev => prev.map(c => {
      if (c.id !== selectedCreatorId) return c;
      return {
        ...c,
        epk: { ...c.epk, bio: bioText }
      };
    }));
    toast.success('EPK biography draft updated.');
  };

  const handleAddStagePlotDevice = (source: string, type: string) => {
    setCreators(prev => prev.map(c => {
      if (c.id !== selectedCreatorId) return c;
      const inputs = c.epk.stagePlot.inputs;
      const nextChan = inputs.length > 0 ? Math.max(...inputs.map(i => i.channel)) + 1 : 1;
      return {
        ...c,
        epk: {
          ...c.epk,
          stagePlot: {
            ...c.epk.stagePlot,
            inputs: [...inputs, { channel: nextChan, source, micType: type, stand: 'Tall Boom' }]
          }
        }
      };
    }));
    toast.success('Channel patched successfully to live stage plot!');
  };

  const handleRemovePlotInput = (chanNum: number) => {
    setCreators(prev => prev.map(c => {
      if (c.id !== selectedCreatorId) return c;
      return {
        ...c,
        epk: {
          ...c.epk,
          stagePlot: {
            ...c.epk.stagePlot,
            inputs: c.epk.stagePlot.inputs.filter(i => i.channel !== chanNum)
          }
        }
      };
    }));
  };

  // Calendar Date add/remove helpers
  const handleAddCalendarDate = (dateType: 'availableDates' | 'unavailableDates' | 'blackoutDates', dateVal: string) => {
    if (!dateVal) return;
    setCreators(prev => prev.map(c => {
      if (c.id !== selectedCreatorId) return c;
      const currentList = c.availability[dateType];
      if (currentList.includes(dateVal)) return c;
      return {
        ...c,
        availability: {
          ...c.availability,
          [dateType]: [...currentList, dateVal].sort()
        }
      };
    }));
    toast.success(`Date ${dateVal} updated on availability calendar!`);
  };

  const handleRemoveCalendarDate = (dateType: 'availableDates' | 'unavailableDates' | 'blackoutDates', dateVal: string) => {
    setCreators(prev => prev.map(c => {
      if (c.id !== selectedCreatorId) return c;
      return {
        ...c,
        availability: {
          ...c.availability,
          [dateType]: c.availability[dateType].filter(d => d !== dateVal)
        }
      };
    }));
    toast.success(`Date entry removed.`);
  };

  // AI Booking Assistant chat prompt processing simulation
  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    const userPrompt = aiInput.trim();
    setAiInput('');
    setAiHistory(prev => [...prev, { sender: 'user', text: userPrompt }]);
    setIsAiLoading(true);

    setTimeout(() => {
      let reply = '';
      let actObj: any = undefined;

      const lower = userPrompt.toLowerCase();
      if (lower.includes('suggest pricing') || lower.includes('pricing') || lower.includes('rate')) {
        reply = `Evaluated metrics for standard categories within ${selectedCreator.location} for "${selectedCreator.genre}". Based on demand multipliers (1.15x current peak) and local city venue size matching 150-300 attendees, we recommend the following pricing scales:
- Live Set: $1,400 to $1,800
- Club Appearance: $950 to $1,250
- Extended VIP Package: $2,200 to $2,700
Platform escrow fee applied is 2.5%, netting you 82.5% of total venue payout on contract resolution.`;
      } else if (lower.includes('contract') || lower.includes('agreement') || lower.includes('template')) {
        reply = `Done! I've automatically drafted an interactive standard Performance Agreement with standard clauses:
1. Radius Clause: No public ticketed shows within 50km for 7 days flanking the event.
2. Safe Hold Escrow: Buyer authorizes a 50% retainer deposit ($${selectedCreator.packages[0]?.price / 2 || 400}) processed via Stripe Connections held securely.
3. Tech Rider: Mandatory soundcheck must occur 2 hours before main doors open.`;
        actObj = { type: 'contract_draft', data: 'Performance Agreement template loaded' };
      } else if (lower.includes('venue') || lower.includes('recommend')) {
        reply = `Identified top 3 local venues in our SonicStream Database compatible with ${selectedCreator.genre} in ${selectedCreator.location}:
1. The Echo Vaults (Cap: 250, Live soundcheck optimized, in-house FOH engineer)
2. Retro Hub Underground (Cap: 180, DJ Rig aligned, active club license)
3. Starlight Atrium (Cap: 500, acoustic / folk cellular layout)
Would you like me to populate a booking request for any of these?`;
      } else if (lower.includes('inquiry') || lower.includes('respond')) {
        reply = `Proposed inquiry email draft for organizers wanting your set:
"Dear organizer, Thank you for reaching out via SonicStream Booking! We have verified that Luna is available on your requested date. Our flat fee for Live Acoustic performance is $${selectedCreator.baseBudget} with standard 50% escrow deposit. Let us know if you would like us to draft the agreement."`;
      } else {
        reply = `I have updated your AI assistant query buffers. I can draft clauses, compute booking service fees (15%), or synchronize availability. Let me know which booking detail you want to explore next!`;
      }

      setAiHistory(prev => [...prev, { sender: 'assistant', text: reply, action: actObj }]);
      setIsAiLoading(false);
    }, 1200);
  };

  const crmSummaryStats = useMemo(() => {
    const totalRequests = requests.length;
    const pipelineSum = requests.reduce((sum, r) => sum + r.budget, 0);
    const paidSum = requests.filter(r => r.status === 'Completed').reduce((sum, r) => sum + r.netArtistPay, 0);
    const pendingSecured = requests.filter(r => r.escrowStatus === 'held').reduce((sum, r) => sum + r.budget, 0);
    return { totalRequests, pipelineSum, paidSum, pendingSecured };
  }, [requests]);

  return (
    <div className="min-h-screen bg-black text-white relative pb-16">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-zinc-800/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-10 space-y-10">
        
        {/* Header Module */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Sparkles size={14} />
              Unified Gig Booking Suite V12
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
              Creator Booking Hub
            </h1>
            <p className="text-zinc-500 max-w-2xl text-sm font-medium">
              Manage professional artist bookings, generate custom legal agreements, holds escrow with Stripe, sync schedules, and recruit performance packages instantly.
            </p>
          </div>

          {/* Quick Creator Swap Selector for Creator Control Panel */}
          <div className="flex flex-wrap items-center gap-4 bg-zinc-900/50 p-3 rounded-2xl border border-white/5">
            <div className="text-xs font-bold text-zinc-400 flex items-center gap-1">
              <Users size={14} className="text-emerald-500" />
              Creator Panel Profile:
            </div>
            <select 
              value={selectedCreatorId}
              onChange={(e) => handleCreatorChange(e.target.value)}
              className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
            >
              {creators.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>
        </header>

        {/* Navigation Tabs Bar */}
        <nav className="flex flex-wrap items-center gap-2 bg-zinc-900/20 border border-white/5 p-2 rounded-3xl">
          {[
            { id: 'marketplace', label: 'Marketplace Discovery', icon: Compass },
            { id: 'crm', label: 'Booking CRM & Requests', icon: Activity, count: requests.length },
            { id: 'calendar', label: 'Availability Calendar', icon: CalendarIcon },
            { id: 'packages', label: 'Booking Packages', icon: Layers },
            { id: 'epk', label: 'Press Kit (EPK)', icon: Music },
            { id: 'escrow', label: 'Stripe Escrow Payments', icon: DollarSign },
            { id: 'team', label: 'Team Permission Settings', icon: UserCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isAct = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isAct 
                    ? 'bg-zinc-700 text-white shadow-lg shadow-black/10' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isAct ? 'bg-black text-emerald-400' : 'bg-white/10 text-zinc-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* --- MAIN MODULE GRAPHICS CONTENT AREA --- */}
        <main className="space-y-10 min-h-[500px]">

          {/* MODULE 1: MARKETPLACE DISCOVERY VIEW */}
          {activeTab === 'marketplace' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="space-y-8"
            >
              {/* Comprehensive Search & Filter Dashboard */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search performers, genres, bands, DJs, podcasters, speakers..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Filter Selects */}
                  <div className="flex flex-wrap gap-3">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-emerald-400"
                    >
                      <option value="all">All Creator Roles</option>
                      <option value="Band">Bands</option>
                      <option value="DJ">DJs</option>
                      <option value="Producer">Producers</option>
                      <option value="Podcaster">Podcasters</option>
                      <option value="Speaker">Speakers</option>
                      <option value="Church Musician">Church Musicians</option>
                    </select>

                    <select
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-emerald-400"
                    >
                      <option value="all">All Genres</option>
                      <option value="synthwave">Synthwave</option>
                      <option value="bass">Bass / Club</option>
                      <option value="acoustic">Acoustic / Folk</option>
                    </select>

                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                      className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-emerald-400"
                    >
                      <option value="all">Any Schedule</option>
                      <option value="available">Has Open Slots</option>
                      <option value="tour">Currently on Tour</option>
                    </select>
                  </div>
                </div>

                {/* Range and Checkboxes */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2 border-t border-white/5">
                  <div className="w-full sm:w-80 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-zinc-400">
                      <span>Maximum Gig Budget:</span>
                      <span className="text-emerald-400">${budgetRange}</span>
                    </div>
                    <input 
                      type="range" 
                      min="500" 
                      max="5000" 
                      step="100" 
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <p className="text-xs text-zinc-500 font-bold">
                    Found {filteredCreators.length} verified creators meeting parameters.
                  </p>
                </div>
              </div>

              {/* Creators Discovery Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCreators.map(creator => (
                  <div 
                    key={creator.id}
                    className="bg-zinc-900/30 border border-white/5 hover:border-white/10 rounded-[32px] overflow-hidden transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Frame */}
                      <div className="h-48 relative overflow-hidden bg-zinc-950">
                        <img 
                          src={creator.image} 
                          alt={creator.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          {creator.type}
                        </div>
                        {creator.availability.tourDates.length > 0 && (
                          <div className="absolute top-4 right-4 bg-red-500 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white">
                            On Tour
                          </div>
                        )}
                      </div>

                      {/* Info body */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <h3 className="text-xl font-bold">{creator.name}</h3>
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded-md border border-amber-400/10">
                            <Star size={12} fill="currentColor" />
                            {creator.rating}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400 font-bold">
                          <span className="flex items-center gap-1">
                            <Music size={12} className="text-emerald-500" />
                            {creator.genre}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-zinc-500" />
                            {creator.location}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-500 line-clamp-2">
                          {creator.epk.bio}
                        </p>

                        <div className="border-t border-white/5 pt-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">Starting Flat Rate:</span>
                            <span className="text-white font-mono font-bold">${creator.baseBudget}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">Available Slots:</span>
                            <span className="text-emerald-400 font-mono text-[10px] font-bold">
                              {creator.availability.availableDates.length} upcoming dates
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedCreatorId(creator.id);
                          setActiveTab('epk');
                        }}
                        className="flex-1 bg-white/5 border border-white/10 py-2.5 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-colors"
                      >
                        Read EPK
                      </button>
                      <button 
                        onClick={() => {
                          // Prefill proposal
                          setInquiryForm(prev => ({
                            ...prev,
                            budget: creator.baseBudget
                          }));
                          setShowInquiryModal(creator);
                        }}
                        className="flex-1 bg-zinc-700 py-2.5 rounded-xl text-xs font-bold text-white hover:bg-zinc-600 transition-colors"
                      >
                        Book Artist
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* MODULE 2: BOOKING CRM & REQUESTS LIFECYCLE PIPELINE */}
          {activeTab === 'crm' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="space-y-8"
            >
              {/* Financial pipeline indicators */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Inquiries Managed', value: crmSummaryStats.totalRequests, icon: Activity, col: 'zinc' },
                  { label: 'Total Pipeline Vault Value', value: `$${crmSummaryStats.pipelineSum}`, icon: DollarSign, col: 'emerald' },
                  { label: 'Funds Held in Escrow', value: `$${crmSummaryStats.pendingSecured}`, icon: ShieldCheck, col: 'blue' },
                  { label: 'Resolved Artist Earnings', value: `$${crmSummaryStats.paidSum}`, icon: Award, col: 'purple' }
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{stat.label}</p>
                        <h4 className="text-3xl font-black font-mono">{stat.value}</h4>
                      </div>
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-emerald-400">
                        <Icon size={18} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Master Requests List */}
              <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Active Booking Pipeline</h3>
                  <p className="text-sm text-zinc-500">Track and advance active legal status negotiations and payment transactions.</p>
                </div>

                <div className="space-y-4">
                  {requests.map(req => (
                    <div 
                      key={req.id}
                      className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-white/10 transition-all"
                    >
                      {/* Left: General Specs */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-black text-zinc-400">{req.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            req.status === 'Inquiry' ? 'bg-zinc-800 text-zinc-400' :
                            req.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' :
                            req.status === 'Accepted' ? 'bg-blue-500/10 text-blue-400' :
                            req.status === 'Contract' ? 'bg-purple-500/10 text-purple-400' :
                            req.status === 'Payment' ? 'bg-zinc-700/10 text-emerald-400' :
                            'bg-zinc-700 text-white'
                          }`}>
                            {req.status}
                          </span>
                          {req.contractGenerated && (
                            <span className="flex items-center gap-1 bg-white/5 text-[9px] text-zinc-400 px-2 py-0.5 rounded border border-white/5">
                              <FileCheck size={10} />
                              Contract Issued
                            </span>
                          )}
                          {req.escrowStatus === 'held' && (
                            <span className="flex items-center gap-1 bg-emerald-500/10 text-[9px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                              <ShieldCheck size={10} />
                              Stripe Secured
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-lg font-bold">{req.artistName} <span className="text-xs text-zinc-500 font-normal">by {req.clientName}</span></h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                            <span className="flex items-center gap-0.5"><CalendarIcon size={12} /> {req.date}</span>
                            <span className="flex items-center gap-0.5"><MapPin size={12} /> {req.city}, {req.state}</span>
                            <span className="flex items-center gap-0.5"><Users size={12} /> Guests: {req.guestCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Calculated splits and commissions */}
                      <div className="bg-zinc-950/60 p-4 rounded-2xl grid grid-cols-3 gap-4 text-center border border-white/5">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase">Gross Budget</p>
                          <p className="text-sm font-mono font-bold text-white">${req.budget}</p>
                        </div>
                        <div className="space-y-0.5 border-x border-white/5 px-2">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase">Broker/Escrow Fee</p>
                          <p className="text-sm font-mono text-zinc-400">${req.agentFee + req.escrowFee}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase">Net Artist Payout</p>
                          <p className="text-sm font-mono font-bold text-emerald-400">${req.netArtistPay}</p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {req.status === 'Inquiry' && (
                          <button
                            onClick={() => handleTransitionRequest(req.id, 'Pending')}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold px-4 py-2 rounded-xl text-white"
                          >
                            Mark Pending
                          </button>
                        )}
                        {req.status === 'Pending' && (
                          <button
                            onClick={() => handleTransitionRequest(req.id, 'Accepted')}
                            className="bg-amber-500 text-black hover:bg-amber-400 transition-all text-xs font-bold px-4 py-2 rounded-xl"
                          >
                            Accept Offer
                          </button>
                        )}
                        {req.status === 'Accepted' && (
                          <button
                            onClick={() => handleTransitionRequest(req.id, 'Contract')}
                            className="bg-purple-500 hover:bg-purple-400 transition-all text-xs font-bold px-4 py-2 rounded-xl text-white flex items-center gap-1.5"
                          >
                            <FileText size={12} />
                            Generate Contract
                          </button>
                        )}
                        {req.status === 'Contract' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // Simulate signing and prompt for deposit check
                                handleTransitionRequest(req.id, 'Payment');
                              }}
                              className="bg-blue-500 hover:bg-blue-400 transition-all text-xs font-bold px-4 py-2 rounded-xl text-white"
                            >
                              Procure Client Payment
                            </button>
                          </div>
                        )}
                        {req.status === 'Payment' && (
                          <button
                            onClick={() => handleTransitionRequest(req.id, 'Completed')}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white transition-all text-xs font-bold px-4 py-2 rounded-xl"
                          >
                            Disburse Escrow Payout
                          </button>
                        )}
                        {req.status === 'Completed' && (
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-4 py-2 rounded-xl">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            Payout Transferred
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* MODULE 3: AVAILABILITY & CALENDAR */}
          {activeTab === 'calendar' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Creator Active Calendar Settings */}
              <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 lg:col-span-2 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Availability Blocks</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Selected Artist: {selectedCreator.name}</p>
                  </div>
                  
                  {/* Google Calendar Toggle Block */}
                  <button 
                    onClick={handleConnectGoogleCalendar}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                      gcalConnected 
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    <CalendarCheck size={14} />
                    {gcalConnected ? `Active: ${connectedEmailAddress}` : 'Connect GCal & Outlook'}
                  </button>
                </div>

                {/* Simulated Monthly Grid Visual */}
                <div className="bg-zinc-950/60 p-6 rounded-3xl border border-white/5 space-y-4">
                  <header className="flex justify-between text-xs font-mono font-bold text-zinc-400 border-b border-white/5 pb-2">
                    <span>June 2026</span>
                    <span>SonicStream Auto-Sync Matrix</span>
                  </header>
                  <div className="grid grid-cols-7 gap-1 text-center py-4">
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <span key={i} className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{d}</span>
                    ))}
                    {Array.from({ length: 30 }).map((_, i) => {
                      const dayStr = `2026-06-${String(i + 1).padStart(2, '0')}`;
                      
                      const isAvail = selectedCreator.availability.availableDates.includes(dayStr);
                      const isUnavail = selectedCreator.availability.unavailableDates.includes(dayStr);
                      const isBlack = selectedCreator.availability.blackoutDates.includes(dayStr);
                      const isTour = selectedCreator.availability.tourDates.some(t => t.date === dayStr);

                      let cellBg = 'bg-zinc-900 text-zinc-500';
                      let labelType = '';
                      if (isAvail) { cellBg = 'bg-zinc-700 text-white font-black'; labelType = 'A'; }
                      else if (isUnavail) { cellBg = 'bg-zinc-800 text-zinc-600'; labelType = 'U'; }
                      else if (isBlack) { cellBg = 'bg-zinc-950 border border-red-500/40 text-red-400'; labelType = 'B'; }
                      else if (isTour) { cellBg = 'bg-red-500 text-white font-black'; labelType = 'T'; }

                      return (
                        <div 
                          key={i} 
                          title={`${dayStr}: ${isAvail ? 'Available' : isTour ? 'On Tour' : isBlack ? 'Blackout' : 'Open'}`}
                          className={`h-10 text-[10px] rounded-lg flex flex-col justify-between p-1 select-none transition-transform hover:scale-105 cursor-pointer ${cellBg}`}
                        >
                          <span className="self-start">{i + 1}</span>
                          <span className="self-end text-[8px] font-black">{labelType}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Availability Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/30 p-6 rounded-3xl border border-white/5">
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold flex items-center gap-1.5 text-emerald-400">
                      <Plus size={16} /> Block Calendar Date
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="date" 
                        id="new-date-input"
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs focus:outline-none" 
                      />
                      <select 
                        id="new-date-type"
                        className="bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                      >
                        <option value="availableDates">Available Date</option>
                        <option value="unavailableDates">Unavailable Date</option>
                        <option value="blackoutDates">Blackout (Force Lock)</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => {
                        const dateEl = document.getElementById('new-date-input') as HTMLInputElement;
                        const typeEl = document.getElementById('new-date-type') as HTMLSelectElement;
                        if (dateEl && dateEl.value) {
                          handleAddCalendarDate(typeEl.value as any, dateEl.value);
                          dateEl.value = '';
                        } else {
                          toast.error('Specify a logical date format.');
                        }
                      }}
                      className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 rounded-xl text-xs"
                    >
                      Sync Blocks to Core
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Legend Keys</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" /> Available Dates</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-sm inline-block" /> Tour Shows</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-zinc-800 rounded-sm inline-block" /> Unavailable</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-black border border-red-500/40 rounded-sm inline-block" /> Force Blackout</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Active Blocks */}
              <div className="space-y-8">
                {/* Active Lists */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 space-y-6">
                  <h4 className="text-sm font-bold flex items-center gap-1.5 text-red-400">
                    <Trash2 size={16} /> Delete Locked Dates
                  </h4>

                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-b border-white/5 pb-1">Blackout & Restraints</p>
                    {selectedCreator.availability.blackoutDates.map(date => (
                      <div key={date} className="flex justify-between items-center text-xs bg-zinc-950/80 p-2.5 rounded-lg border border-white/5">
                        <span className="font-mono text-zinc-300">{date} (Blackout)</span>
                        <button 
                          onClick={() => handleRemoveCalendarDate('blackoutDates', date)}
                          className="text-zinc-500 hover:text-red-400 text-xs"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-b border-white/5 pb-1 pt-2">Available Slots</p>
                    {selectedCreator.availability.availableDates.map(date => (
                      <div key={date} className="flex justify-between items-center text-xs bg-zinc-950/80 p-2.5 rounded-lg border border-white/5">
                        <span className="font-mono text-emerald-400">{date}</span>
                        <button 
                          onClick={() => handleRemoveCalendarDate('availableDates', date)}
                          className="text-zinc-500 hover:text-red-400 text-xs"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tour Dates visual */}
                <div className="bg-zinc-900/20 border border-white/5 rounded-[32px] p-6 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe size={14} className="text-red-500" /> Connected Tour Nodes
                  </h4>
                  <div className="space-y-3">
                    {selectedCreator.availability.tourDates.map((tour, idx) => (
                      <div key={idx} className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1">
                        <span className="bg-red-500 text-white font-black text-[9px] uppercase px-1.5 py-0.5 rounded">Tour Stop</span>
                        <p className="text-xs font-bold">{tour.city} @ {tour.venue}</p>
                        <p className="text-[10px] font-mono text-zinc-500">{tour.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MODULE 4: BOOKING PACKAGES SYSTEM */}
          {activeTab === 'packages' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Package Editor */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Booking Packages</h3>
                    <p className="text-sm text-zinc-500">Edit features and rates of configured packages for active marketplace proposals.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedCreator.packages.map(pkg => (
                      <div 
                        key={pkg.id} 
                        className="bg-zinc-950/80 border border-white/5 hover:border-emerald-500/20 rounded-3xl p-6 space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-bold">{pkg.name}</h4>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[9px] font-black uppercase">
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 leading-relaxed border-b border-white/5 pb-3">
                            {pkg.description}
                          </p>
                          <ul className="space-y-1.5 text-[11px] text-zinc-400 font-bold pt-1">
                            {pkg.features.map((feat, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                {feat}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Interactive price edit */}
                        <div className="pt-4 border-t border-white/5 space-y-2">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Update Flat Package Rate ($)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              defaultValue={pkg.price}
                              onBlur={(e) => handleUpdatePackagePrice(pkg.id, Number(e.target.value))}
                              className="bg-black border border-white/10 rounded-xl px-3 py-1 text-xs font-mono w-24 text-center focus:border-emerald-400 focus:outline-none"
                            />
                            <span className="text-[10px] text-zinc-600 self-center font-bold">Press out of input key to sync.</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add package visual */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-1 text-emerald-400">
                      <Plus size={18} /> Publish New Package
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-bold uppercase">Package Name</label>
                        <input 
                          type="text" 
                          id="new-pkg-name" 
                          placeholder="e.g. Festival Performance" 
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-bold uppercase">Base Rate ($)</label>
                        <input 
                          type="number" 
                          id="new-pkg-price" 
                          placeholder="2500" 
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none font-mono" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-bold uppercase">Service Description</label>
                        <textarea 
                          id="new-pkg-desc" 
                          placeholder="What is included in this live gig specification?"
                          rows={3} 
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none" 
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const name = (document.getElementById('new-pkg-name') as HTMLInputElement)?.value;
                      const price = Number((document.getElementById('new-pkg-price') as HTMLInputElement)?.value);
                      const desc = (document.getElementById('new-pkg-desc') as HTMLTextAreaElement)?.value;
                      if (name && price && desc) {
                        handleAddPackage(name, price, desc);
                        (document.getElementById('new-pkg-name') as HTMLInputElement).value = '';
                        (document.getElementById('new-pkg-price') as HTMLInputElement).value = '';
                        (document.getElementById('new-pkg-desc') as HTMLTextAreaElement).value = '';
                      } else {
                        toast.error('Please complete all package parameters.');
                      }
                    }}
                    className="w-full bg-zinc-700 text-white font-bold py-3 rounded-xl text-xs hover:bg-zinc-600"
                  >
                    Publish to Booking Marketplace
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* MODULE 5: ELECTRONIC PRESS KIT (EPK) PORTAL */}
          {activeTab === 'epk' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Visual EPK Mock Screen */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 lg:col-span-2 space-y-6">
                  <header className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">EPK Viewport</h3>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{selectedCreator.name}</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase">
                      <Globe size={14} /> EPK Live URL Ready
                    </span>
                  </header>

                  <div className="space-y-6">
                    {/* Bio Edit */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">EPK Biography</label>
                      <textarea 
                        defaultValue={selectedCreator.epk.bio}
                        onBlur={(e) => handleSaveBio(e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-xs font-medium focus:border-emerald-400 focus:outline-none"
                      />
                      <span className="text-[10px] text-zinc-600 block">Draft is auto-saved upon blurring click out.</span>
                    </div>

                    {/* Music samples list */}
                    <div className="space-y-3">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Verified Audio Samples</label>
                      <div className="space-y-2">
                        {selectedCreator.epk.musicSamples.map((samp, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-black/40 border border-white/5 p-4 rounded-2xl">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                <Music size={16} />
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-white">{samp.title}</h4>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase">24-bit WAV Stereo</p>
                              </div>
                            </div>
                            <span className="text-xs font-mono text-zinc-500">{samp.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Drag-And-Drop / Interactive Input-Stage Plot Map Area */}
                    <div className="space-y-4 border-t border-white/5 pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold flex items-center gap-1.5">
                            <Activity size={16} className="text-emerald-400" /> Professional Stage Plot
                          </h4>
                          <p className="text-[10px] text-zinc-500">Live sound patch blueprint for FOH Venue engineers.</p>
                        </div>
                      </div>

                      {/* Plots graphic view */}
                      <div className="bg-zinc-950 p-6 rounded-3xl border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {selectedCreator.epk.stagePlot.inputs.map((patch) => (
                          <div key={patch.channel} className="bg-zinc-900/40 border border-white/10 p-3 h-28 rounded-2xl flex flex-col justify-between">
                            <header className="flex justify-between text-[10px]">
                              <span className="text-emerald-400 font-black font-mono">CH {patch.channel}</span>
                              <span className="text-zinc-600 font-bold">{patch.micType}</span>
                            </header>
                            <p className="text-xs font-black truncate">{patch.source}</p>
                            <button 
                              onClick={() => handleRemovePlotInput(patch.channel)}
                              className="self-end text-[10px] font-bold text-red-400 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Press-Kit files and contacts */}
                <div className="space-y-8">
                  {/* Contacts card */}
                  <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-1.5">
                      <Smartphone size={18} className="text-emerald-400" /> EPK Booking Contact
                    </h3>
                    <div className="space-y-3 text-xs bg-zinc-950 p-6 rounded-2xl border border-white/5">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Representative:</span>
                        <span className="text-white font-bold">{selectedCreator.epk.bookingContact.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Direct Email:</span>
                        <span className="text-emerald-400 font-bold hover:underline">{selectedCreator.epk.bookingContact.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">FOH Mobile:</span>
                        <span className="text-zinc-300 font-bold">{selectedCreator.epk.bookingContact.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Add stage input patch form */}
                  <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 space-y-4">
                    <h3 className="text-sm font-bold">Add Input Channel Patch</h3>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        id="epk-stage-source" 
                        placeholder="e.g. Acoustic Guitar" 
                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                      />
                      <select 
                        id="epk-stage-mictype"
                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                      >
                        <option value="DI Box">DI Box (Stereo Balanced)</option>
                        <option value="SM58 Vocal Mic">SM58 Vocal Mic</option>
                        <option value="Beta 52A Kick">Beta 52A Kick</option>
                        <option value="Condenser Overhead">Condenser Overhead</option>
                      </select>
                      <button 
                        onClick={() => {
                          const src = (document.getElementById('epk-stage-source') as HTMLInputElement)?.value;
                          const mic = (document.getElementById('epk-stage-mictype') as HTMLSelectElement)?.value;
                          if (src && mic) {
                            handleAddStagePlotDevice(src, mic);
                            (document.getElementById('epk-stage-source') as HTMLInputElement).value = '';
                          } else {
                            toast.error('Complete patch input parameters.');
                          }
                        }}
                        className="w-full bg-zinc-700 text-white py-2 rounded-xl text-xs font-bold"
                      >
                        Patch Input Channel
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* MODULE 6: ESCROW CONNECT & STRIPE TRANSITS */}
          {activeTab === 'escrow' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="space-y-8"
            >
              {/* stripe banner overview */}
              <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    <ShieldCheck size={12} />
                    Connected via Stripe Connect Escrow
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Connect Escrow Dashboard</h3>
                  <p className="text-xs text-zinc-500 max-w-sm">Funds held securely in secure escrow locks until performance completion is authorized.</p>
                </div>

                <div className="bg-zinc-950 p-6 rounded-3xl border border-white/5 text-center px-12">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Stripe Connected Balance</span>
                  <p className="text-4xl font-black font-mono text-emerald-400">$3,485.40</p>
                  <span className="text-[9px] text-zinc-600 block mt-1 font-bold italic">Automatic payouts occur every Tuesday.</span>
                </div>
              </div>

              {/* Transaction lifecycle items */}
              <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">Active Escrow Holds</h3>
                  <p className="text-xs text-zinc-500">Transferred client deposits are stored behind a secure, smart multi-sig performance lock.</p>
                </div>

                <div className="space-y-4">
                  {requests.filter(r => r.status === 'Payment' || r.status === 'Completed').map(req => (
                    <div 
                      key={req.id} 
                      className="bg-zinc-950 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/15 text-blue-400 rounded-2xl border border-blue-500/20">
                          <ShieldCheck size={20} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">Hold Code: ST-{req.id}</h4>
                            <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400">
                              Locked Holds
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">Securing performance fees for {req.artistName} • event scheduled {req.date}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="space-y-1 text-right">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Deposit amount securely held (50%)</span>
                          <p className="text-lg font-mono font-bold text-white">${req.budget / 2}</p>
                        </div>

                        {req.status === 'Payment' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                handleTransitionRequest(req.id, 'Completed');
                              }}
                              className="bg-zinc-700 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-600"
                            >
                              Disburse Net payment
                            </button>
                            <button 
                              onClick={() => {
                                toast.success(`Refund process initiated for buyer ${req.clientName}`);
                              }}
                              className="bg-zinc-900 text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/5"
                            >
                              Refund Holds
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
                            <CheckCircle2 size={12} />
                            Disbursed Fully
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* MODULE 7: TEAM/MANAGER WORKFLOW SETTINGS */}
          {activeTab === 'team' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Active Members CRM control */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Active Team Permission Directory</h3>
                    <p className="text-sm text-zinc-500">Empower managers, promoters, and booking assistants to configure dates, approve quotes, and manage contracts.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: user?.name || 'Local Organizer (You)', email: user?.email || 'papislimm@gmail.com', role: 'Artist / Owner', status: 'Primary Owner' },
                      { name: 'Sarah Connor', email: 'sarah.management@visionary.fm', role: 'Agent', status: 'Approved' },
                      { name: 'Michael Vance', email: 'michael@promoterlabs.com', role: 'Promoter', status: 'Pending Verification' },
                    ].map((member, i) => (
                      <div key={i} className="bg-zinc-950 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold">
                            {member.name[0]}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-white">{member.name}</h4>
                            <p className="text-[10px] text-zinc-500">{member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <span className="px-2.5 py-0.5 bg-zinc-900 border border-white/10 text-white rounded text-[9px] font-bold">
                            {member.role}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">{member.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Member visual */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-1 text-emerald-400">
                      <Plus size={16} /> Invite Representative
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-bold uppercase">Name</label>
                        <input 
                          type="text" 
                          id="new-mem-name"
                          placeholder="James Carter" 
                          className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-bold uppercase">Email</label>
                        <input 
                          type="email" 
                          id="new-mem-email"
                          placeholder="james@bookingagency.com" 
                          className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-bold uppercase">Assigned Permission Scope</label>
                        <select 
                          id="new-mem-role"
                          className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        >
                          <option value="Manager">Manager (Full Contract Powers)</option>
                          <option value="Agent">Agent (Approve Inquiries)</option>
                          <option value="Assistant">Assistant (Configure Calendar)</option>
                          <option value="Promoter">Promoter (Read-Only Specs)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const name = (document.getElementById('new-mem-name') as HTMLInputElement)?.value;
                      const email = (document.getElementById('new-mem-email') as HTMLInputElement)?.value;
                      const role = (document.getElementById('new-mem-role') as HTMLSelectElement)?.value;
                      if (name && email && role) {
                        toast.success(`Invitation successfully dispatched to ${email}!`);
                        (document.getElementById('new-mem-name') as HTMLInputElement).value = '';
                        (document.getElementById('new-mem-email') as HTMLInputElement).value = '';
                      } else {
                        toast.error('Complete all invite variables.');
                      }
                    }}
                    className="w-full bg-zinc-700 text-white py-2 rounded-xl text-xs font-bold"
                  >
                    Send Invite Code
                  </button>
                </div>

              </div>
            </motion.div>
          )}

        </main>
      </div>

      {/* --- AI BOOKING ASSISTANT HUD COMPONENT overlay --- */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {showAiAssistant && (
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 40, scale: 0.95 }} 
              className="bg-zinc-900 border border-white/10 shadow-2xl rounded-3xl w-[380px] max-w-full overflow-hidden flex flex-col h-[520px] mb-4"
            >
              {/* Header */}
              <header className="bg-zinc-950 p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-teal-900/40 to-indigo-950/40">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Cpu size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">AI Booking Agent</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">SonicStream Assistant</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAiAssistant(false)}
                  className="text-zinc-500 hover:text-white text-xs select-none p-1 bg-white/5 rounded-md"
                >
                  Close
                </button>
              </header>

              {/* Chat history */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
                {aiHistory.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      item.sender === 'user' 
                        ? 'bg-zinc-700 text-white font-medium rounded-tr-none' 
                        : 'bg-zinc-950 text-zinc-300 border border-white/5 rounded-tl-none'
                    }`}>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-950 text-zinc-500 p-3 rounded-2xl border border-white/5 rounded-tl-none flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin text-emerald-400" />
                      Computing smart response...
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions shortcuts helper */}
              <div className="p-2 border-t border-white/5 bg-zinc-950 flex flex-wrap gap-1.5">
                {[
                  'Suggest pricing benchmarks',
                  'Draft contract templates',
                  'Recommend local venues',
                  'Reply to inquiry draft'
                ].map((sug, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setAiInput(sug);
                    }}
                    className="text-[9px] font-black uppercase text-zinc-400 bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Input section */}
              <div className="p-3 border-t border-white/10 bg-zinc-950 flex gap-1.5">
                <input 
                  type="text" 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                  placeholder="Ask for contract details or price estimates..." 
                  className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-3 text-xs outline-none focus:border-emerald-500 transition-colors py-2 text-white"
                />
                <button 
                  onClick={handleAiSend}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white p-2 rounded-xl transition-all flex items-center justify-center w-10 h-10"
                >
                  <Send size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assistant Toggle button */}
        <button 
          onClick={() => setShowAiAssistant(prev => !prev)}
          className="bg-zinc-700 hover:bg-zinc-600 text-white p-4 rounded-full shadow-2xl transition-all shadow-black/20 flex items-center justify-center h-14 w-14 group"
        >
          {showAiAssistant ? <X size={24} /> : <Zap size={24} className="group-hover:scale-110 transition-transform" />}
        </button>
      </div>

      {/* Booking inquiry modal popup */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-45 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-90 w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden"
          >
            <header className="p-6 border-b border-white/5 bg-zinc-950 flex justify-between items-center">
              <div>
                <h4 className="text-xl font-bold uppercase tracking-tight">Initiate Booking Request</h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">To {showInquiryModal.name}</p>
              </div>
              <button 
                onClick={() => setShowInquiryModal(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSubmitInquiry} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Performance Date</label>
                  <input 
                    type="date"
                    value={inquiryForm.date}
                    onChange={(e) => setInquiryForm({...inquiryForm, date: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none text-white focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Performance Genre/Type</label>
                  <select
                    value={inquiryForm.eventType}
                    onChange={(e) => setInquiryForm({...inquiryForm, eventType: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none text-white focus:border-emerald-500"
                  >
                    <option value="Live Performance">Live Performance</option>
                    <option value="Club Appearance">Club Appearance</option>
                    <option value="Corporate Event">Corporate Event</option>
                    <option value="Festival Slot">Festival Slot</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-black">Venue Name / Location</label>
                <input 
                  type="text"
                  placeholder="e.g. Starlight Pavilion"
                  value={inquiryForm.venue}
                  onChange={(e) => setInquiryForm({...inquiryForm, venue: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none text-white focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">City</label>
                  <input 
                    type="text"
                    placeholder="San Francisco"
                    value={inquiryForm.city}
                    onChange={(e) => setInquiryForm({...inquiryForm, city: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none text-white focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">State</label>
                  <input 
                    type="text"
                    placeholder="CA"
                    value={inquiryForm.state}
                    onChange={(e) => setInquiryForm({...inquiryForm, state: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none text-white focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Organizer Flat Budget ($)</label>
                  <input 
                    type="number"
                    value={inquiryForm.budget}
                    onChange={(e) => setInquiryForm({...inquiryForm, budget: Number(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none text-white focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Expected Attendees</label>
                  <input 
                    type="number"
                    value={inquiryForm.guestCount}
                    onChange={(e) => setInquiryForm({...inquiryForm, guestCount: Number(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs outline-none text-white focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Escrow note splits display */}
              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Escrow Split & Calculations:</span>
                <span className="text-[10px] text-zinc-400 block pb-1 border-b border-white/5">
                  15% booking + 2.5% escrow security fee applied.
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex justify-between text-zinc-500">
                    <span>Base gross budget:</span>
                    <span className="font-mono text-white">${inquiryForm.budget}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Net creator pay:</span>
                    <span className="font-mono text-emerald-400">${Math.round(inquiryForm.budget * 0.825)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowInquiryModal(null)}
                  className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl py-3 text-xs font-bold"
                >
                  Cancel Proposal
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-zinc-700 text-white rounded-xl py-3 text-xs font-bold hover:bg-zinc-600"
                >
                  Lock Booking Quote
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
