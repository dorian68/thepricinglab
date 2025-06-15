
import { useAuth } from '@/contexts/AuthContext'
import { UserPlan, UserRole } from '@/types/auth'
import { useCallback } from 'react'

type Feature = 
  | 'basic_courses'
  | 'survival_basic'
  | 'advanced_exercises'
  | 'ai_features'
  | 'report_generator'
  | 'advanced_tools'
  | 'quant_pro_tools'
  | 'vol_surface'
  | 'api_access'
  | 'custom_reports'
  | 'admin_dashboard'

const PLAN_FEATURES: Record<UserPlan, Feature[]> = {
  freemium: ['basic_courses', 'survival_basic'],
  basic: ['basic_courses', 'survival_basic', 'advanced_exercises', 'ai_features'],
  pro: ['basic_courses', 'survival_basic', 'advanced_exercises', 'ai_features', 'report_generator', 'advanced_tools', 'quant_pro_tools', 'vol_surface', 'api_access', 'custom_reports'],
  admin: ['basic_courses', 'survival_basic', 'advanced_exercises', 'ai_features', 'report_generator', 'advanced_tools', 'quant_pro_tools', 'vol_surface', 'api_access', 'custom_reports', 'admin_dashboard']
}

const ROLE_FEATURES: Record<UserRole, Feature[]> = {
  student: ['basic_courses', 'survival_basic', 'advanced_exercises'],
  pro: ['basic_courses', 'survival_basic', 'advanced_exercises', 'ai_features', 'report_generator', 'advanced_tools', 'quant_pro_tools', 'vol_surface', 'api_access', 'custom_reports'],
  admin: ['basic_courses', 'survival_basic', 'advanced_exercises', 'ai_features', 'report_generator', 'advanced_tools', 'quant_pro_tools', 'vol_surface', 'api_access', 'custom_reports', 'admin_dashboard']
}

export const usePermissions = () => {
  const { profile, user } = useAuth()

  const hasPermission = useCallback((feature: Feature): boolean => {
    if (!profile) return false
    
    // Check by role (from user metadata)
    const userRole = user?.user_metadata?.role as UserRole
    if (userRole && ROLE_FEATURES[userRole]?.includes(feature)) {
      return true
    }
    
    // Fallback to plan-based permissions
    return PLAN_FEATURES[profile.plan].includes(feature)
  }, [profile, user])

  const requirePermission = useCallback((feature: Feature): boolean => {
    const hasAccess = hasPermission(feature)
    if (!hasAccess) {
      // Rediriger vers la page des tarifs si l'utilisateur n'a pas accès
      window.location.href = '/pricing'
    }
    return hasAccess
  }, [hasPermission])

  const isProUser = useCallback((): boolean => {
    const userRole = user?.user_metadata?.role as UserRole
    return userRole === 'pro' || userRole === 'admin' || profile?.plan === 'pro' || profile?.plan === 'admin'
  }, [user, profile])

  const isAdminUser = useCallback((): boolean => {
    const userRole = user?.user_metadata?.role as UserRole
    return userRole === 'admin'
  }, [user])

  return {
    hasPermission,
    requirePermission,
    isProUser,
    isAdminUser
  }
}
