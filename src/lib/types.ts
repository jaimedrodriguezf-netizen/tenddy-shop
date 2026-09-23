export interface Tenant {
  id: string;
  slug: string;
  name: string;
  industry_type: string;
  logo_url: string;
  views_count?: number;
  theme_config: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family?: string;
    border_radius?: string;
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
  };
  settings: {
    currency: string;
    currency_symbol: string;
    enable_whatsapp_rfq?: boolean;
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
