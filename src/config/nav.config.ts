import { 
  Music,
  Search, 
  Library, 
  Radio, 
  Settings,
  Calendar,
  Bell,
  Sparkles,
  Globe,
  ShoppingCart,
  Shield,
  BarChart3,
  Headphones,
  Zap,
  TrendingUp,
  Layout,
  Book,
  Users,
  Video,
  Smartphone
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  feature?: string;
  roles?: string[];
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { id: 'discover', label: 'Discover', icon: Globe, path: '/' },
  { id: 'smart-feed', label: 'Smart Feed', icon: Sparkles, path: '/feed', feature: 'SMART_FEED' },
  { id: 'search', label: 'Search', icon: Search, path: '/search' },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart, path: '/marketplace' },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { id: 'library', label: 'My Music', icon: Library, path: '/library' },
  { id: 'playlists', label: 'Playlists', icon: Music, path: '/playlists' },
  { id: 'radio', label: 'Radio Hub', icon: Radio, path: '/radio' },
];

export const FEATURE_NAV_ITEMS: NavItem[] = [
  { id: 'live-stream', label: 'Live Broadcast', icon: Video, path: '/live-stream' },
  { id: 'mobile-app', label: 'Mobile Experience', icon: Smartphone, path: '/mobile' },
  { id: 'site-builder', label: 'Site Builder', icon: Layout, path: '/builder', feature: 'SITE_BUILDER' },
  { id: 'ai-studio', label: 'AI Studio', icon: Sparkles, path: '/ai', feature: 'AI_STUDIO' },
  { id: 'growth-tools', label: 'Growth Tools', icon: TrendingUp, path: '/growth', feature: 'AI_STUDIO' },
  { id: 'ai-acquisition', label: 'AI Lead Acquisition', icon: Users, path: '/acquisition', feature: 'AI_STUDIO' },
  { id: 'bookings', label: 'Bookings', icon: Calendar, path: '/bookings', feature: 'BOOKINGS' },
  { id: 'affiliate', label: 'Affiliates', icon: Users, path: '/affiliate', feature: 'AFFILIATE' },
  { id: 'news', label: 'News Wall', icon: Zap, path: '/news' },
  { id: 'rooms', label: 'SonicRooms', icon: Headphones, path: '/rooms' },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'admin', label: 'Control Center', icon: Shield, path: '/admin', roles: ['admin'] },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics', roles: ['admin'] },
];

export const FOOTER_NAV_ITEMS: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  { id: 'policy', label: 'Compliance & Policies', icon: Shield, path: '/policy' },
  { id: 'manual', label: 'User Manual', icon: Book, path: '/manual' },
  { id: 'help', label: 'Help & FAQ', icon: Bell, path: '/help' },
];
