export interface Tenant {
  id: string;
  slug: string;
  name: string;
  tax_id?: string;
  industry_type: string;
  logo_url: string;
  views_count?: number;
  theme_config: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family?: string;
    border_radius?: string;
    show_best_sellers?: boolean;
    show_featured_ratings?: boolean;
    store_template?: string;
    custom_theme?: string;
  };
  landing_config: {
    hero_title: string;
    hero_subtitle: string;
    hero_video_url?: string;
    hero_image_url?: string;
    whatsapp_default: string;
    display_phone?: string;
    international_phone?: string;
    email?: string;
    address?: string;
    hours?: string;
    plant_location?: string;
    show_catalog?: boolean;
    show_branches?: boolean;
    show_services?: boolean;
    show_best_sellers?: boolean;
    show_featured_ratings?: boolean;
  };
  settings: {
    currency: string;
    currency_symbol: string;
    enable_whatsapp_rfq?: boolean;
    brands?: Brand[];
    tags?: ProductTag[];
    attributes?: ProductAttribute[];
    reviews?: ProductReview[];
    [key: string]: any;
  };
}

export interface Branch {
  id: string;
  slug: string;
  name: string;
  branch_type: string;
  city: string;
  address: string;
  phone_number?: string;
  phone_whatsapp: string;
  email?: string;
  is_main_branch: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
  image_url?: string;
  parent_id?: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at?: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  enable_archives?: boolean;
  order_by?: string;
  terms: string[];
  created_at?: string;
}

export type ReviewStatus = 'approved' | 'pending' | 'spam' | 'trash';

export interface ProductReviewReply {
  content: string;
  author_name: string;
  created_at: string;
}

export interface ProductReview {
  id: string;
  tenant_id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  type: 'review' | 'rating';
  author_name: string;
  author_email?: string;
  author_ip?: string;
  rating: number;
  content: string;
  status: ReviewStatus;
  reply?: ProductReviewReply | null;
  created_at: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  description?: string;
  images: string[];
  attributes: {
    specs?: Record<string, string>;
    features?: string[];
    badge?: string;
    sector?: string;
    [key: string]: any;
  };
  min_order_qty: number;
  units_per_package: number;
  category_id?: string;
}
