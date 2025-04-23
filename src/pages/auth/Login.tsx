
import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const Login = () => {
  const { t } = useTranslation()
  const { user, signIn, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  if (isAuthenticated) {
    console.log("Login: User is authenticated, redirecting to dashboard")
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn(formData.email, formData.password)
      toast.success(t('auth.login.success', 'Connexion réussie'))
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      toast.error(t('auth.login.error', 'Erreur de connexion. Veuillez vérifier vos identifiants.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-finance-dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-finance-offwhite terminal-text">
            {t('auth.login.title', 'Connexion')}
          </h1>
          <p className="text-finance-lightgray mt-2">
            {t('auth.login.subtitle', 'Content de vous revoir !')}
          </p>
        </div>

        <div className="bg-finance-charcoal/50 backdrop-blur-sm p-8 rounded-lg border border-finance-steel/20 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-finance-lightgray mb-2">
                {t('auth.login.email', 'Email')}
              </label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-finance-dark/50 border-finance-steel/30"
                placeholder={t('auth.login.emailPlaceholder', 'Votre adresse email')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-finance-lightgray mb-2">
                {t('auth.login.password', 'Mot de passe')}
              </label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-finance-dark/50 border-finance-steel/30"
                placeholder={t('auth.login.passwordPlaceholder', '••••••••')}
              />
            </div>

            <div className="flex items-center justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm text-finance-accent hover:text-finance-accent/80 transition-colors"
              >
                {t('auth.login.forgotPassword', 'Mot de passe oublié ?')}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full finance-button"
            >
              {isLoading 
                ? t('auth.login.loading', 'Connexion...') 
                : t('auth.login.submit', 'Se connecter')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-finance-lightgray">
            {t('auth.login.signupPrompt', 'Pas encore de compte ?')}{' '}
            <Link 
              to="/signup" 
              className="text-finance-accent hover:text-finance-accent/80 transition-colors"
            >
              {t('auth.login.signupLink', "S'inscrire")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
