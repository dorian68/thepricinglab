
import { type User } from '@supabase/supabase-js'

export type UserPlan = 'free' | 'starter' | 'student' | 'pro'
export type UserRole = 'user' | 'moderator' | 'admin'

export interface UserProfile {
  id: string
  email: string
  prenom: string | null
  nom: string | null
  plan: UserPlan
  role: UserRole
  date_inscription: string
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
}
