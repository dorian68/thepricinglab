
import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import ModernNavbar from '@/components/ModernNavbar'
import Footer from '@/components/Footer'

const Login = () => {
  const { t } = useTranslation()
  const { user, signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn(formData.email, formData.password)
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-finance-dark">
      <ModernNavbar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-finance-offwhite terminal-text">
              {t('auth.login.title', 'Connexion')}
            </h1>
            <p className="text-finance-lightgray mt-2">
              {t('auth.login.subtitle', 'Content de vous revoir !')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-finance-lightgray mb-2">
                {t('auth.login.email', 'Email')}
              </label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-finance-dark border-finance-steel/30"
              />
            </div>

            <div>
              <label className="block text-sm text-finance-lightgray mb-2">
                {t('auth.login.password', 'Mot de passe')}
              </label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-finance-dark border-finance-steel/30"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full finance-button"
            >
              {isLoading ? t('auth.login.loading', 'Connexion...') : t('auth.login.submit', 'Se connecter')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-finance-lightgray">
            {t('auth.login.signupPrompt', 'Pas encore de compte ?')}{' '}
            <Link to="/signup" className="text-finance-accent hover:underline">
              {t('auth.login.signupLink', 'Inscrivez-vous')}
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Login
