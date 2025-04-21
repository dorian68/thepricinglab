
import { useAuth } from '@/contexts/AuthContext'
import { UserPlan } from '@/types/auth'
import { useCallback } from 'react'

type Feature = 
  | 'basic_courses'
  | 'survival_basic'
  | 'advanced_exercises'
  | 'ai_features'
  | 'report_generator'
  | 'advanced_tools'

const PLAN_FEATURES: Record<UserPlan, Feature[]> = {
  freemium: ['basic_courses', 'survival_basic'],
  basic: ['basic_courses', 'survival_basic', 'advanced_exercises', 'ai_features'],
  pro: ['basic_courses', 'survival_basic', 'advanced_exercises', 'ai_features', 'report_generator', 'advanced_tools'],
  admin: ['basic_courses', 'survival_basic', 'advanced_exercises', 'ai_features', 'report_generator', 'advanced_tools']
}

export const usePermissions = () => {
  const { profile } = useAuth()

  const hasPermission = useCallback((feature: Feature): boolean => {
    if (!profile) return false
    return PLAN_FEATURES[profile.plan].includes(feature)
  }, [profile])

  const requirePermission = useCallback((feature: Feature): boolean => {
    const hasAccess = hasPermission(feature)
    if (!hasAccess) {
      // Rediriger vers la page des tarifs si l'utilisateur n'a pas accès
      window.location.href = '/pricing'
    }
    return hasAccess
  }, [hasPermission])

  return {
    hasPermission,
    requirePermission
  }
}
