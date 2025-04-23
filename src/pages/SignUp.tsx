
import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const SignUp = () => {
  const { t } = useTranslation()
  const { isAuthenticated, signUp } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
  })

  if (isAuthenticated) {
    console.log("SignUp: User is authenticated, redirecting to dashboard")
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptedTerms) {
      toast.error("Veuillez accepter les conditions d'utilisation")
      return
    }
    
    setIsLoading(true)
    try {
      await signUp(formData.email, formData.password, formData.prenom, formData.nom)
      toast.success(t('auth.signup.success', 'Inscription réussie!'))
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-finance-dark">      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-finance-offwhite terminal-text">
              {t('auth.signup.title', 'Créer un compte')}
            </h1>
            <p className="text-finance-lightgray mt-2">
              {t('auth.signup.subtitle', 'Commencez votre voyage dans la finance quantitative')}
            </p>
          </div>

          <div className="bg-finance-charcoal/50 backdrop-blur-sm p-8 rounded-lg border border-finance-steel/20 shadow-xl">
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
                    className="w-full bg-finance-dark/50 border-finance-steel/30"
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
                    className="w-full bg-finance-dark/50 border-finance-steel/30"
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
                  className="w-full bg-finance-dark/50 border-finance-steel/30"
                />
              </div>

              <div>
                <label className="block text-sm text-finance-lightgray mb-2">
                  {t('auth.signup.password', 'Mot de passe')}
                </label>
                <Input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-finance-dark/50 border-finance-steel/30"
                />
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
      </div>
    </div>
  )
}

export default SignUp
