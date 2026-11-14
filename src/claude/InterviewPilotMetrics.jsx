import React, { useEffect, useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPracticeApiBase } from './practiceEngine';

export default function InterviewPilotMetrics() {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setError('');
    fetch(`${getPracticeApiBase()}/interview/pilot/metrics`, { headers: { Authorization: `Bearer ${session?.access_token || ''}` }, signal: AbortSignal.timeout(10000) })
      .then(async response => { if (!response.ok) throw new Error(response.status === 403 ? 'Operator access is required.' : 'Pilot activity could not be loaded. Please retry.'); return response.json(); })
      .then(result => { if (active) setData(result); }).catch(cause => { if (active) { setData(null); setError(cause.message); } });
    return () => { active = false; };
  }, [session?.access_token, revision]);
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'tpl-interview-pilot-observed-activity.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const counts = data ? [
    ['Learners who opened practice', data.learners_seen], ['Activated · submitted a primary case', data.activated_learners],
    ['Tried a transfer case', data.transfer_attempted_learners], ['Passed an independent transfer check', data.transfer_passed_learners],
    ['Returned on a later day', data.returned_on_later_day], ['Total submitted attempts', data.totals.attempts],
  ] : [];
  return <section className="panel" data-interview-pilot-metrics style={{padding:24, marginTop:28}}>
    <div className="row between" style={{gap:14, flexWrap:'wrap'}}><div><span className="micro" style={{color:'var(--red)'}}>INTERVIEW PILOT · OBSERVED ACTIVITY</span><h2 style={{fontSize:22,marginTop:8}}>Measure practice before making promises.</h2></div><div className="row" style={{gap:8}}><button className="btn btn-outline btn-sm" onClick={() => setRevision(value => value + 1)}><RotateCcw size={13}/>Refresh</button>{data && <button className="btn btn-outline btn-sm" onClick={download}><Download size={13}/>Export aggregates</button>}</div></div>
    {error ? <p role="alert" style={{color:'var(--red)',marginTop:18}}>{error}</p> : !data ? <p role="status" style={{marginTop:18}}>Loading actual pilot activity…</p> : <>
      <p className="text-2" style={{fontSize:12,marginTop:14}}>{data.scope_notice} Accounts and attempts are not customers, purchases or evidence of willingness to pay. Only submitted attempts on different UTC dates count as a return.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:24,margin:'26px 0'}}>{counts.map(([label,value]) => <div key={label}><div className="mono" style={{fontSize:28}}>{value}</div><div className="mute" style={{fontSize:11,marginTop:5}}>{label}</div></div>)}</div>
      <div style={{overflowX:'auto'}}><table className="data"><thead><tr><th>Case</th><th>Learners attempted</th><th>First calculation passed</th><th>Tried transfer</th><th>Transfer passed</th></tr></thead><tbody>{data.per_case.map(row => <tr key={row.case_id}><td>{row.case_id}</td><td>{row.learners_attempted}</td><td>{row.first_attempts_passed}</td><td>{row.transfer_attempted}</td><td>{row.transfer_passed}</td></tr>)}</tbody></table></div>
      <details style={{fontSize:11,marginTop:18,color:'var(--text-2)'}}><summary>Definitions and measurement limits</summary><ul>{data.limitations.map((line,i) => <li key={i}>{line}</li>)}</ul><p>Environment: {data.environment}. Updated: {data.generated_at}. No learner names, written responses or email addresses are included in this report.</p></details>
    </>}
  </section>;
}
