
import { type User } from '@supabase/supabase-js'

export type UserPlan = 'freemium' | 'basic' | 'pro' | 'admin'

export interface UserProfile {
  id: string
  email: string
  prenom: string | null
  nom: string | null
  plan: UserPlan
  date_inscription: string
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
}
