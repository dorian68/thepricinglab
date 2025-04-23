
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { UserProfile } from '@/types/auth'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, prenom: string, nom: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

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
    // Configuration du listener d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        
        // Utilisation de setTimeout pour éviter le deadlock avec Supabase
        if (currentSession?.user) {
          setTimeout(async () => {
            const profile = await fetchProfile(currentSession.user.id)
            setProfile(profile)
          }, 0)
        } else {
          setProfile(null)
        }
        
        setIsLoading(false)
      }
    )

    // Vérification initiale de la session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).then(setProfile)
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, prenom: string, nom: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            prenom,
            nom,
          },
        },
      })

      if (error) throw error

      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur The Pricing Library !",
      })
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      toast({
        title: "Erreur lors de l'inscription",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Connexion réussie",
        description: "Bon retour parmi nous !",
      })
    } catch (error) {
      console.error("Erreur lors de la connexion:", error)
      toast({
        title: "Erreur lors de la connexion",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      })
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      toast({
        title: "Erreur lors de la déconnexion",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
      throw error
    }
  }

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!session,
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
