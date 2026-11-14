import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  downloadStarterKit,
  getStarterKitAvailability,
  getStarterKitManifest,
  startStarterKitCheckout,
} from './practiceEngine';

const DELIVERABLES = [
  ['01', 'Notebook Black-Scholes & Greeks', 'IPYNB exécuté, HTML accessible et tests golden'],
  ['02', 'Dashboard Excel de pricing', 'Inputs auditables, contrôles et cas golden'],
  ['03', 'Notebook VaR, P&L & stress', 'IPYNB exécuté, HTML et dataset synthétique'],
  ['04', "30 questions d'entretien", 'PDF 12 pages, corrigés, pièges et barème'],
  ['05', 'Pack carrière', 'Modèle CV Markdown, README GitHub, publication LinkedIn et exemple'],
  ['06', "Vidéo d'accompagnement", 'MP4 720p, sous-titres français et transcription'],
  ['07', 'Accès Q&A borné', '30 jours, cinq fils et délais de réponse documentés'],
];

function Notice({ type = 'info', children }) {
  const color = type === 'error' ? 'var(--red)' : type === 'success' ? 'var(--green)' : 'var(--blue)';
  return <div className="panel" style={{ padding: '13px 16px', borderColor: color, fontSize: 13 }} data-notice={type}>{children}</div>;
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return 'taille vérifiée au téléchargement';
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function StarterKitPage({ salesGuard, returnStatus = null }) {
  const auth = useAuth();
  const token = auth?.session?.access_token || null;
  const [availability, setAvailability] = useState({ loading: true, sale_ready: false, reachable: null });
  const [access, setAccess] = useState({ state: token ? 'checking' : 'signed-out', manifest: null });
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);

  const frontendReady = Boolean(salesGuard?.legalReady && salesGuard?.sourceRightsCleared && salesGuard?.salesEnabled && salesGuard?.priceEur);
  const releaseReady = availability.artifact_ready === true || access.manifest?.ready === true;
  const canSell = frontendReady && !availability.loading && availability.sale_ready === true && availability.checkout_configured === true && releaseReady;
  const releaseLabel = releaseReady ? '7/7 vérifiés' : availability.loading ? 'Vérification en cours' : 'Disponibilité à vérifier';

  useEffect(() => {
    let active = true;
    getStarterKitAvailability().then((value) => {
      if (active) setAvailability({ ...value, loading: false });
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!token) {
      setAccess({ state: 'signed-out', manifest: null });
      return () => { active = false; };
    }
    const check = async () => {
      setAccess((current) => ({ ...current, state: 'checking' }));
      const attempts = returnStatus === 'success' ? 5 : 1;
      for (let attempt = 0; attempt < attempts && active; attempt += 1) {
        try {
          const manifest = await getStarterKitManifest(token);
          if (active) setAccess({ state: 'owned', manifest });
          return;
        } catch (error) {
          if (error?.status === 403 && attempt + 1 < attempts) {
            await new Promise((resolve) => window.setTimeout(resolve, 1500));
            continue;
          }
          if (!active) return;
          if (error?.status === 403) setAccess({ state: returnStatus === 'success' ? 'pending' : 'not-owned', manifest: null });
          else if (error?.status === 503) setAccess({ state: 'release-unavailable', manifest: null });
          else setAccess({ state: 'offline', manifest: null });
          return;
        }
      }
    };
    void check();
    return () => { active = false; };
  }, [token, returnStatus]);

  const statusNotice = useMemo(() => {
    if (returnStatus === 'cancel') return { type: 'info', text: "Le paiement a été annulé. Aucun droit produit n'a été créé." };
    if (returnStatus === 'success' && access.state === 'signed-out') return { type: 'info', text: "Reconnectez-vous avec le compte utilisé au paiement pour synchroniser le droit créé par le webhook signé." };
    if (access.state === 'owned') return { type: 'success', text: `Votre Starter Kit v${access.manifest?.version || '1.0.0'} est actif et prêt à télécharger.` };
    if (access.state === 'pending') return { type: 'info', text: "Paiement revenu avec succès ; le webhook signé n'a pas encore activé votre accès. Réessayez dans quelques instants ou contactez le support avec le reçu Stripe." };
    if (access.state === 'release-unavailable') return { type: 'error', text: "Votre droit existe, mais la release vérifiée est momentanément indisponible. Aucun fichier incomplet ne sera livré." };
    if (access.state === 'offline') return { type: 'error', text: "Le service produit n'est pas joignable. Aucun paiement ou téléchargement n'est simulé." };
    return null;
  }, [access, returnStatus]);

  async function checkout() {
    setNotice(null);
    if (!canSell) {
      setNotice({ type: 'error', text: "La vente reste verrouillée tant que l'identité légale, le prix public, Stripe et la release 7/7 ne sont pas tous validés." });
      return;
    }
    if (!token) return;
    setBusy('checkout');
    try {
      const session = await startStarterKitCheckout(token);
      if (!session?.url || session?.mode !== 'payment') throw new Error('Le backend n’a pas retourné un checkout one-shot valide.');
      window.location.assign(session.url);
    } catch (error) {
      setNotice({ type: 'error', text: error?.message || 'Checkout indisponible.' });
    } finally {
      setBusy(null);
    }
  }

  async function download() {
    setNotice(null);
    setBusy('download');
    try {
      const file = await downloadStarterKit(token);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice({ type: 'success', text: `Téléchargement vérifié lancé : ${file.filename}.` });
    } catch (error) {
      setNotice({ type: 'error', text: error?.message || 'Téléchargement indisponible.' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="container page" data-starter-kit-state={access.state}>
      <div className="crumb"><RouterLink to="/pricing">/ pricing</RouterLink><i>›</i><span>/ starter kit</span></div>
      <section className="panel" style={{ padding: '34px 34px 30px', marginBottom: 18, background: 'linear-gradient(115deg, rgba(255,46,69,.10), rgba(13,17,24,.96) 58%)' }}>
        <div className="row between" style={{ gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 720 }}>
            <div className="label" style={{ color: 'var(--red)', marginBottom: 12 }}>MARKET FINANCE STARTER KIT</div>
            <h1 className="mono" style={{ fontSize: 'clamp(30px,5vw,52px)', lineHeight: 1.05, margin: 0 }}>Du modèle au livrable défendable.</h1>
            <p className="text-2" style={{ fontSize: 16, lineHeight: 1.75, margin: '18px 0 0', maxWidth: 680 }}>Un workflow pratique pour construire, contrôler et présenter un projet de pricing et de risque — avec résultats reproductibles, limites de modèle et artefacts réutilisables.</p>
          </div>
          <div style={{ minWidth: 185, textAlign: 'right' }}>
            <span className="badge" data-release-ready={releaseReady ? 'true' : 'false'}>{releaseLabel}</span>
            {salesGuard?.priceEur ? <div className="mono" style={{ fontSize: 28, fontWeight: 700, marginTop: 16 }}>{salesGuard.priceEur} € TTC</div> : null}
            <div className="mute" style={{ fontSize: 11, marginTop: 4 }}>paiement unique · licence personnelle</div>
          </div>
        </div>
      </section>

      {statusNotice ? <div style={{ marginBottom: 14 }}><Notice type={statusNotice.type}>{statusNotice.text}</Notice></div> : null}
      {notice ? <div style={{ marginBottom: 14 }}><Notice type={notice.type}>{notice.text}</Notice></div> : null}

      <div className="grid-2" style={{ alignItems: 'stretch', marginBottom: 22 }}>
        <section className="panel" style={{ padding: 24 }}>
          <div className="label">VOTRE ACCÈS</div>
          {access.state === 'checking' ? <p className="mono mute" data-access-loading="true">Vérification du droit produit…</p> : null}
          {access.state === 'owned' ? (
            <>
              <h2 className="mono" style={{ fontSize: 20, margin: '12px 0 6px' }}>Release v{access.manifest?.version}</h2>
              <p className="mute" style={{ marginTop: 0 }}>{formatBytes(access.manifest?.size_bytes)} · SHA-256 contrôlé côté serveur</p>
              <button className="btn btn-primary" type="button" onClick={download} disabled={busy === 'download'} data-product-download="true">{busy === 'download' ? 'Préparation…' : 'Télécharger le bundle vérifié'}</button>
            </>
          ) : access.state === 'signed-out' ? (
            <>
              <h2 className="mono" style={{ fontSize: 20, margin: '12px 0 6px' }}>Compte requis</h2>
              <p className="mute">Connectez-vous pour retrouver votre achat et télécharger vos fichiers depuis votre compte.</p>
              <RouterLink className="btn btn-outline" to="/auth/signup?next=starter-kit">Créer un compte</RouterLink>
              <RouterLink className="btn btn-ghost" to="/auth/login?next=starter-kit">J’ai déjà un compte</RouterLink>
            </>
          ) : (
            <>
              <h2 className="mono" style={{ fontSize: 20, margin: '12px 0 6px' }}>{canSell ? 'Disponible à l’achat' : 'Vente verrouillée'}</h2>
              <p className="mute">{canSell ? 'Le prix total et le récapitulatif apparaîtront dans Stripe avant confirmation.' : 'Le produit reste en pilote jusqu’à validation simultanée de la release, du paiement et des informations légales.'}</p>
              <button className="btn btn-primary" type="button" onClick={checkout} disabled={!canSell || busy === 'checkout'} data-product-checkout="true">{busy === 'checkout' ? 'Redirection…' : canSell ? 'Acheter le Starter Kit' : 'Achat non disponible'}</button>
            </>
          )}
        </section>

        <section className="panel" style={{ padding: 24 }}>
          <div className="label">CONTRÔLES DE CONFIANCE</div>
          <div className="col" style={{ gap: 10, marginTop: 14 }}>
            {[
              [!availability.loading && availability.reachable === true, 'Service produit joignable'],
              [availability.checkout_configured === true, 'Checkout one-shot configuré'],
              [releaseReady, 'Bundle 7/7 et SHA-256 validés'],
              [salesGuard?.legalReady, 'Identité légale complète'],
              [salesGuard?.sourceRightsCleared, 'Droits des sources validés'],
              [salesGuard?.salesEnabled, 'Activation commerciale explicite'],
            ].map(([ok, label]) => <div className="row" style={{ gap: 10 }} key={label}><span className="mono" style={{ color: ok ? 'var(--green)' : 'var(--mute)' }}>{ok ? 'PASS' : 'WAIT'}</span><span>{label}</span></div>)}
          </div>
        </section>
      </div>

      <section>
        <div className="row between" style={{ alignItems: 'baseline', marginBottom: 12 }}><div><div className="label">CONTENU PRÉVU</div><h2 className="mono" style={{ margin: '8px 0 0' }}>Sept livrables pour votre projet.</h2></div><span className="mono mute">{releaseLabel}</span></div>
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {DELIVERABLES.map(([number, title, detail]) => {
            const complete = releaseReady;
            return <article className="panel" style={{ padding: 20, borderColor: complete ? 'var(--line)' : 'rgba(255,46,69,.45)' }} key={number} data-deliverable={number}><div className="row between"><span className="mono" style={{ color: 'var(--red)', fontSize: 11 }}>{number} / 07</span><span className="mono" style={{ color: complete ? 'var(--green)' : 'var(--red)', fontSize: 10 }}>{complete ? 'VÉRIFIÉ' : 'À VÉRIFIER'}</span></div><h3 className="mono" style={{ fontSize: 14, margin: '12px 0 6px' }}>{title}</h3><p className="mute" style={{ fontSize: 12.5, margin: 0 }}>{detail}</p></article>;
          })}
        </div>
      </section>

      <section className="panel" style={{ padding: 24, marginBottom: 36 }}>
        <div className="label">CAS GOLDEN REPRODUCTIBLE</div>
        <div className="grid-2" style={{ marginTop: 14 }}><div className="mono" style={{ lineHeight: 1.8 }}>S = K = 100<br/>r = 2% · σ = 20%<br/>T = 0,5 an · q = 0</div><div><div className="mute" style={{ fontSize: 11 }}>CALL BLACK-SCHOLES</div><div className="mono" style={{ color: 'var(--green)', fontSize: 28, fontWeight: 700 }}>6.120654</div><div className="mute" style={{ fontSize: 11, marginTop: 8 }}>DELTA</div><div className="mono" style={{ color: 'var(--green)', fontSize: 28, fontWeight: 700 }}>0.556231</div></div></div>
        <p className="mute" style={{ fontSize: 12, marginBottom: 0 }}>Produit éducatif. Données synthétiques ou fournies par l’utilisateur ; aucun chiffre n’est présenté comme une donnée de marché live ou un conseil en investissement.</p>
      </section>
    </div>
  );
}
