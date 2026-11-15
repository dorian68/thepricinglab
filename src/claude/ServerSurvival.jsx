import React, { useCallback,useEffect,useRef,useState } from 'react';
import { Link,useLocation,useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { learningJson } from './learningApi';

const id=()=>crypto.randomUUID();
export default function ServerSurvival() {
 const auth=useAuth(),location=useLocation(),navigate=useNavigate();
 const token=auth.session?.access_token,owner=auth.user?.id;
 const requested=new URLSearchParams(location.search).get('run');
 const [run,setRun]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[seconds,setSeconds]=useState(30);
 const pending=useRef(null),anchor=useRef(null),active=useRef(true),runRef=useRef(null),tokenRef=useRef(token);tokenRef.current=token;
 const setSaved=useCallback(value=>{runRef.current=value;setRun(value);anchor.current={at:performance.now(),remaining:value.remaining_seconds};setSeconds(value.remaining_seconds??0);setError('');},[]);
 const remember=useCallback(value=>{setSaved(value);navigate(`/survival/core?run=${encodeURIComponent(value.id)}`,{replace:true});},[navigate,setSaved]);
 const perform=useCallback(async action=>{
  if(!token)return;pending.current=action;setBusy(true);setError('');
  try{const result=await learningJson(action.path,token,action.body);if(active.current&&tokenRef.current===token){pending.current=null;remember(result);}}
  catch(failure){if(active.current&&tokenRef.current===token)setError(failure.message);}
  finally{if(active.current&&tokenRef.current===token)setBusy(false);}
 },[token,remember]);
 const start=useCallback(()=>{
  const key=`tpl.survival.start.v1:${owner}`;let requestId;
  try{requestId=sessionStorage.getItem(key)||id();sessionStorage.setItem(key,requestId);}catch{requestId=id();}
  return perform({path:'/learning/survival/runs',body:{client_request_id:requestId,wave:'core'}});
 },[owner,perform]);
 useEffect(()=>{
  active.current=true;pending.current=null;let current=true;
  if(!token)return()=>{current=false;active.current=false;};
  setError('');setRun(null);setBusy(true);
  const load=async()=>{
   try{
    if(requested){if(!/^srv_[a-f0-9]{32}$/.test(requested))throw new Error('Invalid practice run link.');const value=await learningJson(`/learning/survival/runs/${requested}`,token);if(current)setSaved(value);}
    else{const value=await learningJson('/learning/survival/runs',token);if(!current)return;const latest=value.runs?.find(item=>!item.completed)||value.runs?.[0];if(latest)remember(latest);else await start();}
   }catch(failure){if(current)setError(failure.message);}
   finally{if(current)setBusy(false);}
  };void load();return()=>{current=false;active.current=false;};
 },[requested,token,setSaved,remember,start]);
 const answer=useCallback(choice=>{
  const value=runRef.current;if(!value||value.phase!=='answer'||pending.current)return;
  return perform({path:`/learning/survival/runs/${value.id}/answers`,body:{client_request_id:id(),question_id:value.question.id,answer:choice}});
 },[perform]);
 useEffect(()=>{
  if(!run||run.phase!=='answer'||busy||error)return;
  const tick=()=>{const remaining=Math.max(0,(anchor.current?.remaining||0)-Math.floor((performance.now()-anchor.current.at)/1000));setSeconds(remaining);if(remaining===0)void answer('timeout');};
  tick();const timer=setInterval(tick,250);return()=>clearInterval(timer);
 },[run,busy,error,answer]);
 const next=()=>!pending.current&&perform({path:`/learning/survival/runs/${run.id}/next`,body:{client_request_id:id()}});
 const restart=()=>{try{sessionStorage.removeItem(`tpl.survival.start.v1:${owner}`);}catch{}void start();};
 const options=Array.isArray(run?.question?.options)?run.question.options:Object.entries(run?.question?.options||{});
 return <div className="container page server-survival" data-survival-run={run?.id||''}>
  <h1 className={run&&!run.completed?'sr-only':'page-title'}>{run?.completed?(run.lives===0?'Practice run ended':'Wave complete'):'Survival · Core wave'}</h1>
  {error&&<div className="form-notice error" role="alert"><p>{error}</p>{pending.current?<button className="btn btn-outline btn-sm" onClick={()=>perform(pending.current)} disabled={busy}>Retry the same action</button>:<button className="btn btn-outline btn-sm" onClick={()=>window.location.reload()}>Reload saved run</button>}<Link className="btn btn-ghost btn-sm" to="/survival">Back to Survival</Link></div>}
  {!run&&!error&&<p role="status">Restoring the server-owned practice run…</p>}
  {run?.completed&&<section className="panel" style={{padding:28,maxWidth:740}}><p className="page-sub">You answered {run.answered_count} of {run.total_questions} teaching questions.</p><div className="grid-3"><div><span className="label">Score</span><p className="mono">{run.score}</p></div><div><span className="label">Best streak</span><p className="mono">x{run.best_streak}</p></div><div><span className="label">Save status</span><p>Saved · unranked practice</p></div></div><p className="text-2">This score is calculated by the server. This question bank can be studied elsewhere; timing and scoring do not certify independence or mastery.</p><div className="row" style={{gap:12,flexWrap:'wrap'}}><button className="btn btn-primary" onClick={restart} disabled={busy}>Start another run</button><Link className="btn btn-outline" to="/survival">Back to Survival Mode</Link></div></section>}
  {run&&!run.completed&&<><div className="row between survival-run-head" style={{gap:16,flexWrap:'wrap',padding:'18px 0',marginBottom:24}}><Link className="btn btn-ghost btn-sm" to="/survival">Quit · keep saved run</Link><div className="row" style={{gap:24}}><span>{run.lives} lives</span><span className="mono">{run.answered_count}/{run.total_questions}</span><span className="mono" style={{fontSize:24,color:seconds<10?'var(--red)':'var(--text)'}} aria-label="Seconds remaining">{run.phase==='answer'?`${seconds}s`:'Review'}</span></div></div>
   <div className="survival-question-grid"><section className="panel survival-question-panel" style={{padding:32}}><div className="mono mute" style={{fontSize:11,marginBottom:18}}>QUESTION {run.index+1} / {run.total_questions} · {run.question.topic}</div><h2 style={{fontSize:26,lineHeight:1.3}}>{run.question.prompt}</h2><p className="text-2">{run.question.context}</p><div className="col" style={{gap:10,marginTop:22}}>{options.map(([key,value])=><button key={key} className="panel-2" style={{padding:16,textAlign:'left',color:'var(--text)',border:run.feedback?.selected===key?'1px solid var(--red)':'1px solid transparent'}} disabled={busy||run.phase!=='answer'||!!error} onClick={()=>answer(key)}>{key} {value}</button>)}</div>
   {run.feedback&&<div role="status" className="survival-feedback" style={{marginTop:22}}><strong>{run.feedback.selected==='timeout'?'Time is up. ':run.feedback.correct?'Correct. ':`Correct answer: ${run.feedback.correct_answer}. `}</strong><span>{run.feedback.explanation}</span><p className="mute">+{run.feedback.earned} points. Feedback is retained until you choose Next.</p><button className="btn btn-primary" disabled={busy||!!error} onClick={next}>{run.lives===0||run.index+1>=run.total_questions?'Finish run':'Next'}</button></div>}</section>
   <aside className="panel" style={{padding:24,alignSelf:'start'}}><h2 style={{fontSize:17}}>Saved practice</h2><p className="mono">Score {run.score} · streak x{run.streak} · best x{run.best_streak}</p><p className="text-2" style={{fontSize:12,lineHeight:1.7}}>The server owns the question, remaining time, lives and score. Reloading does not restart the thirty-second deadline. Reviewing feedback pauses the timer until Next. Practice is unranked and not proctored.</p></aside></div>
  </>}
 </div>;
}
