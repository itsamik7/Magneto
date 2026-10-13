export type MagnetShape =
  | 'arch'
  | 'circle'
  | 'shield'
  | 'die-cut'
  | 'organic'
  | 'cityscape'
  | 'landscape'

export type DestinationCategory =
  | 'All'
  | 'City'
  | 'Natural Wonder'
  | 'Landmark'
  | 'Beach'
  | 'Mountain'
  | 'Island'
  | 'Cultural Heritage'
  | 'Historical Site'
  | 'Religious Destination'
  | 'Wildlife'
  | 'Adventure'
  | 'National Park'
  | 'Scenic Region'

export type Continent =
  | 'All'
  | 'Asia'
  | 'Europe'
  | 'Americas'
  | 'Africa'
  | 'Oceania'
  | 'Middle East'

export interface Country {
  id?: string
  name: string
  country_code: string
  continent: string
  flag_emoji?: string | null
  created_at?: string
}

export interface Destination {
  id?: string
  slug: string
  name: string
  country_id?: string
  city?: string | null
  region?: string | null
  continent: string
  destination_type: string
  short_description?: string | null
  landmark_names: string[]
  tags: string[]
  popularity_score: number
  is_featured: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface MagnetAsset {
  id?: string
  destination_id?: string
  asset_url: string
  thumbnail_url?: string | null
  asset_format?: string
  background_type?: string
  magnet_shape?: MagnetShape | string
  artwork_style?: string
  dominant_colors?: string[]
  generation_status?: string
  is_primary?: boolean
  created_at?: string
  updated_at?: string
}

export interface UserMagnet {
  id: string
  user_id: string
  destination_id: string
  magnet_asset_id: string
  trip_id?: string | null
  acquired_at: string
  created_at: string
  destination?: DestinationWithMagnet
}

export interface DestinationWithMagnet {
  id?: string
  slug: string
  name: string
  country_name: string
  country_code: string
  continent: string
  flag_emoji?: string
  city?: string
  region?: string
  destination_type: string
  short_description?: string
  landmark_names: string[]
  tags: string[]
  popularity_score: number
  is_featured: boolean
  magnet_shape: MagnetShape | string
  dominant_colors: string[]
  asset_url: string
  art_preset?: string
  magnet_asset_id?: string
  is_collected?: boolean
}

export interface CatalogQueryParams {
  search?: string
  continent?: Continent | string
  category?: DestinationCategory | string
  featuredOnly?: boolean
  sortBy?: 'popularity' | 'name' | 'featured'
  limit?: number
  offset?: number
}
