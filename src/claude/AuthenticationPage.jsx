import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSafeNavigate } from '../security/useSafeNavigate';
import { useAuth } from '../contexts/AuthContext';

export default function AuthenticationPage({ brand, mode = 'login' }) {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useSafeNavigate();
  const query = new URLSearchParams(location.search);
  const next = query.get('next');
  const plan = ['starter', 'student', 'pro'].includes(query.get('plan')) ? query.get('plan') : null;
  const destination = next === 'starter-kit' ? '/starter-kit' : next === 'checkout' ? '/pricing' : next === 'jobs' ? '/jobs' : '/dashboard';
  const continuation = next ? `?${new URLSearchParams({ next, ...(plan ? { plan } : {}) })}` : '';
  const login = mode === 'login';
  const signup = mode === 'signup';
  const forgot = mode === 'forgot-password';
  const reset = mode === 'reset-password';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [confirmation, setConfirmation] = useState(false);
  const resetUnavailable = reset && !auth.isLoading && !auth.session;

  async function submit(event) {
    event.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      if (forgot) {
        await auth.requestPasswordReset(email.trim());
        setNotice({ text: 'If this address has an account, a password reset link will arrive by email. Check your spam folder too.' });
      } else if (reset) {
        if (!auth.session) throw new Error('Open the password reset link from your email first.');
        await auth.updatePassword(password);
        await auth.signOut();
        setConfirmation(true);
        setNotice({ text: 'Your password has been updated. Log in with your new password.' });
      } else if (signup) {
        const [first, ...rest] = name.trim().split(/\s+/);
        const result = await auth.signUp(email.trim(), password, first, rest.join(' ') || '-');
        if (result.confirmationRequired) {
          setConfirmation(true);
          setNotice({ text: 'Check your email to confirm your free account, then log in. Check your spam folder if needed. No payment has been taken.' });
        } else navigate(destination);
      } else {
        await auth.signIn(email.trim(), password);
        navigate(destination);
      }
    } catch (error) {
      setNotice({ error: true, text: error?.code === 'invalid_credentials' ? 'Email or password does not match. Try again or reset your password.' : error?.message || 'We could not complete this request. Please try again.' });
    } finally { setBusy(false); }
  }

  return <div className="auth-layout">
    <section className="auth-form-pane">
      <div className="auth-form-inner">
        <Link to="/" className="brand" aria-label="The Pricing Library home">{brand}</Link>
        <h1>{forgot ? 'Reset your password.' : reset ? 'Choose a new password.' : login ? 'Welcome back.' : 'Create your free account.'}</h1>
        <p className="text-2">{forgot ? 'We will email you a secure link to recover access.' : reset ? 'Use at least eight characters for your new password.' : login ? 'Continue your courses and saved learning progress.' : 'No card required. Paid access activates only after a confirmed payment.'}</p>
        {signup && next === 'checkout' && plan && <p className="access-intent">Selected plan: <strong>{plan === 'pro' ? 'Professional' : plan}</strong>. You can review availability and the full price on the plans page after signing in.</p>}
        {notice && <div className={`form-notice ${notice.error ? 'error' : 'success'}`} role={notice.error ? 'alert' : 'status'}>{notice.text}</div>}
        {reset && auth.isLoading ? <p role="status">Checking your recovery link…</p> : resetUnavailable ? <p role="status">This recovery link is missing or has expired. <Link to="/auth/forgot-password">Request a new link</Link>.</p> : !confirmation && <form onSubmit={submit} className="col" style={{ gap: 18 }}>
          {signup && <label className="field" htmlFor="auth-name">Name<input id="auth-name" name="name" autoComplete="name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>}
          {!reset && <label className="field" htmlFor="auth-email">Email<input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
          {!forgot && <div className="field"><label htmlFor="auth-password">{reset ? 'New password' : 'Password'}</label><input id="auth-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={login ? 'current-password' : 'new-password'} minLength={login ? 1 : 8} required value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" className="btn btn-ghost btn-sm auth-password-toggle" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide password' : 'Show password'}</button></div>}
          {login && <Link to={`/auth/forgot-password${continuation}`} className="auth-recovery">Forgot password?</Link>}
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Please wait…' : forgot ? 'Send recovery link' : reset ? 'Update password' : login ? 'Log in' : 'Create free account'}</button>
        </form>}
        <p className="auth-switch">{login ? <>New here? <Link to={`/auth/signup${continuation}`}>Create a free account</Link></> : <Link to={`/auth/login${continuation}`}>Back to login</Link>}</p>
        <p className="auth-terms text-2">By creating an account, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</p>
      </div>
    </section>
    <aside className="auth-context-pane"><div className="section-eyebrow">FROM THEORY TO PRACTICE</div><h2>Your next result starts with a clear question.</h2><ol><li><strong>Learn the assumptions.</strong><span>Read a worked pricing or risk case.</span></li><li><strong>Reproduce the calculation.</strong><span>Control the inputs and compare the output.</span></li><li><strong>Build your judgement.</strong><span>Practise, review the correction and understand the limits.</span></li></ol><Link className="btn btn-outline" to="/tools/bs-pricer">Try Black-Scholes without an account</Link></aside>
  </div>;
}
