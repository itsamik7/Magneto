import type { Database } from './database'

export type TripRow = Database['public']['Tables']['trips']['Row']
export type TripInsert = Database['public']['Tables']['trips']['Insert']
export type TripUpdate = Database['public']['Tables']['trips']['Update']

export type MagnetUnlockState = 'dreaming' | 'saving' | 'ready_to_go'

export interface TripWithStats extends TripRow {
  total_saved_minor: number
  amount_remaining_minor: number
  progress_percentage: number
  unlock_state: MagnetUnlockState
  deposit_count: number
}

export type MagnetKey = 'paris' | 'japan' | 'goa' | 'switzerland' | 'london' | 'bali'

export interface BuiltInMagnet {
  key: MagnetKey
  destination: string
  title: string
  subtitle: string
  accentColor: string
  secondaryColor: string
}

export const BUILT_IN_MAGNETS: BuiltInMagnet[] = [
  {
    key: 'paris',
    destination: 'Paris',
    title: 'Paris, France',
    subtitle: 'Eiffel Tower Souvenir',
    accentColor: '#E98267',
    secondaryColor: '#243447',
  },
  {
    key: 'japan',
    destination: 'Japan',
    title: 'Kyoto & Tokyo, Japan',
    subtitle: 'Mount Fuji & Torii Gate',
    accentColor: '#DC2626',
    secondaryColor: '#1E293B',
  },
  {
    key: 'goa',
    destination: 'Goa',
    title: 'Goa, India',
    subtitle: 'Coastal Palm & Wave',
    accentColor: '#0EA5E9',
    secondaryColor: '#F59E0B',
  },
  {
    key: 'switzerland',
    destination: 'Switzerland',
    title: 'Swiss Alps',
    subtitle: 'Alpine Peak Souvenir',
    accentColor: '#EF4444',
    secondaryColor: '#047857',
  },
  {
    key: 'london',
    destination: 'London',
    title: 'London, UK',
    subtitle: 'Big Ben Clock Tower',
    accentColor: '#3B82F6',
    secondaryColor: '#B45309',
  },
  {
    key: 'bali',
    destination: 'Bali',
    title: 'Bali, Indonesia',
    subtitle: 'Tropical Candi Bentar Gate',
    accentColor: '#10B981',
    secondaryColor: '#8B5CF6',
  },
]
