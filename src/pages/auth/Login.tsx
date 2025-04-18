
import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {
  const { t } = useTranslation()
  const { user, signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-finance-dark">
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
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-finance-dark border-finance-steel/30 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-finance-lightgray"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
  )
}

export default Login
