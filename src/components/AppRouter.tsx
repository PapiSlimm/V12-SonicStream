import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoadingScreen } from '../shared/ui/LoadingScreen';
import { useAuth } from '../context/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';
import { FEATURES } from '../core/featureFlags';

// Auth entry points. These were previously unreachable: the landing page linked
// to /signup and /signin but neither route existed, so the catch-all bounced
// every click back to the landing page.
const AuthModal = lazy(() => import('../features/auth/AuthModal').then(m => ({ default: m.AuthModal })));

const SignUpPage = () => {
  const navigate = useNavigate();
  // Uses the proven Firebase AuthModal in signup mode. The 5-step OnboardingFlow
  // wizard is parked: its steps call /api/auth/signup, /api/auth/verify-email and
  // /api/artist/profile/setup - server routes that do not exist. Rebuild it
  // against real endpoints before restoring it here.
  return (
    <div className="min-h-screen bg-zinc-950">
      <AuthModal isOpen={true} onClose={() => navigate('/')} initialMode="signup" />
    </div>
  );
};

const SignInPage = () => {
  const navigate = useNavigate();
  // AuthModal closes itself after a successful sign-in; landing on "/" while
  // authenticated redirects straight to /dashboard.
  return (
    <div className="min-h-screen bg-zinc-950">
      <AuthModal isOpen={true} onClose={() => navigate('/')} />
    </div>
  );
};

// Lazy load features
const LandingPage = lazy(() => import('../features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LandingDraft = lazy(() => import('../features/landing/Landing'));
const StreamingPage = lazy(() => import('../features/streaming/StreamingPage').then(m => ({ default: m.StreamingPage })));
const SearchPage = lazy(() => import('../features/search/SearchPage').then(m => ({ default: m.SearchPage })));
const PlaylistManager = lazy(() => import('../features/playlists/PlaylistManager').then(m => ({ default: m.PlaylistManager })));
const ProfileSettings = lazy(() => import('../features/profile/ProfileSettings').then(m => ({ default: m.ProfileSettings })));
const AdminPanel = lazy(() => import('../features/admin/V12AdminDashboard').then(m => ({ default: m.V12AdminDashboard })));
const Marketplace = lazy(() => import('../features/marketplace/Marketplace'));
const RadioHub = lazy(() => import('../features/radio/RadioHub').then(m => ({ default: m.RadioHub })));
const NewsWall = lazy(() => import('../features/rss/NewsWall').then(m => ({ default: m.NewsWall })));
const DMCAPortal = lazy(() => import('../features/legal/DMCAPortal').then(m => ({ default: m.DMCAPortal })));
const PolicyCenter = lazy(() => import('../features/policy/PolicyCenter').then(m => ({ default: m.PolicyCenter })));
const TermsOfService = lazy(() => import('../pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const AIToolsHub = lazy(() => import('../features/ai/AIToolsHub').then(m => ({ default: m.AIToolsHub })));
const SmartFeed = lazy(() => import('../features/streaming/SmartFeed').then(m => ({ default: m.SmartFeed })));
const VisualBuilder = lazy(() => import('../features/builder/VisualBuilder').then(m => ({ default: m.VisualBuilder })));
const EventListingPage = lazy(() => import('../features/events/EventListingPage').then(m => ({ default: m.EventListingPage })));
const EventDetailPage = lazy(() => import('../features/events/EventDetailPage').then(m => ({ default: m.EventDetailPage })));
const UserManualPage = lazy(() => import('../features/support/SupportPage').then(m => ({ default: m.SupportPage })));
const AffiliateDashboard = lazy(() => import('../features/affiliate/AffiliateDashboard').then(m => ({ default: m.AffiliateDashboard })));
const RoleBasedDashboard = lazy(() => import('../features/dashboard/RoleBasedDashboard').then(m => ({ default: m.RoleBasedDashboard })));
const UnifiedAnalytics = lazy(() => import('../features/analytics/UnifiedAnalytics').then(m => ({ default: m.UnifiedAnalytics })));
const GrowthTools = lazy(() => import('../features/ai/GrowthTools').then(m => ({ default: m.GrowthTools })));
const ReleaseDashboard = lazy(() => import('../features/dashboard/ReleaseDashboard').then(m => ({ default: m.ReleaseDashboard })));
const RevenueDashboard = lazy(() => import('../features/dashboard/RevenueDashboard').then(m => ({ default: m.RevenueDashboard })));
const LiveBroadcaster = lazy(() => import('../features/streaming/LiveBroadcaster').then(m => ({ default: m.LiveBroadcaster })));
const SonicRooms = lazy(() => import('../features/rooms/SonicRooms').then(m => ({ default: m.SonicRooms })));
const MobileApp = lazy(() => import('../features/mobile/MobileApp').then(m => ({ default: m.MobileApp })));
const CrmDashboard = lazy(() => import('../features/contact/CrmDashboard').then(m => ({ default: m.CrmDashboard })));
const AiAcquisitionHub = lazy(() => import('../features/ai-acquisition/AiAcquisitionHub').then(m => ({ default: m.AiAcquisitionHub })));

// SEO Pages
const ArtistSEOPage = lazy(() => import('../features/seo/ArtistSEOPage').then(m => ({ default: m.ArtistSEOPage })));
const PricingPage = lazy(() => import('../features/subscriptions/PricingPage').then(m => ({ default: m.PricingPage })));
const TrackSEOPage = lazy(() => import('../features/seo/TrackSEOPage').then(m => ({ default: m.TrackSEOPage })));
const ReleaseSEOPage = lazy(() => import('../features/seo/ReleaseSEOPage').then(m => ({ default: m.ReleaseSEOPage })));
const EventSEOPage = lazy(() => import('../features/seo/EventSEOPage').then(m => ({ default: m.EventSEOPage })));
const MarketplaceSEOPage = lazy(() => import('../features/seo/MarketplaceSEOPage').then(m => ({ default: m.MarketplaceSEOPage })));
const DiscoveryHub = lazy(() => import('../features/seo/DiscoveryHub').then(m => ({ default: m.DiscoveryHub })));
const MarketingGuides = lazy(() => import('../features/seo/MarketingGuides').then(m => ({ default: m.MarketingGuides })));
const PublicCharts = lazy(() => import('../features/seo/PublicCharts').then(m => ({ default: m.PublicCharts })));
const HireArtistLanding = lazy(() => import('../features/seo/HireArtistLanding').then(m => ({ default: m.HireArtistLanding })));
const SegmentLandingPage = lazy(() => import('../features/seo/SegmentLandingPage').then(m => ({ default: m.SegmentLandingPage })));

export const AppRouter = () => {
  const { user, isAdmin, isPro, isEnterprise } = useAuth();
  const isTierUser = !!user;

  useEffect(() => {
    console.log(
      `%c[AppRouter] Loaded. User State: %c${user ? 'Authenticated (' + user.email + ')' : 'Anonymous'}%c | Roles: [Admin: ${isAdmin}, Pro: ${isPro}, Enterprise: ${isEnterprise}]`,
      "color: #c81e3a; font-weight: bold;",
      user ? "color: #e2536a; font-weight: bold;" : "color: #f87171; font-weight: bold;",
      "color: #c81e3a;"
    );
    console.log(`%c[AppRouter] Current URL pathname: %c${window.location.pathname}`, "color: #a1a1aa;", "color: #60a5fa; font-weight: bold;");
  }, [user, isAdmin, isPro, isEnterprise]);

  const wrap = (comp: React.ReactNode) => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        {comp}
      </Suspense>
    </ErrorBoundary>
  );


  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={isTierUser ? <Navigate to="/dashboard" /> : wrap(<LandingPage />)} />
      <Route path="/signup" element={isTierUser ? <Navigate to="/dashboard" /> : wrap(<SignUpPage />)} />
      <Route path="/signin" element={isTierUser ? <Navigate to="/dashboard" /> : wrap(<SignInPage />)} />
      <Route path="/draft-landing" element={wrap(<LandingDraft />)} />
      <Route path="/search" element={wrap(<SearchPage />)} />
      <Route path="/marketplace" element={wrap(<Marketplace />)} />
      <Route path="/radio" element={wrap(<RadioHub />)} />
      <Route path="/news" element={wrap(<NewsWall type="news" />)} />
      <Route path="/legal/dmca" element={wrap(<DMCAPortal />)} />
      <Route path="/policy" element={wrap(<PolicyCenter />)} />
      <Route path="/terms" element={wrap(<TermsOfService />)} />
      <Route path="/privacy" element={wrap(<PrivacyPolicy />)} />
      <Route path="/pricing" element={wrap(<PricingPage />)} />

      {/* SEO Dynamic Routes */}
      <Route path="/for-artists" element={wrap(<SegmentLandingPage segment="artists" />)} />
      <Route path="/for-podcasters" element={wrap(<SegmentLandingPage segment="podcasters" />)} />
      <Route path="/for-churches" element={wrap(<SegmentLandingPage segment="churches" />)} />
      <Route path="/for-coaches" element={wrap(<SegmentLandingPage segment="coaches" />)} />
      <Route path="/for-creators" element={wrap(<SegmentLandingPage segment="creators" />)} />

      <Route path="/artists/:slug" element={wrap(<ArtistSEOPage />)} />
      <Route path="/tracks/:slug" element={wrap(<TrackSEOPage />)} />
      <Route path="/releases/:slug" element={wrap(<ReleaseSEOPage />)} />
      <Route path="/release/:slug" element={wrap(<ReleaseSEOPage />)} />
      <Route path="/events/:id" element={wrap(<EventSEOPage />)} />
      <Route path="/marketplace/:product" element={wrap(<MarketplaceSEOPage />)} />
      <Route path="/discovery/:city" element={wrap(<DiscoveryHub />)} />
      <Route path="/discovery/genre/:genre" element={wrap(<DiscoveryHub />)} />
      <Route path="/discovery/trending" element={wrap(<DiscoveryHub />)} />
      <Route path="/discovery/releases" element={wrap(<DiscoveryHub />)} />
      <Route path="/discovery/events" element={wrap(<DiscoveryHub />)} />
      <Route path="/discovery/events/:city" element={wrap(<DiscoveryHub />)} />
      <Route path="/guides/:topic" element={wrap(<MarketingGuides />)} />
      <Route path="/charts" element={wrap(<PublicCharts />)} />
      <Route path="/charts/:type" element={wrap(<PublicCharts />)} />
      <Route path="/hire" element={wrap(<HireArtistLanding />)} />
      <Route path="/hire/:city" element={wrap(<DiscoveryHub />)} />

      {/* Protected Routes */}
      <Route 
        path="/feed" 
        element={isTierUser ? wrap(<SmartFeed />) : <Navigate to="/" />} 
      />
      <Route 
        path="/builder" 
        element={(isPro || isEnterprise || isAdmin) ? wrap(<VisualBuilder />) : <Navigate to="/" />} 
      />
      <Route 
        path="/library" 
        element={isTierUser ? wrap(<StreamingPage />) : <Navigate to="/" />} 
      />
      <Route 
        path="/live-stream" 
        element={isTierUser ? wrap(<LiveBroadcaster />) : <Navigate to="/" />} 
      />
      <Route 
        path="/mobile" 
        element={isTierUser ? wrap(<MobileApp />) : <Navigate to="/" />} 
      />
      <Route 
        path="/playlists" 
        element={isTierUser ? wrap(<PlaylistManager />) : <Navigate to="/" />} 
      />
      <Route 
        path="/ai" 
        element={FEATURES.AI_STUDIO ? ((isPro || isEnterprise || isAdmin) ? wrap(<AIToolsHub />) : <Navigate to="/" />) : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/bookings" 
        element={isTierUser ? wrap(<EventListingPage />) : <Navigate to="/" />} 
      />
      <Route 
        path="/dashboard" 
        element={isTierUser ? wrap(<RoleBasedDashboard />) : <Navigate to="/" />} 
      />
      <Route 
        path="/dashboard/distribution" 
        element={isTierUser ? wrap(<ReleaseDashboard />) : <Navigate to="/" />} 
      />
      <Route 
        path="/dashboard/revenue" 
        element={isTierUser ? wrap(<RevenueDashboard />) : <Navigate to="/" />} 
      />
      <Route 
        path="/affiliate" 
        element={FEATURES.AFFILIATE ? (isTierUser ? wrap(<AffiliateDashboard />) : <Navigate to="/" />) : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/crm" 
        element={isTierUser ? wrap(<CrmDashboard />) : <Navigate to="/" />} 
      />
      <Route 
        path="/analytics" 
        element={isTierUser ? wrap(<UnifiedAnalytics />) : <Navigate to="/" />} 
      />
      <Route 
        path="/growth" 
        element={FEATURES.AI_STUDIO ? (isTierUser ? wrap(<GrowthTools />) : <Navigate to="/" />) : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/acquisition" 
        element={FEATURES.AI_STUDIO ? (isTierUser ? wrap(<AiAcquisitionHub />) : <Navigate to="/" />) : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/events/:eventId" 
        element={wrap(<EventDetailPage />)} 
      />
      <Route 
        path="/manual" 
        element={wrap(<UserManualPage />)} 
      />
      <Route 
        path="/settings" 
        element={isTierUser ? wrap(<ProfileSettings />) : <Navigate to="/" />} 
      />
      <Route 
        path="/rooms" 
        element={isTierUser ? wrap(<SonicRooms />) : <Navigate to="/" />} 
      />

      {/* Admin Routes */}
      <Route 
        path="/admin/*" 
        element={isAdmin ? wrap(<AdminPanel />) : <Navigate to="/" />} 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
