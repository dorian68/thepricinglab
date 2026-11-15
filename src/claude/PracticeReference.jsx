import React,{useEffect,useRef,useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {learningJson,learningDownload} from './learningApi';

export function ReferenceConventions({reference}){
 if(!reference)return null;
 return <div className="reference-conventions"><h3>Ticket, assumptions and conventions</h3><details><summary>Computed reference ticket</summary><pre className="code" tabIndex={0} aria-label="Computed reference ticket">{JSON.stringify(reference.ticket,null,2)}</pre></details>{[['Conventions',reference.conventions],['Assumptions',reference.assumptions],['Limits',reference.limitations]].map(([title,values])=>values?.length>0&&<div key={title}><h4>{title}</h4><ul>{values.map(value=><li key={value}>{value}</li>)}</ul></div>)}<p className="mute">Original authored, hypothetical case. The reference is executable; reviewing or running it is not a grade of your answer.</p></div>;
}
export default function PracticeReference({reference}){
 const auth=useAuth(),token=auth.session?.access_token;
 const scope=`${token}:${reference?.id}`,current=useRef(scope);current.current=scope;
 const [result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{current.current=scope;setResult(null);setError('');setBusy(false);return()=>{current.current=null;};},[scope]);
 if(!reference)return null;
 const run=async()=>{if(busy)return;setBusy(true);setError('');setResult(null);try{const value=await learningJson(`/learning/exercises/${reference.id}/reference/run`,token,{});if(current.current===scope)setResult(value);}catch(failure){if(current.current===scope)setError(failure.message);}finally{if(current.current===scope)setBusy(false);}};
 const download=async format=>{setError('');try{await learningDownload(`/learning/exercises/${reference.id}/reference/export?format=${format}`,token,`${reference.id}.${format==='python'?'py':'ipynb'}`);}catch(failure){setError(failure.message);}};
 return <section className="panel exercise-readable-panel executable-reference" data-practice-reference={reference.id}><h2>Executable worked reference</h2><p className="text-2">Run the registered implementation on the original fixed ticket, or take its source to Python/Jupyter. This action does not run your edited code and does not mark your answer correct.</p><div className="row" style={{gap:10,flexWrap:'wrap'}}><button className="btn btn-primary btn-sm" disabled={busy} onClick={run}>{busy?'Calculating reference…':'Run registered reference'}</button><button className="btn btn-outline btn-sm" onClick={()=>download('python')}>Download reference .py</button><button className="btn btn-outline btn-sm" onClick={()=>download('ipynb')}>Download reference .ipynb</button></div>{error&&<p role="alert" className="form-notice error">{error}</p>}{result&&<div role="status"><h3>Result calculated now</h3><pre className="code" tabIndex={0} aria-label="Registered reference result">{JSON.stringify(result,null,2)}</pre></div>}<ReferenceConventions reference={reference}/></section>;
}
