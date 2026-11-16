export type VenueCategory = 
  | 'traditional' 
  | 'coffee' 
  | 'burgers' 
  | 'sweets' 
  | 'kids' 
  | 'tourism'
  | 'adventures'
  | 'trips'
  | 'pizza-italian'
  | 'hookah-cafes'
  | 'family-kids'
  | 'cafes'
  | 'historical'
  | 'parks'
  | 'all';

export interface PlaceBranch {
  id: string;
  restaurantId: string;
  branchName: string;
  district: string;
  address: string;
  phone: string;
  googleMapsUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ItemizedPrices {
  mealsJod: number;
  coffeeJod: number;
  dessertsJod: number;
  playTicketsJod: number;
}

export interface MenuItem {
  id: string;
  name: string;
  nameEn?: string;
  priceJod: number;
  category: 'meal' | 'coffee' | 'dessert' | 'ticket';
  description?: string;
  image?: string;
}

export interface SpecialOffer {
  id: string;
  title: string;
  discount: string; // e.g. "خصم 20%"
  description: string;
  promoCode?: string; // e.g. "INSTA20"
  validUntil?: string; // e.g. "ساري طوال الأسبوع"
  terms?: string; // e.g. "أظهر متابعتك لصفحة الإنستغرام للكاشير"
}

export interface PageLinks {
  instagram?: string;
  facebook?: string;
  website?: string;
  tiktok?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  nameEn: string;
  category: VenueCategory;
  district: string;
  description: string;
  fullAddress: string;
  rating: number; // 1-5
  reviewCount: number;
  priceLevel: '$' | '$$' | '$$$' | '$$$$';
  avgPricePerPerson: number; // in JOD
  coverImage: string;
  images: string[];
  logoUrl?: string; // Official Instagram logo / brand avatar
  instagramHandle?: string; // e.g. "@hashem_amman"
  instagramUrl?: string; // direct URL to official Instagram profile
  specialOffer?: SpecialOffer; // Special promotions and deals
  pageLinks?: PageLinks; // Social and website links
  phone: string;
  googleMapsUrl: string;
  placeId?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  operatingHours: string;
  isFeatured?: boolean;
  prices: ItemizedPrices;
  menuItems: MenuItem[];
  uploadedMenuUrl?: string; // Direct image URL or base64 of the uploaded official menu
  hasUploadedMenu?: boolean;
  branches: PlaceBranch[];
  creatorTips?: string;
}

export interface GroupBudgetInput {
  adultsCount: number;
  kidsCount: number;
  includeMeals: boolean;
  includeDesserts: boolean;
  includeCoffee: boolean;
  includePlayTickets: boolean;
  maxBudgetJod: number;
}

export interface TripPlanRequest {
  district: string;
  budgetJod: number;
  adultsCount: number;
  kidsCount: number;
  duration: 'quick' | 'fullday' | 'nightout';
  vibe: 'family' | 'romantic' | 'trendy' | 'heritage' | 'luxury';
  customNotes?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface TripPlanResponse {
  itineraryTitle: string;
  summary: string;
  totalEstimatedJod: number;
  timeSlots: {
    time: string;
    title: string;
    placeName: string;
    activity: string;
    estimatedCostJod: number;
    photographyTip: string;
  }[];
  creatorTips: string;
  groundingSources: GroundingSource[];
}

export interface ReelsScriptRequest {
  venueName: string;
  category: string;
  district: string;
  style: 'asmr' | 'hype' | 'historical';
  targetAudience: string;
}

export interface ReelsScriptResponse {
  title: string;
  style: string;
  hookLine: string;
  audioTrackSuggestion: string;
  scenes: {
    sceneNumber: number;
    visual: string;
    audio: string;
    durationSec: number;
  }[];
  callToAction: string;
  hashtags: string[];
}

export interface PitchProposal {
  id: string;
  venueName: string;
  ownerName: string;
  phone: string;
  packagePriceJod: number;
  features: string[];
  customMessage: string;
  generatedDate: string;
}

export interface IdeaLogItem {
  id: string;
  title: string;
  venueName: string;
  notes: string;
  status: 'idea' | 'pitch_sent' | 'deal_signed' | 'filmed';
  date: string;
}

export type NotificationCategory = 'weekend' | 'offer' | 'adventure' | 'trip' | 'budget' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  category: NotificationCategory;
  actionLabel?: string;
  targetTab?: string;
  targetCategory?: VenueCategory;
  targetVenueId?: string;
}
