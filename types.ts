export type PageRoute = 'home' | 'work' | 'pricing' | 'assets' | 'bought-access' | 'receipt' | 'admin';

export interface Purchase {
  id: string;
  receiptId: string;
  assetName: string;
  price: string;
  downloadLink: string;
  purchaseDate: string; // ISO timestamp
  buyerEmail?: string; // Optional buyer email for verification
}

export interface Project {
  id: string;
  type: string;
  link: string;
  title: string;
  description: string;
  tools: string[];
  order: number;
  aspect?: string;
  autoPlay?: boolean; // If true, video autoplays. If false, requires hover to play.
}

export interface FeaturedProject {
  id: string;
  type: string;
  src: string;
  category: string;
  title: string;
  aspect: string;
  order: number;
}

export interface NavItem {
  label: string;
  route?: PageRoute;
  action?: 'scroll-about' | 'scroll-contact' | 'navigate';
}

export interface WorkItem {
  id: string;
  category: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
}

export interface AssetItem {
  id: string;
  title: string;
  description: string;
  type: 'free' | 'premium' | 'tool';
  price?: string;
  imageUrl?: string;
}

export interface Asset {
  id: string;
  title: string;
  description: string;
  category: 'free' | 'featured' | 'premium';
  type?: string; // e.g., "LUTs", "SFX", "Templates", etc.
  price?: string; // Only for premium/featured
  imageUrl?: string; // Optional thumbnail
  downloadLink?: string; // Download or purchase URL
  order: number; // For sorting within category
}

export interface PricingTier {
  name: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  cta: string;
}

export interface NavSettings {
  showPricing: boolean;
  showAssets: boolean;
  showWork: boolean;
  showAbout: boolean;
  showContact: boolean;
}
