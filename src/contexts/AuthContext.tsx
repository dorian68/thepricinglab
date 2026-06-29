import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { UserProfile } from '@/types/auth'
import { getEntitlement } from '@/claude/practiceEngine'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: () => boolean
  plan: string
  hasPlan: (required: string) => boolean
  signUp: (email: string, password: string, prenom: string, nom: string, plan?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, student: 2, pro: 3 }

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Authoritative paid plan from the server-side Stripe entitlement store.
  // This is the ONLY trusted source of a paid plan — never user_metadata.
  const [entitlementPlan, setEntitlementPlan] = useState<string | null>(null)

  // Récupérer le profil utilisateur
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Erreur lors de la récupération du profil:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Erreur inattendue lors de la récupération du profil:', error)
      return null
    }
  }

  // Initialiser la session et configurer les listeners d'auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        
        // Utilisation de setTimeout pour éviter le deadlock avec Supabase
        if (currentSession?.user) {
          setTimeout(async () => {
            const profile = await fetchProfile(currentSession.user.id)
            setProfile(profile)
            setIsLoading(false)
          }, 0)
        } else {
          setProfile(null)
          setIsLoading(false)
        }
      }
    )

    // Vérification initiale de la session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).then(profile => {
          setProfile(profile)
          setIsLoading(false)
        })
      } else {
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Resolve the real Stripe entitlement from the backend whenever the signed-in
  // email changes. A paid plan is granted ONLY if the server says it is active —
  // closing the self-grant hole where a user picked a plan at signup.
  useEffect(() => {
    const email = user?.email
    if (!email) {
      setEntitlementPlan(null)
      return
    }
    let alive = true
    getEntitlement(email)
      .then((e: { active?: boolean; plan?: string | null }) => {
        if (alive) setEntitlementPlan(e && e.active && e.plan ? String(e.plan).toLowerCase() : null)
      })
      .catch(() => { if (alive) setEntitlementPlan(null) })
    return () => { alive = false }
  }, [user?.email])

  const signUp = async (email: string, password: string, prenom: string, nom: string, plan: string = 'free') => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            prenom,
            nom,
            plan,
          },
        },
      })

      if (error) throw error

      toast("Inscription réussie! Bienvenue sur The Pricing Library !")
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      toast(error instanceof Error ? error.message : "Une erreur est survenue")
      throw error
    }

    toast("Inscription réussie! Bienvenue sur The Pricing Library !")
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast("Connexion réussie! Bon retour parmi nous !")
    } catch (error) {
      console.error("Erreur lors de la connexion:", error)
      toast(error instanceof Error ? error.message : "Une erreur est survenue")
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast("Déconnexion réussie. À bientôt !")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      toast(error instanceof Error ? error.message : "Une erreur est survenue")
      throw error
    }
  }

  // Helper function to check if user is admin
  const isAdmin = () => {
    return profile?.role === 'admin';
  }

  // Effective plan, in trust order: the server Stripe entitlement (paid, real),
  // then an admin/DB-set profiles.plan, else free. We deliberately do NOT read
  // user_metadata.plan — it is user-chosen at signup and would grant paid tiers
  // for free. A paying user gets access via the entitlement; an admin via isAdmin.
  const plan = (
    entitlementPlan ||
    (profile as unknown as { plan?: string })?.plan ||
    'free'
  ).toLowerCase()

  const hasPlan = (required: string) => {
    if (isAdmin()) return true
    return (PLAN_RANK[plan] ?? 0) >= (PLAN_RANK[required.toLowerCase()] ?? 99)
  }

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!session,
    isAdmin,
    plan,
    hasPlan,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
