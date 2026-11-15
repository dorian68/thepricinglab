import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NOTEBOOK_EXAMPLES, getNotebookExample, buildNotebook, downloadNotebookFile } from '../lib/notebookExamples.mjs';
import { runPython, cancelPython } from './pyodideRunner';

export default function NotebookWorkspace() {
  const location = useLocation();
  const auth = useAuth();
  const requested = new URLSearchParams(location.search).get('lab');
  const example = getNotebookExample(requested) || NOTEBOOK_EXAMPLES[0];
  const owner = auth.user?.id || 'visitor';
  const storageKey = `tpl.notebook.draft.v1:${owner}:${example.id}`;
  const [code, setCode] = useState(example.code);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('idle');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let draft = null;
    try { draft = localStorage.getItem(storageKey); } catch { /* Editing and downloads still work. */ }
    setCode(draft ?? example.code); setOutput(''); setStatus('idle'); setSaved(draft !== null);
    return () => cancelPython();
  }, [storageKey, example.code]);

  const changeCode = next => {
    setCode(next); setOutput(''); setStatus('idle');
    try { localStorage.setItem(storageKey, next); setSaved(true); } catch { setSaved(false); }
  };
  const run = async () => {
    setStatus('running'); setOutput('Loading the browser Python runtime…');
    const result = await runPython(code);
    setOutput((result.stdout || '') + (result.error ? `\n${result.error}` : '') || '(no output)');
    setStatus(result.ok ? 'success' : 'error');
  };
  const reset = () => {
    cancelPython(); setCode(example.code); setOutput(''); setStatus('idle'); setSaved(false);
    try { localStorage.removeItem(storageKey); } catch { /* No saved draft exists when storage is blocked. */ }
  };
  return <div className="container page notebook-workspace" lang="en">
    <div className="crumb"><Link to="/practice">/ practice</Link><i>›</i><span>/ notebooks</span></div>
    <h1 className="page-title">Notebooks</h1>
    <p className="page-sub">Original Python labs with explicit tickets, a browser runtime and real Jupyter/Python exports. Drafts stay on this device; cloud saving and sharing are not included.</p>
    {requested && !getNotebookExample(requested) && <p role="status" className="form-notice">That lab was not found. Choose one of the available examples below.</p>}
    <div className="workspace-sidebar-left">
      <nav className="panel" aria-label="Python lab library" style={{padding:16,alignSelf:'start'}}>
        <div className="label" style={{marginBottom:12}}>Library</div>
        {NOTEBOOK_EXAMPLES.map(item=><Link key={item.id} to={`/notebooks?lab=${item.id}`} className="notebook-choice" aria-current={item.id === example.id ? 'page' : undefined}><span>{item.title}</span><small>{item.filename}</small></Link>)}
        <Link to="/challenge" className="btn btn-ghost btn-sm" style={{marginTop:14}}>Practice Challenge</Link>
      </nav>
      <section className="panel" style={{padding:24,minWidth:0}} aria-labelledby="notebook-title">
        <div className="row between" style={{gap:12,flexWrap:'wrap'}}><h2 id="notebook-title" style={{fontSize:22,margin:0}}>{example.title}</h2><span className="badge">Python · original case</span></div>
        <p className="text-2" style={{fontSize:13,lineHeight:1.65}}>{example.description}</p>
        <details className="tool-contract-disclosure"><summary>Ticket, method and limits</summary><pre className="code" tabIndex={0} aria-label="Notebook ticket">{JSON.stringify(example.ticket, null, 2)}</pre><ul className="text-2" style={{fontSize:12,paddingLeft:20}}>{example.limitations.map(item=><li key={item}>{item}</li>)}</ul></details>
        <label className="label" htmlFor="notebook-python-code" style={{display:'block',marginTop:20}}>Python source</label>
        <textarea id="notebook-python-code" value={code} onChange={event=>changeCode(event.target.value)} spellCheck={false} disabled={status==='running'} className="notebook-code" aria-describedby="notebook-draft-state"/>
        <p id="notebook-draft-state" className="mute" style={{fontSize:11}}>{saved ? 'Draft saved on this device for this account.' : 'Original example. Changes are saved on this device when browser storage is available.'} {code !== example.code ? 'Exports include your edited source; no result is implied by downloading.' : ''}</p>
        <div className="row" style={{gap:10,flexWrap:'wrap'}}>
          <button className="btn btn-primary btn-sm" onClick={run} disabled={status==='running'}>{status==='running' ? 'Running Python…' : 'Run Python'}</button>
          {status==='running' && <button className="btn btn-outline btn-sm" onClick={()=>cancelPython()}>Stop runtime</button>}
          <button className="btn btn-outline btn-sm" onClick={()=>downloadNotebookFile(example.filename,JSON.stringify(buildNotebook(example,code),null,2),'application/x-ipynb+json')}>Download .ipynb</button>
          <button className="btn btn-outline btn-sm" onClick={()=>downloadNotebookFile(`${example.id}.py`,code)}>Download .py</button>
          <button className="btn btn-ghost btn-sm" onClick={reset} disabled={status==='running'}>Reset source</button>
        </div>
        <div style={{marginTop:20}}><h3 style={{fontSize:14}}>Output</h3><pre className="code" tabIndex={0} aria-label="Python output" aria-live="polite" style={{maxHeight:380,overflow:'auto',whiteSpace:'pre-wrap'}}>{output || 'Run the source to calculate a result.'}</pre></div>
        {status==='error' && <div className="form-notice error" role="alert"><p>The browser run did not complete. Your source is retained. Retry, or download the Python file and run it locally:</p><code>python {example.id}.py</code><p>The original examples use the Python standard library. An edited draft may require its own dependencies.</p></div>}
        <div className="row" style={{gap:14,flexWrap:'wrap',marginTop:18}}><Link to="/interview">Continue interview preparation</Link><Link to={example.id==='barrier-down-out'?'/challenge':'/tools/bs-pricer'}>{example.id==='barrier-down-out'?'Back to the same challenge':'Open the vanilla calculator'}</Link></div>
      </section>
    </div>
  </div>;
}
