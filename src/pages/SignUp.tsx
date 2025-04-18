
import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'

const SignUp = () => {
  const { t } = useTranslation()
  const { user, signUp } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
  })

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptedTerms) {
      return
    }
    
    setIsLoading(true)
    try {
      await signUp(formData.email, formData.password, formData.prenom, formData.nom)
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-finance-dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-finance-offwhite terminal-text">
            {t('auth.signup.title', 'Créer un compte')}
          </h1>
          <p className="text-finance-lightgray mt-2">
            {t('auth.signup.subtitle', 'Commencez votre voyage dans la finance quantitative')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-finance-lightgray mb-2">
                {t('auth.signup.firstname', 'Prénom')}
              </label>
              <Input
                type="text"
                required
                value={formData.prenom}
                onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                className="w-full bg-finance-dark border-finance-steel/30"
              />
            </div>
            <div>
              <label className="block text-sm text-finance-lightgray mb-2">
                {t('auth.signup.lastname', 'Nom')}
              </label>
              <Input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                className="w-full bg-finance-dark border-finance-steel/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-finance-lightgray mb-2">
              {t('auth.signup.email', 'Email')}
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
              {t('auth.signup.password', 'Mot de passe')}
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

          <div className="flex items-start">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              className="mt-1"
            />
            <label htmlFor="terms" className="ml-3 text-sm text-finance-lightgray">
              {t('auth.signup.terms', "J'accepte les")}
              {' '}
              <Link to="/terms" className="text-finance-accent hover:underline">
                {t('auth.signup.termsLink', 'conditions d\'utilisation')}
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !acceptedTerms}
            className="w-full finance-button"
          >
            {isLoading ? t('auth.signup.loading', 'Création en cours...') : t('auth.signup.submit', 'Créer mon compte')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-finance-lightgray">
          {t('auth.signup.loginPrompt', 'Déjà inscrit ?')}{' '}
          <Link to="/login" className="text-finance-accent hover:underline">
            {t('auth.signup.loginLink', 'Connectez-vous')}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignUp
