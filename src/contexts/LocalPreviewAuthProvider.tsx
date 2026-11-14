import { useCallback, useEffect, useLayoutEffect, useState, type ComponentType, type Context, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/auth'
import type { AuthContextType } from './AuthContext'
import { setPlatformAccessToken } from '@/claude/practiceEngine'
import './localPreview.css'

type Mode = 'admin' | 'learner' | 'visitor' | 'real'
type Snapshot = { session: Session; profile: UserProfile; entitlement: { plan: string; status: string } }
const STORAGE = 'tpl.localPreview.role.v1'

function selectMode(mode: Mode) {
  try { window.localStorage.setItem(STORAGE, mode) } catch { /* In-memory mode still works when storage is blocked. */ }
  window.__TPL_LOCAL_PREVIEW_MODE__ = mode
  setPlatformAccessToken(null)
  if (mode === 'real') window.location.assign('/auth/login')
  else window.location.reload()
}

function PreviewToolbar({ mode, error, retry }: { mode: Mode; error?: string; retry: () => void }) {
  const label = mode === 'admin' ? 'Admin local · test' : mode === 'learner' ? 'Learner · test account' : mode === 'visitor' ? 'Visiteur · test' : 'Connexion réelle · test'
  return (
    <aside className="tpl-preview-toolbar" aria-label="Environnement de test local">
      <div className="tpl-preview-identity"><span className="tpl-preview-dot" /><strong>{label}</strong><span className="tpl-preview-detail">{mode === 'real' ? 'Authentification habituelle' : 'Données de test isolées'}</span></div>
      {error && <button type="button" onClick={retry} title={error}>Réessayer l’API</button>}
      <label className="tpl-preview-role"><span className="sr-only">Rôle de test</span><select aria-label="Rôle de test" value={mode} onChange={(event) => selectMode(event.target.value as Mode)}>
        <option value="admin">Admin local</option>
        <option value="learner">Tester un étudiant · gratuit</option>
        <option value="visitor">Tester en visiteur</option>
        <option value="real">Tester la connexion</option>
      </select></label>
    </aside>
  )
}

export default function LocalPreviewAuthProvider({ context: ContextProvider, RealProvider, children }: {
  context: Context<AuthContextType | undefined>
  RealProvider: ComponentType<{ children: ReactNode }>
  children: ReactNode
}) {
  const requested = window.__TPL_LOCAL_PREVIEW_MODE__
  const mode: Mode = requested === 'visitor' || requested === 'real' || requested === 'learner' ? requested : 'admin'
  const signedMode = mode === 'admin' || mode === 'learner'
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(signedMode)
  const bootstrap = useCallback(async () => {
    if (!signedMode) return
    setLoading(true)
    try {
      const response = await fetch(`/__dev/session${mode === 'learner' ? '?role=learner' : ''}`, { cache: 'no-store', signal: AbortSignal.timeout(60000) })
      if (!response.ok) throw new Error('L’API locale ne répond pas. Vérifie Python et les dépendances du backend, puis réessaie.')
      const next: Snapshot = await response.json()
      if (!next.session?.access_token || (mode === 'admin' && (next.entitlement?.plan !== 'pro' || next.entitlement?.status !== 'active'))) {
        throw new Error('La session de test n’a pas pu être vérifiée. Réessaie.')
      }
      setPlatformAccessToken(next.session.access_token)
      setSnapshot(next)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'L’API locale est indisponible. Réessaie.')
    } finally { setLoading(false) }
  }, [mode, signedMode])

  useEffect(() => {
    if (!signedMode) return
    void bootstrap()
    const interval = window.setInterval(() => { void bootstrap() }, 10 * 60 * 1000)
    const refresh = () => { void bootstrap() }
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refresh) }
  }, [bootstrap, mode, signedMode])

  useLayoutEffect(() => {
    if (mode === 'real') return
    setPlatformAccessToken(snapshot?.session.access_token || null)
    return () => setPlatformAccessToken(null)
  }, [mode, snapshot?.session.access_token])

  if (mode === 'real') {
    return <RealProvider>{children}<PreviewToolbar mode={mode} retry={() => undefined} /></RealProvider>
  }

  const useRealAuthentication = async () => { selectMode('real') }
  const value: AuthContextType = {
    user: snapshot?.session.user || null,
    profile: snapshot?.profile || null,
    session: snapshot?.session || null,
    isLoading: signedMode && loading && !snapshot,
    isAuthenticated: signedMode && !!snapshot,
    isAdmin: () => mode === 'admin' && !!snapshot,
    plan: signedMode && snapshot ? snapshot.entitlement.plan : 'free',
    hasPlan: (required) => (mode === 'admin' && !!snapshot) || required.toLowerCase() === 'free',
    refreshEntitlement: bootstrap,
    signUp: async () => { selectMode('real'); return { confirmationRequired: true } },
    signIn: useRealAuthentication,
    requestPasswordReset: useRealAuthentication,
    updatePassword: useRealAuthentication,
    signOut: async () => { selectMode('visitor') },
  }

  return (
    <ContextProvider.Provider value={value}>
      {signedMode && !snapshot ? (
        <main className="tpl-preview-start" aria-busy={loading}>
          <img src="/brand/thepricinglibrary.svg" alt="ThePricingLibrary" width="220" />
          <h1>{error ? 'L’espace de test est indisponible' : 'Ouverture de votre espace de test'}</h1>
          <p role={error ? 'alert' : 'status'}>{error || 'Préparation de la session admin et de vos données locales…'}</p>
          {error && <button type="button" onClick={() => { void bootstrap() }} disabled={loading}>{loading ? 'Nouvelle tentative…' : 'Réessayer'}</button>}
        </main>
      ) : children}
      <PreviewToolbar mode={mode} error={snapshot ? error : ''} retry={() => { void bootstrap() }} />
    </ContextProvider.Provider>
  )
}
