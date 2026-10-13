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

export type MagnetKey = 'paris' | 'japan' | 'london' | 'switzerland' | 'bali' | 'singapore' | 'goa'

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
    subtitle: 'Sunset Eiffel & Blossom',
    accentColor: '#E98267',
    secondaryColor: '#243447',
  },
  {
    key: 'japan',
    destination: 'Japan',
    title: 'Kyoto & Tokyo, Japan',
    subtitle: 'Mount Fuji & Red Pagoda',
    accentColor: '#DC2626',
    secondaryColor: '#1E293B',
  },
  {
    key: 'london',
    destination: 'London',
    title: 'London, UK',
    subtitle: 'Big Ben & Red Double Decker',
    accentColor: '#EF4444',
    secondaryColor: '#1E3A8A',
  },
  {
    key: 'switzerland',
    destination: 'Switzerland',
    title: 'Swiss Alps',
    subtitle: 'Alpine Peak, Chalet & Lake',
    accentColor: '#0284C7',
    secondaryColor: '#065F46',
  },
  {
    key: 'bali',
    destination: 'Bali',
    title: 'Bali, Indonesia',
    subtitle: 'Candi Bentar Gate & Palms',
    accentColor: '#10B981',
    secondaryColor: '#F59E0B',
  },
  {
    key: 'singapore',
    destination: 'Singapore',
    title: 'Singapore',
    subtitle: 'Marina Bay & Merlion',
    accentColor: '#3B82F6',
    secondaryColor: '#10B981',
  },
  {
    key: 'goa',
    destination: 'Goa',
    title: 'Goa, India',
    subtitle: 'Coastal Palm & Sunset Beach',
    accentColor: '#0EA5E9',
    secondaryColor: '#F59E0B',
  },
]
