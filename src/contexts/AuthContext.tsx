import React, { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/auth'
import { getEntitlement, setPlatformAccessToken } from '@/claude/practiceEngine'
import { toast } from 'sonner'
import { createAuthFreshnessGuard } from './authFreshnessGuard.mjs'

export interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: () => boolean
  plan: string
  hasPlan: (required: string) => boolean
  refreshEntitlement: () => Promise<void | boolean>
  signUp: (email: string, password: string, prenom: string, nom: string) => Promise<{ confirmationRequired: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
}

const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, student: 2, pro: 3 }
let supabasePromise: ReturnType<typeof importSupabase> | null = null

function importSupabase() {
  return import('@/integrations/supabase/client').then(({ supabase }) => supabase)
}

function loadSupabase() {
  supabasePromise ||= importSupabase().catch((error) => {
    supabasePromise = null
    throw error
  })
  return supabasePromise
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionRevision, setSessionRevision] = useState(0)
  // Authoritative paid plan from the server-side Stripe entitlement store.
  // This is the ONLY trusted source of a paid plan — never user_metadata.
  const [entitlementPlan, setEntitlementPlan] = useState<string | null>(null)
  const freshness = useRef(createAuthFreshnessGuard())

  // Publish the bearer before authenticated children can mount. An effect
  // depending on session ran after their first requests and could send a 401.
  useEffect(() => () => setPlatformAccessToken(null), [])

  // Récupérer le profil utilisateur
  const fetchProfile = async (userId: string) => {
    try {
      const supabase = await loadSupabase()
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
    let active = true
    let unsubscribe: (() => void) | null = null

    const applySession = (currentSession: Session | null) => {
      const accessToken = currentSession?.access_token || null
      const ticket = freshness.current.beginSession(accessToken)
      setPlatformAccessToken(accessToken)
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setProfile(null)
      setEntitlementPlan(null)
      setSessionRevision((revision) => revision + 1)

      if (!currentSession?.user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setTimeout(async () => {
        const profile = await fetchProfile(currentSession.user.id)
        if (!active || !freshness.current.isSessionCurrent(ticket)) return
        setProfile(profile)
        setIsLoading(false)
      }, 0)
    }

    const initialSessionTicket = freshness.current.captureSession()

    void loadSupabase().then((supabase) => {
      if (!active) return
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, currentSession) => {
          if (!active) return
          applySession(currentSession)
        }
      )
      unsubscribe = () => subscription.unsubscribe()

      // Vérification initiale de la session
      void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (!active || !freshness.current.isSessionCurrent(initialSessionTicket)) return
        applySession(currentSession)
      })
    }).catch((error) => {
      console.error('Erreur lors du chargement de Supabase:', error)
      if (active) setIsLoading(false)
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const refreshEntitlement = useCallback(async () => {
    const accessToken = session?.access_token
    const ticket = freshness.current.beginEntitlement(accessToken || null)
    setEntitlementPlan(null)
    if (!accessToken) {
      return false
    }
    try {
      const entitlement = await getEntitlement(accessToken) as { active?: boolean; plan?: string | null; reachable?: boolean }
      if (!freshness.current.isEntitlementCurrent(ticket)) return
      setEntitlementPlan(entitlement?.active && entitlement.plan ? String(entitlement.plan).toLowerCase() : null)
      return entitlement?.reachable !== false
    } catch {
      if (!freshness.current.isEntitlementCurrent(ticket)) return
      setEntitlementPlan(null)
      return false
    }
  }, [session?.access_token, sessionRevision])

  // The backend derives identity from the signed bearer token, never an email
  // supplied as a query parameter by the browser.
  useEffect(() => { void refreshEntitlement() }, [refreshEntitlement])

  const signUp = async (email: string, password: string, prenom: string, nom: string) => {
    try {
      const supabase = await loadSupabase()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            prenom,
            nom,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error

      return { confirmationRequired: !data.session }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      toast(error instanceof Error ? error.message : "Une erreur est survenue")
      throw error
    }

  }

  const requestPasswordReset = async (email: string) => {
    const supabase = await loadSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (password: string) => {
    const supabase = await loadSupabase()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = await loadSupabase()
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
      const supabase = await loadSupabase()
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
    // Operator authority must come from signed JWT app_metadata, matching the
    // backend verifier. A mutable profile row is display data, not RBAC.
    return user?.app_metadata?.role === 'admin';
  }

  // Paid access is granted only from the server-side billing entitlement.
  // Profile and signup metadata are intentionally never entitlement sources.
  const plan = (entitlementPlan || 'free').toLowerCase()

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
    refreshEntitlement,
    signUp,
    signIn,
    requestPasswordReset,
    updatePassword,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Vite removes this entire import from every production build. A local signed
// test session never changes the Supabase account or production auth rules.
const LocalPreviewAuthProvider = import.meta.env.DEV
  ? lazy(() => import('./LocalPreviewAuthProvider'))
  : null

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (import.meta.env.DEV && LocalPreviewAuthProvider && window.__TPL_LOCAL_PREVIEW_ENABLED__
    && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
    return (
      <Suspense fallback={<div role="status" style={{ padding: '3rem', color: '#f4f4f5', background: '#111113', minHeight: '100vh' }}>Ouverture de votre espace…</div>}>
        <LocalPreviewAuthProvider context={AuthContext} RealProvider={SupabaseAuthProvider}>
          {children}
        </LocalPreviewAuthProvider>
      </Suspense>
    )
  }
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
