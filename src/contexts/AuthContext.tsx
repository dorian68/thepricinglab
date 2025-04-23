
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { UserProfile } from '@/types/auth'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  signUp: (email: string, password: string, prenom: string, nom: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Récupérer le profil utilisateur
  const fetchProfile = async (userId: string) => {
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
  }

  // Initialiser la session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id).then(setProfile)
      }
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setProfile(profile)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, prenom: string, nom: string) => {
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

    if (error) {
      toast({
        title: "Erreur lors de l'inscription",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }

    toast({
      title: "Inscription réussie",
      description: "Bienvenue sur The Pricing Library !",
    })
    console.log("Inscription réussie");
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast({
        title: "Erreur lors de la connexion",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }

    toast({
      title: "Connexion réussie",
      description: "Bon retour parmi nous !",
    })
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Erreur lors de la déconnexion",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signUp, signIn, signOut }}>
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
