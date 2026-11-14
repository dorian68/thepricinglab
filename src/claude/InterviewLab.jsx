import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, ChevronLeft, Clock3, Download, Lightbulb, LockKeyhole, RotateCcw, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPracticeApiBase } from './practiceEngine';
import { interviewAuthLink } from '../lib/interviewNavigation.mjs';
import './interviewLab.css';

const taskLink = (task) => `/interview/${encodeURIComponent(task?.case_id || task?.id || 'call-quote')}?variant=${task?.variant === 'transfer' ? 'transfer' : 'primary'}`;
const format = (value) => typeof value === 'number' ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value) : String(value ?? '');
const makeId = () => crypto.randomUUID();
const emptyMetrics = { cases_attempted: 0, numerical_passes: 0, transfer_passes: 0, reasoning_reviews: 0, active_seconds: 0 };
const ticketRows = (ticket = {}) => [
  ['Option', ticket.optionType === 'put' ? 'European put' : 'European call'],
  ['Spot', `${format(ticket.spot)} ${ticket.currency || 'USD'}`],
  ['Strike', `${format(ticket.strike)} ${ticket.currency || 'USD'}`],
  ['Time to expiry', `${format(ticket.maturityYears)} ${ticket.maturityYears === 1 ? 'year' : 'years'} · ACT/365F`],
  ['Risk-free rate', `${format(100 * ticket.riskFreeRate)}% · continuous`],
  ['Dividend yield', `${format(100 * ticket.dividendYield)}% · continuous`],
  ['Annual volatility', `${format(100 * ticket.volatility)}%`],
  ['Position', `${ticket.position || 'long'} · ${format(ticket.quantity)} × ${format(ticket.multiplier)} units`],
];

async function callInterview(path, token, body, method = body ? 'POST' : 'GET', options = {}) {
  let response;
  try { response = await fetch(`${getPracticeApiBase()}/interview${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
    ...options,
  }); } catch { throw new Error('The practice service did not respond. Your current answers are kept on this device. Please retry.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = response.status === 401 ? 'Sign in to save your work and continue the path.'
      : response.status === 403 ? 'Verify your account to access the full pilot. The first case is free to try.'
      : response.status === 429 ? 'Please wait a moment before trying again.'
      : response.status >= 500 ? 'Practice is temporarily unavailable. Your current answers are kept on this device. Please retry.'
      : typeof data.detail === 'string' ? data.detail
      : Array.isArray(data.detail) ? data.detail.slice(0, 2).map(item => item.msg || 'Invalid input').join(' ') : 'Check your answers and reasoning, then try again.';
    const error = new Error(message); error.status = response.status; throw error;
  }
  return data;
}

function Metrics({ metrics = emptyMetrics }) {
  const rows = [
    ['Cases attempted', metrics.cases_attempted ?? 0, 'of 6'],
    ['Independent checks passed', metrics.numerical_passes ?? 0, 'calculation'],
    ['Transfer checks passed', metrics.transfer_passes ?? 0, 'changed concept'],
    ['Reasoning self-reviewed', metrics.reasoning_reviews ?? 0, 'your assessment'],
  ];
  return <div className="il-metrics" aria-label="Recorded practice outcomes">{rows.map(([label, value, detail]) => <div key={label}><strong>{value}</strong><span>{label}</span><small>{detail}</small></div>)}</div>;
}

function Onboarding({ value, token, onSaved }) {
  const [form, setForm] = useState(value || { role: 'sales_trading', deadline: '', minutes_per_session: 30 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { if (value) setForm(value); }, [value]);
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      if (!token) { setMessage('Your suggested first session is ready below. Sign in to save a plan across devices.'); return; }
      const result = await callInterview('/onboarding', token, { role: form.role, deadline: form.deadline || null, minutes_per_session: Number(form.minutes_per_session) });
      onSaved(result.onboarding); setMessage('Your plan is saved. Start with a quote and explain how you would hedge it.');
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  };
  return <form className="il-plan" onSubmit={save}>
    <div className="il-eyebrow"><Target size={14}/>Your first session</div>
    <h2>One goal. A clear next step.</h2>
    <div className="il-plan-fields">
      <label>Target role<select aria-label="Target role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="sales_trading">Sales & trading</option><option value="structuring">Derivatives structuring</option><option value="market_risk">Market risk</option></select></label>
      <label>Interview date <span className="il-muted">(optional)</span><input aria-label="Interview date" type="date" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })}/></label>
      <label>Time per session<select aria-label="Time per session" value={form.minutes_per_session} onChange={e => setForm({ ...form, minutes_per_session: Number(e.target.value) })}>{[15, 30, 45, 60].map(m => <option key={m} value={m}>{m} minutes</option>)}</select></label>
    </div>
    <p className="il-muted">{Number(form.minutes_per_session) === 15 ? 'Today: attempt one quote, then review the calculation. Next session: test a changed assumption.' : 'Today: quote an option, review the hedge, then try a changed assumption. Continue the six-case path over your next sessions.'} This practice targets bank derivatives interviews.</p>
    <div className="il-actions"><button className="btn btn-outline" disabled={saving}>{saving ? 'Saving…' : token ? 'Save my plan' : 'Use this plan'}</button><Link className="btn btn-primary" to="/interview/call-quote">Try the first case <ArrowRight size={15}/></Link></div>
    {message && <p className="il-status" role="status">{message}</p>}
  </form>;
}

function Feedback({ attempt, task, token, onReviewed, onError }) {
  const feedback = attempt.feedback || {};
  const [criteria, setCriteria] = useState((attempt.self_review || attempt.review)?.criteria || { assumptions: false, decision: false, limitations: false });
  const [notes, setNotes] = useState((attempt.self_review || attempt.review)?.notes || '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(!!attempt.review || attempt.reasoning_reviewed === true);
  const numericalPass = attempt.numerical_pass ?? feedback.numerical_pass ?? false;
  const review = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      await callInterview(`/attempts/${encodeURIComponent(attempt.id)}/review`, token, { criteria, notes, client_request_id: makeId() });
      setSaved(true); onReviewed();
    } catch (error) { onError(error.message); }
    finally { setBusy(false); }
  };
  return <section className="il-feedback" aria-label="Your submitted attempt and correction" data-interview-feedback>
    <div className="il-feedback-title"><CheckCircle2 size={23}/><div><h2>{attempt.reference_only ? 'Reference opened for study' : numericalPass ? 'Your numerical answer checks out.' : 'Compare your answer with the calculation.'}</h2><p>{attempt.independent ? 'First recorded attempt, with no correction opened on this account. Practice is not proctored.' : token ? 'This is a reviewed attempt. It does not count as a new independent pass.' : 'Preview result — not saved to an account.'}</p></div></div>
    {!attempt.reference_only && <details className="il-disclosure"><summary>Your submitted reasoning</summary><p className="il-preserve">{attempt.reasoning}</p></details>}
    <div className="il-checks">{(feedback.checks || []).map(check => <div className={`il-check ${check.passed ? 'passed' : ''}`} key={check.id}>
      <div><strong>{check.label || check.id}</strong><span>{check.passed ? 'Within tolerance' : attempt.reference_only ? 'Reference' : 'Review this'}</span></div>
      <dl><div><dt>Your answer</dt><dd>{attempt.reference_only ? '—' : format(check.submitted)} {check.unit}</dd></div><div><dt>Calculated answer</dt><dd>{format(check.expected)} {check.unit}</dd></div></dl>
      <p>{check.explanation}</p><small>Accepted absolute difference: {format(check.tolerance_abs)} {check.unit}</small>
    </div>)}</div>
    <div className="il-worked"><h3>How to defend the answer</h3>{typeof feedback.worked_solution === 'string' ? <p className="il-preserve">{feedback.worked_solution}</p> : Array.isArray(feedback.worked_solution) ? feedback.worked_solution.map((line, i) => <p key={i}>{typeof line === 'string' ? line : JSON.stringify(line)}</p>) : null}</div>
    {!attempt.reference_only && <form className="il-review" onSubmit={review}>
      <h3>Now review your reasoning</h3><p className="il-muted">The engine checks the numbers. These checks record your own review of the explanation; they are not an expert grade or a hiring certification.</p>
      {(task.rubric || [{ id: 'assumptions', label: 'I stated the relevant assumptions and units.' }, { id: 'decision', label: 'I connected the result to a hedge or desk decision.' }, { id: 'limitations', label: 'I explained a limitation of the calculation.' }]).map(item => <label className="il-checkbox" key={item.id}><input type="checkbox" checked={!!criteria[item.id]} onChange={e => { setCriteria({ ...criteria, [item.id]: e.target.checked }); setSaved(false); }}/><span>{item.label}</span></label>)}
      <label className="il-review-notes">What will you explain more clearly next time?<textarea rows={3} maxLength={2000} value={notes} onChange={e => { setNotes(e.target.value); setSaved(false); }} placeholder="For example: distinguish an option delta from the number of shares in the hedge."/></label>
      {token ? <button type="submit" className="btn btn-outline" disabled={busy}>{busy ? 'Saving…' : saved ? 'Self-review saved' : 'Save self-review'} {saved && <Check size={15}/>}</button> : <p className="il-muted"><Link to={interviewAuthLink('signup', task.id, task.variant)}>Create an account</Link> to save future attempts and self-review. This preview result is not transferred to an account.</p>}
    </form>}
    <div className="il-next"><div><span className="il-eyebrow">Test the idea, not your memory</span><h3>{task.variant === 'transfer' ? 'Continue your preparation' : 'A different assumption. A fresh answer.'}</h3><p className="il-muted">{task.variant === 'transfer' ? 'Return to the path to choose the next case. Reviewed retries remain separate from independent checks.' : 'The transfer version changes the problem you must reason through, rather than only changing the numbers.'}</p></div><Link className="btn btn-primary" to={task.variant === 'transfer' ? '/interview' : taskLink({ case_id: task.id, variant: 'transfer' })}>{task.variant === 'transfer' ? 'Back to my path' : 'Try the transfer case'} <ArrowRight size={15}/></Link></div>
  </section>;
}

export default function InterviewLab() {
  const auth = useAuth();
  return <InterviewWorkspace key={auth.user?.id || 'preview'} auth={auth}/>;
}

function InterviewWorkspace({ auth }) {
  const location = useLocation();
  const token = auth.session?.access_token || null;
  const owner = auth.user?.id || 'preview';
  const caseId = location.pathname.split('/').filter(Boolean)[1] || '';
  const variant = new URLSearchParams(location.search).get('variant') === 'transfer' ? 'transfer' : 'primary';
  const [catalog, setCatalog] = useState(null);
  const [state, setState] = useState(null);
  const [stateError, setStateError] = useState('');
  const [task, setTask] = useState(null);
  const [taskErrorStatus, setTaskErrorStatus] = useState(null);
  const [answers, setAnswers] = useState({});
  const [reasoning, setReasoning] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [hint, setHint] = useState(false);
  const submitKey = useRef(null);
  const restoredPhase = useRef(null);
  const identity = useRef(owner);
  const currentTaskKey = useRef(`${caseId}:${variant}`);
  identity.current = owner;
  currentTaskKey.current = `${caseId}:${variant}`;
  const refreshState = useCallback(async () => {
    if (!token) { setState(null); return null; }
    const result = await callInterview('/state', token);
    if (identity.current === owner) { setState(result); setStateError(''); }
    return result;
  }, [token, owner]);

  useEffect(() => {
    let live = true; setCatalog(null); setState(null); setStateError('');
    callInterview('/catalog', token).then(data => { if (live) setCatalog(data); }).catch(cause => { if (live) setError(cause.message); });
    if (token) refreshState().catch(cause => { if (live) setStateError(cause.message); });
    return () => { live = false; };
  }, [token, owner, refreshState, reloadKey]);

  useEffect(() => {
    let live = true; setTask(null); setTaskErrorStatus(null); setAttempt(null); setAnswers({}); setReasoning(''); setError(''); setHint(false); setBusy(false); submitKey.current = null; restoredPhase.current = null;
    if (!caseId || auth.isLoading) { setLoading(false); return () => { live = false; }; }
    setLoading(true);
    callInterview(`/cases/${encodeURIComponent(caseId)}?variant=${variant}`, token).then(data => {
      if (!live) return;
      setTask(data);
      try {
        const draft = JSON.parse(localStorage.getItem(`tpl.interview.draft.v1:${owner}:${caseId}:${variant}`) || 'null');
        if (draft) { setAnswers(draft.answers || {}); setReasoning(typeof draft.reasoning === 'string' ? draft.reasoning : ''); }
      } catch { /* A blocked or old draft does not prevent practice. */ }
      if (token) callInterview('/session', token, { case_id: caseId, variant, active_seconds: 0, client_request_id: makeId() }).catch(cause => { if (live) setStateError(cause.message); });
    }).catch(cause => { if (live) { setError(cause.message); setTaskErrorStatus(cause.status || 503); } }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [caseId, variant, token, owner, auth.isLoading, reloadKey]);

  useEffect(() => {
    if (!task || !token || !state || task.id !== caseId || task.variant !== variant) return;
    const key = `${owner}:${caseId}:${variant}`;
    if (restoredPhase.current === key) return;
    restoredPhase.current = key;
    const latest = [...(state.attempts || [])].reverse().find(item => item.case_id === caseId && item.variant === variant);
    if (latest) { setAnswers(latest.answers || {}); setReasoning(latest.reasoning || ''); setAttempt(latest); }
  }, [task, state, token, owner, caseId, variant]);

  // A submitted answer is immutable on the server. The form draft is device-local.
  useEffect(() => {
    if (!task || task.id !== caseId || task.variant !== variant) return;
    try { localStorage.setItem(`tpl.interview.draft.v1:${owner}:${caseId}:${variant}`, JSON.stringify({ answers, reasoning })); } catch { /* Server attempts still work without browser storage. */ }
  }, [task, answers, reasoning, owner, caseId, variant]);

  // Count only visible, focused use with recent input, never time with a hidden tab.
  useEffect(() => {
    if (!task || !token) return undefined;
    let lastInput = performance.now(), previous = performance.now(), seconds = 0;
    const interact = () => { lastInput = performance.now(); };
    const flush = () => {
      const amount = Math.min(300, Math.floor(seconds)); seconds -= amount;
      if (!amount) return;
      callInterview('/session', token, { case_id: caseId, variant, active_seconds: amount, client_request_id: makeId() }, 'POST', { keepalive: true }).catch(() => { /* Unacknowledged time is not claimed as saved. */ });
    };
    const interval = window.setInterval(() => { const now = performance.now(); if (document.visibilityState === 'visible' && document.hasFocus() && now - lastInput < 60000) seconds += Math.min(5, (now - previous) / 1000); previous = now; if (seconds >= 30) flush(); }, 5000);
    document.addEventListener('pointerdown', interact); document.addEventListener('keydown', interact); document.addEventListener('scroll', interact, { passive: true });
    window.addEventListener('pagehide', flush);
    return () => { clearInterval(interval); flush(); document.removeEventListener('pointerdown', interact); document.removeEventListener('keydown', interact); document.removeEventListener('scroll', interact); window.removeEventListener('pagehide', flush); };
  }, [task, token, caseId, variant]);

  const previousAttempts = (state?.attempts || []).filter(item => item.case_id === caseId && item.variant === variant);
  const resumePending = restoredPhase.current !== `${owner}:${caseId}:${variant}`;
  const visibleAttempt = attempt || (token && resumePending ? previousAttempts.at(-1) : null);
  const submit = async (event) => {
    event.preventDefault(); if (busy || !task) return; setBusy(true); setError('');
    const payload = { case_id: caseId, variant, answers: Object.fromEntries(task.questions.map(q => [q.id, Number(answers[q.id])])), reasoning: reasoning.trim() };
    const signature = JSON.stringify(payload);
    const requestedTask = `${caseId}:${variant}`;
    if (submitKey.current?.signature !== signature) submitKey.current = { signature, key: makeId() };
    try {
      const response = await callInterview(token ? '/attempts' : '/preview/check', token, { ...payload, client_request_id: submitKey.current.key });
      if (currentTaskKey.current !== requestedTask) return;
      setAttempt(response.attempt); if (token) await refreshState();
    } catch (cause) { if (currentTaskKey.current === requestedTask) setError(cause.message); }
    finally { if (currentTaskKey.current === requestedTask) setBusy(false); }
  };
  const reveal = async () => {
    if (!token || busy) return; setBusy(true); setError('');
    const requestedTask = `${caseId}:${variant}`;
    try { const result = await callInterview('/reveal', token, { case_id: caseId, variant, client_request_id: makeId() }); if (currentTaskKey.current !== requestedTask) return; setAttempt({ ...result, id: 'reference', reference_only: true, independent: false }); await refreshState(); }
    catch (cause) { if (currentTaskKey.current === requestedTask) setError(cause.message); } finally { if (currentTaskKey.current === requestedTask) setBusy(false); }
  };
  const exportReport = async () => {
    setBusy(true); setError('');
    try {
      const report = await callInterview('/export', token);
      const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'tpl-interview-practice-report.json'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  };

  const metrics = state?.metrics || emptyMetrics;
  const accountRequired = taskErrorStatus === 401 || taskErrorStatus === 403;
  const ready = task && task.questions?.every(q => answers[q.id] !== undefined && String(answers[q.id]).trim() !== '' && Number.isFinite(Number(answers[q.id]))) && reasoning.trim().length >= 40 && reasoning.trim().split(/\s+/).length >= 8;
  return <section className="il-shell" lang="en" aria-label="Pricing and Greeks Interview Lab" data-interview-lab>
    {!caseId ? <>
      <header className="il-hero"><div className="il-eyebrow"><span className="il-live-dot"/>PRICING & GREEKS · INTERVIEW LAB</div><h1>Turn a price into<br/><em>a defensible answer.</em></h1><p>Practise the calculation. Explain the hedge. Test the idea again with a changed assumption. A focused path for bank derivatives interviews.</p><div className="il-actions"><Link className="btn btn-primary" to={taskLink(state?.current_task || state?.next_task)}>{state?.current_task ? 'Resume my case' : 'Start the free case'} <ArrowRight size={16}/></Link><span className="il-muted"><Clock3 size={14}/>6 cases · English · pilot access</span></div><small>First case open to everyone. Sign in with a verified account to save attempts and access all six pilot cases. No additional purchase is required for this pilot.</small></header>
      {token && <Metrics metrics={metrics}/>}
      <Onboarding key={owner} value={state?.onboarding} token={token} onSaved={onboarding => setState(current => ({ ...current, onboarding }))}/>
      <section className="il-path" aria-label="Six-case learning path"><div className="il-section-head"><div><span className="il-eyebrow">YOUR PREPARATION PATH</span><h2>From the first quote to the risk memo.</h2></div><p>Each case has a transfer version.<br/>Same skill, a different decision.</p></div>
        {!catalog && !error && <p role="status">Loading the practice path…</p>}
        {(catalog?.cases || []).map(item => { const history = (state?.attempts || []).filter(a => a.case_id === item.id); const passed = history.some(a => a.numerical_pass && a.independent); const transfer = history.some(a => a.variant === 'transfer' && a.numerical_pass && a.independent); return <Link key={item.id} className="il-path-row" to={taskLink(item)}><span className="il-path-number">{String(item.order).padStart(2, '0')}</span><div><h3>{item.title}</h3><p>{item.summary}</p><span className="il-path-status">{transfer ? 'Transfer check passed' : passed ? 'Calculation passed · test transfer next' : history.length ? 'Attempt recorded · keep practising' : item.public_preview ? 'Free case · no account needed' : token ? 'Included in the pilot' : 'Sign in to continue'}</span></div><span className="il-path-time">{item.minutes} min{passed ? <CheckCircle2 size={18}/> : <ArrowRight size={18}/>}</span></Link>; })}
      </section>
      {token && <section className="il-record"><div><h2>A record of what you actually did.</h2><p>Export your original answers, calculated feedback and self-reviews. Observed active use: {Math.floor((metrics.active_seconds || 0) / 60)} min, excluding hidden or idle tabs. This is a learning record, not a certification.</p></div><button className="btn btn-outline" onClick={exportReport} disabled={busy}><Download size={15}/>Export my practice report</button></section>}
    </> : <>
      <div className="il-case-top"><Link to="/interview"><ChevronLeft size={15}/>My preparation path</Link><span>{variant === 'transfer' ? 'TRANSFER CHECK · CHANGED ASSUMPTION' : 'PRACTICE CASE'}</span></div>
      {loading && <p className="il-loading" role="status">Opening your case…</p>}
      {task && task.id === caseId && task.variant === variant && <>
        <header className="il-case-heading" data-case={task.id} data-variant={task.variant}><span className="il-eyebrow">{task.skill || 'PRICING & GREEKS'} · {task.variant === 'transfer' ? 'TRANSFER' : 'PRIMARY'}</span><h1>{task.title}</h1><p>{task.brief}</p>{!token && <span className="il-preview-note">Free preview · your result is not saved. Sign in for progress across devices.</span>}</header>
        <div className="il-case-grid"><div className="il-task-main">
          <section className="il-ticket"><div className="il-eyebrow">THE TICKET</div><dl>{ticketRows(task.ticket).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><details><summary>Conventions and model assumptions</summary><ul>{(task.assumptions || []).map((line, i) => <li key={i}>{line}</li>)}{task.ticket?.shocks && <li>Calculator scenarios: spot ±{format(task.ticket.shocks.spotPct)}%, volatility ±{format(task.ticket.shocks.volPoints)} percentage points, and {format(task.ticket.shocks.days)} days forward. Use the direction requested in the brief.</li>}</ul></details></section>
          {token && !state && !stateError ? <p className="il-loading" role="status">Restoring your saved work…</p> : !visibleAttempt ? <form className="il-answer-form" onSubmit={submit}><h2>Your answer, before the correction.</h2><p className="il-muted">Use the conventions in the ticket. Numerical tolerance is stated for each answer. Your reasoning stays separate from the calculation check.</p>
            {task.questions.map(question => <label key={question.id} className="il-question"><span>{question.label}</span><div><input aria-label={question.label} type="number" step="any" required value={answers[question.id] ?? ''} onChange={e => setAnswers({ ...answers, [question.id]: e.target.value })}/><strong>{question.unit}</strong></div><small>Absolute tolerance ±{format(question.tolerance_abs)} {question.unit}</small></label>)}
            <label className="il-reasoning">{task.reasoning_prompt || 'Explain the assumptions, the hedge decision and one limitation.'}<textarea aria-label="Your reasoning" required minLength={40} maxLength={5000} rows={6} value={reasoning} onChange={e => setReasoning(e.target.value)} placeholder="Explain how you reached your answer and what you would tell the interviewer."/><small>At least 40 characters and eight words. Your argument is self-reviewed with the rubric after submission.</small></label>
            <div className="il-actions"><button type="submit" className="btn btn-primary" disabled={!ready || busy}>{busy ? 'Checking your answer…' : previousAttempts.length ? 'Submit a reviewed retry' : 'Submit & check my answer'} <ArrowRight size={16}/></button><span className="il-muted">{token ? 'Submitted attempts are saved to your account' : 'Preview only · not saved'}</span></div>
            {token && <details className="il-disclosure"><summary>Prefer to study the reference first?</summary><p>Opening the reference marks this version as reviewed. A later answer to it will not count as an independent pass. You can still test a fresh transfer case.</p><button type="button" className="btn btn-outline" onClick={reveal} disabled={busy}>Reveal reference · study only</button></details>}
          </form> : <Feedback key={visibleAttempt.id} attempt={visibleAttempt} task={task} token={token} onReviewed={() => refreshState().catch(cause => setError(cause.message))} onError={setError}/>}
          {previousAttempts.length > 0 && <details className="il-history"><summary>{previousAttempts.length} saved attempt{previousAttempts.length > 1 ? 's' : ''} for this version</summary>{previousAttempts.map(item => <button type="button" key={item.id} onClick={() => setAttempt(item)}><span>{item.created_at ? new Date(typeof item.created_at === 'number' ? item.created_at * 1000 : item.created_at).toLocaleString('en-GB') : 'Saved attempt'} · {item.numerical_pass ? 'Numerical check passed' : 'Needs review'}</span><small>{item.independent ? 'Independent' : 'Reviewed'}</small></button>)}</details>}
          {visibleAttempt && <button className="btn btn-ghost il-retry" onClick={() => { restoredPhase.current = `${owner}:${caseId}:${variant}`; setAttempt(null); submitKey.current = null; }}><RotateCcw size={14}/>Practise this version again · reviewed retry</button>}
        </div><aside className="il-case-aside"><section><span className="il-eyebrow">THE CONCEPT</span><h2>What this tests</h2><p>{task.concept_note}</p></section><section><button className="il-hint-toggle" aria-expanded={hint} onClick={() => setHint(!hint)}><Lightbulb size={17}/>{hint ? 'Hide the hints' : 'Need a starting point?'}</button>{hint && <ol>{(task.hints || []).map((line, i) => <li key={i}>{line}</li>)}</ol>}</section><section><h3>Work with the same inputs</h3><p>Use the calculator to explore the ticket. If you use it for your answer, say so in your reasoning; this is practice, not a proctored test.</p><Link className="il-tool-link" to={task.tool_url || '/tools/bs-pricer'}>Open the pricing tool <ArrowRight size={15}/></Link></section><section className="il-trust-note"><LockKeyhole size={16}/><p>Numbers are checked by a deterministic model. No AI score or expert review is claimed for your written argument.</p></section></aside></div>
      </>}
      {!loading && !task && <div className="il-unavailable"><h1>{accountRequired ? 'Continue with a verified account.' : taskErrorStatus === 404 ? 'That case was not found.' : 'This case could not be opened.'}</h1><p>{accountRequired ? 'The free first case remains available. Account access saves your responses and unlocks the rest of the pilot.' : 'Your current draft is kept on this device. Retry below, or return to your preparation path.'}</p><div className="il-actions">{accountRequired ? <><Link className="btn btn-primary" to="/interview/call-quote">Try the free case</Link><Link className="btn btn-outline" to={interviewAuthLink('signup', caseId, variant)}>Create a free account</Link><Link to={interviewAuthLink('login', caseId, variant)}>Sign in</Link></> : <Link className="btn btn-outline" to="/interview">My preparation path</Link>}</div></div>}
    </>}
    {(error || stateError) && <div className="il-error" role="alert"><p>{error || stateError}</p><button type="button" className="btn btn-outline" onClick={() => { if (error) setReloadKey(key => key + 1); else refreshState().catch(cause => setStateError(cause.message)); }}>{error ? 'Retry practice' : 'Retry saved progress'}</button>{!token && <Link to={interviewAuthLink('login', caseId, variant)} style={{marginLeft:16}}>Sign in</Link>}</div>}
    <footer className="il-footer">Educational model inputs. No live quotes. No prediction of interview or hiring outcomes.</footer>
  </section>;
}
