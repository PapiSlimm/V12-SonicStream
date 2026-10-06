export type ISODateString = string;

export interface ReleaseMetadata {
  language?: string;
  copyright?: string;
  producer?: string;
  contributors?: string[];
}

export interface SiteComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

export type ArtistType = "artist" | "band" | "dj" | "producer" | "podcaster";

export type NotificationType = "booking" | "sale" | "payout" | "royalty" | "message";

export type SubscriptionTier = 'free' | 'creator' | 'pro' | 'visionary' | 'enterprise';

export interface Post {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  content: string;
  mediaUrl?: string;
  type: 'text' | 'video' | 'photo' | 'product';
  isPromotion: boolean;
  price?: number;
  productLink?: string;
  ctaLink?: string;
  ctaText?: string;
  likes: number;
  comments: number;
  shares: number;
  hasLiked: boolean;
  isVerified?: boolean;
  musicId?: string;
  trackTitle?: string;
  artistName?: string;
  createdAt: string;
}

export interface MarketingScript {
  id: string;
  title: string;
  visual: string;
  speakerNotes: string;
  order: number;
  createdAt: string;
}

export interface Product {
  id: string;
  tenantId?: string;
  sellerId: string;
  sellerName?: string;
  name: string;
  description: string;
  price: number;
  priceCents?: number;
  type: 'digital_download' | 'webinar' | 'membership' | 'physical_good' | 'service';
  imageUrl?: string;
  fileUrl?: string;
  stock?: number;
  status: 'active' | 'inactive' | 'sold_out';
  isOfficial: boolean;
  brandName?: string;
  fulfillmentMethod?: 'internal' | 'external';
  externalFulfillmentService?: string;
  createdAt: ISODateString;
}

export interface Sale {
  id: string;
  tenantId?: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  amountCents: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripeSessionId?: string;
  createdAt: ISODateString;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  capacity: number;
  imageUrl?: string;
  techRider?: string;
  ownerId: string;
  isVerified: boolean;
  amenities?: string[];
  contactEmail?: string;
  website?: string;
}

export interface UserCore {
  id: string;
  email: string;
  name: string;
  userType: 'listener' | 'artist' | 'admin' | 'creator' | 'business' | 'venue';
  subscriptionTier: SubscriptionTier;
}

export interface UserProfile {
  avatarUrl?: string;
  bio?: string;
  city?: string;
  profileId?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    spotify?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    thread?: string;
    reddit?: string;
  };
  preferredGenres?: string[];
}

export interface UserFinancials {
  balance: number;
  payoutThreshold?: number;
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;
}

export interface UserVerification {
  emailVerified: boolean;
  isVerified: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  idImageUrl?: string;
}

export interface UserUsageMetrics {
  aiMasteringCount?: number;
  distributionUnits?: number;
  aiGenerationsCount?: number;
  lastAiGenerationReset?: string;
}

export interface UserLicensing {
  ipiCae?: string;
  proName?: string;
  mlcId?: string;
}

export enum ReleaseStatus {
  DRAFT = 'DRAFT',
  VALIDATING = 'VALIDATING',
  PACKAGED = 'PACKAGED',
  SUBMITTED = 'SUBMITTED',
  DISTRIBUTED = 'DISTRIBUTED',
  LIVE = 'LIVE',
  FAILED = 'FAILED',
  TAKEDOWN = 'TAKEDOWN'
}

export enum ReleaseType {
  SINGLE = 'SINGLE',
  EP = 'EP',
  ALBUM = 'ALBUM'
}

export enum TrackStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  UPLOADED = 'UPLOADED',
  FAILED = 'FAILED'
}

export interface LedgerAccount {
  id: string;
  userId: string;
  type: 'earnings' | 'escrow' | 'platform';
  balance: number;
  balanceCents: number;
  currency: string;
  updatedAt: ISODateString;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  amountCents: number;
  type: 'debit' | 'credit';
  referenceType: 'royalty' | 'payout' | 'sale';
  referenceId: string;
  description: string;
  createdAt: ISODateString;
}

export type User = UserCore & UserProfile & UserFinancials & UserVerification & UserUsageMetrics & UserLicensing & {
  isPro: boolean;
  isPremiumEventUser?: boolean;
};

export interface TrackStreaming {
  fileUrl: string;
  streamUrl: string;
  audioUrl?: string;
  hlsUrl?: string;
  dashUrl?: string;
  previewUrl?: string;
  primaryStreamType: 'hls' | 'dash' | 'mp3';
  bitrateVariants?: Array<{ height: number; bitrate: number; label?: string }>;
}

export interface TrackMetadata {
  title: string;
  displayArtistName: string;
  albumTitle?: string;
  genre: string;
  mood?: string;
  lyrics?: string;
  duration: number;
  explicitContent: boolean;
  coverUrl?: string;
  description?: string;
  releaseDate?: string;
  isrc?: string;
  upc?: string;
}

export interface TrackStatusConcern {
  status: 'draft' | 'pending' | 'live' | 'rejected' | 'takedown_pending' | 'mastering' | 'error' | 'takedown';
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'verified_creator';
  editorialFeatured?: boolean;
}

export type Track = {
  id: string;
  tenantId?: string;
  ownerUserId: string;
  primaryArtistId: string;
  albumId?: string;
  uploaderId: string;
  price: number;
  priceCents?: number;
  isVideo: boolean;
  plays: number;
  viralScore?: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
} & TrackStreaming & TrackMetadata & TrackStatusConcern;

export interface Playlist {
  id: string;
  tenantId?: string;
  userId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  coverType?: 'custom' | 'collage' | 'cyberpunk' | 'gradient' | 'minimal';
  trackIds: string[];
  isPublic: boolean;
  isCollaborative: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Album {
  id: string;
  artistId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  releaseDate: string;
  genre: string;
  type: 'album' | 'ep' | 'single';
  trackIds: string[];
  createdAt: string;
}

export interface PlayHistory {
  id: string;
  userId: string;
  trackId: string;
  playedAt: string;
  durationPlayed: number;
}

export interface Like {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'track' | 'album' | 'playlist';
  createdAt: string;
}

export interface Artist {
  id: string;
  tenantId?: string;
  userId: string;
  name: string;
  type: ArtistType;
  bio: string;
  imageUrl: string;
  bannerUrl?: string;
  avatarUrl?: string;
  city?: string;
  genres: string[];
  followersCount: number;
  isFollowing: boolean;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    spotify?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    thread?: string;
    reddit?: string;
  };
  bookingPrice: number;
  bookingPriceCents?: number;
  performancePrice: number;
  performancePriceCents?: number;
  depositPercentage: number;
  duration: number;
  price: number;
  priceCents?: number;
  radiusClauseKm?: number;
  radiusClauseDays?: number;
  technicalRider?: string;
  hospitalityRider?: string;
  mustHaves?: string[];
  availability: Availability[];
  riders?: ArtistRiders;
  marketPricing?: MarketPricing;
}

export interface ArtistRiders {
  soundLight?: number;
  backline?: number;
  hotel?: number;
  flights?: number;
  meals?: number;
}

export interface MarketPricing {
  demandMultiplier: number;
  locationFees: Record<string, number>;
  peakDates: string[];
}

export interface Availability {
  id: string;
  artistId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: string;
  tenantId?: string;
  artistId: string;
  eventId?: string;
  artistName?: string;
  customerName: string;
  customerEmail: string;
  customerId?: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  paymentStatus: 'pending' | 'deposit_paid' | 'paid';
  paymentMethod?: string;
  depositAmount: number;
  depositAmountCents?: number;
  totalAmount: number;
  totalAmountCents?: number;
  commissionAmount: number;
  riderCosts: number;
  confirmationNumber?: string;
  reservationPin?: string;
  performanceGuaranteeId?: string;
  defaultFeeApplied: boolean;
  createdAt: ISODateString;
}

export interface Stats {
  totalBookings: number;
  totalRevenue: number;
  upcomingBookings: number;
  activeArtists: number;
}

export interface Notification {
  id: string;
  userId?: string;
  type: NotificationType;
  message: string;
  createdAt: ISODateString;
  isRead: boolean;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  sentAt: ISODateString;
  status: string;
}

export interface RoyaltyStatement {
  id: string;
  platformId: string;
  trackId: string;
  userId: string;
  amountCents: number;
  periodStart: string;
  periodEnd: string;
  streams: number;
  createdAt: string;
}

export interface Payout {
  id: string;
  userId: string;
  amountCents: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  requestedAt: ISODateString;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

export interface ArtistAnalytics {
  totalStreams: number;
  monthlyListeners: number;
  revenue: {
    total: number;
    artistShare: number;
    sonicShare: number;
  };
  platformDistribution: Array<{
    name: string;
    streams: number;
  }>;
  dailyStreams?: Array<{ date: string; count: number }>;
  weeklyStreams?: Array<{ date: string; count: number }>;
  monthlyStreams?: Array<{ date: string; count: number }>;
  revenueByPlatform?: Array<{ platform: string; amount: number }>;
  demographics?: {
    ageGroups: Record<string, number>;
    topCountries: Array<{ country: string; count: number }>;
    gender?: Array<{ type: string; percentage: number }>;
  };
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  idImageUrl: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
  };
  status: 'pending' | 'verified' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryJob {
  id: string;
  releaseId?: string;
  trackId?: string;
  platformId: string;
  platformName?: string;
  trackTitle?: string;
  artistName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  externalId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  artist: string;
  genre: string;
  score: number;
  reason?: string;
}

export interface SonicEvent {
  id: string;
  artistId: string;
  organizerId?: string;
  artistName: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  city: string;
  price: number;
  ticketsAvailable: number;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  time?: string;
  genre?: string;
  popularity?: number;
  createdAt: string;
}

export interface APIKey {
  id: string;
  name: string;
  hashedKey: string;
  lastFour: string;
  key?: string;
  createdAt: ISODateString;
  lastUsed?: ISODateString;
  status: 'active' | 'revoked';
}

export interface SmartLink {
  id: string;
  trackId: string;
  artistId: string;
  slug: string;
  title: string;
  description?: string;
  coverUrl?: string;
  releaseDate: string;
  platforms: Record<string, string>;
  visits: number;
  createdAt: ISODateString;
}

export type PaymentMethod = 'stripe' | 'paypal' | 'square';

export interface CustomSite {
  id: string;
  tenantId?: string;
  userId: string;
  subdomain: string;
  theme: string;
  layout: {
    sections: Array<{
      id: string;
      type: string;
      content: unknown;
      order: number;
    }>;
    header?: unknown;
    footer?: unknown;
  };
  components: Array<SiteComponent>;
  status: 'draft' | 'published';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface MasteringPreset {
  id: string;
  userId: string;
  name: string;
  profile: string;
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface ProAsset {
  id: string;
  name: string;
  description: string;
  type: 'overlay' | 'transition' | 'sfx' | 'lut' | 'motion_graphic' | 'bg_music';
  category: string;
  previewUrl?: string;
  fileUrl: string;
  requiredTier: 'visionary' | 'pro';
  tags: string[];
  fileSize?: number;
  format?: string;
  createdAt: string;
}

export interface VideoSegment {
  id: string;
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
  name: string;
}

// --- AFFILIATE MODELS ---
export interface Affiliate {
  id: string;
  tenantId?: string;
  userId: string;
  code: string;
  referralCount: number;
  earningsCents: number;
  payoutAddress?: string;
  createdAt: ISODateString;
}

export interface AffiliateReferral {
  id: string;
  tenantId?: string;
  affiliateId: string;
  referredUserId: string;
  status: 'active' | 'inactive';
  subscriptionTier: SubscriptionTier;
  createdAt: ISODateString;
}

export interface AffiliateCommission {
  id: string;
  tenantId?: string;
  affiliateId: string;
  referredUserId: string;
  amountCents: number;
  subscriptionPaymentId: string;
  payoutStatus: 'pending' | 'paid' | 'cancelled';
  createdAt: ISODateString;
}

// --- PRINTING MODELS ---
export interface PrintProduct {
  id: string;
  tenantId?: string;
  name: string;
  description: string;
  basePriceCents: number;
  retailPriceCents: number;
  itemType: 'vinyl' | 'cd' | 'tshirt' | 'poster' | 'hoodie';
  mockupUrl?: string;
  templateUrl?: string;
  status: 'active' | 'inactive';
  createdAt: ISODateString;
}

export interface PrintOrderModern {
  id: string;
  tenantId?: string;
  userId: string;
  paymentIntentId?: string;
  customerEmail: string;
  cart: Array<{
    printProductId: string;
    quantity: number;
    customGraphicUrl?: string;
  }>;
  shippingAddress: string;
  amountChargedCents: number;
  costEstimateCents: number;
  profitEstimateCents: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: ISODateString;
}

// --- CRM MODELS ---
export type CRMContactType = 'fan' | 'venue_curator' | 'booker' | 'promoter' | 'vip';
export type CRMLifecycleStage = 'lead' | 'contact' | 'customer' | 'advocate';

export interface CRMContact {
  id: string;
  tenantId?: string;
  userId: string; // The artist/business owner of this contact
  name: string;
  email: string;
  phone?: string;
  type: CRMContactType;
  lifecycleStage: CRMLifecycleStage;
  notes?: string;
  tags?: string[];
  lastInteractionAt?: ISODateString;
  createdAt: ISODateString;
}

export interface CRMInteraction {
  id: string;
  tenantId?: string;
  contactId: string;
  userId: string;
  type: 'email' | 'call' | 'meeting' | 'social_message' | 'note';
  notes: string;
  createdAt: ISODateString;
}

// --- AI JOB MODELS ---
export interface AIJob {
  id: string;
  tenantId?: string;
  userId: string;
  jobType: 'mastering' | 'cover_art' | 'video_segment' | 'lyrics_generation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inputUrl?: string;
  outputUrl?: string;
  profitFeeRatePercent: number; // e.g. 5.5%
  createdAt: ISODateString;
  completedAt?: ISODateString;
}

export interface AIGeneratedProduct {
  id: string;
  tenantId?: string;
  productId: string;
  aiJobId: string;
  createdAt: ISODateString;
}

export interface ShortVideo {
  id: number;
  creator: string;
  avatar: string;
  description: string;
  song: string;
  url: string;
  likes: number;
  commentsCount: number;
  shares: number;
  bio?: string;
  releaseDate?: string;
  fullTitle?: string;
  genre?: string;
  bitrate?: string;
  aiGenres?: string[];
  aiMoods?: string[];
  aiAnalysisText?: string;
}



