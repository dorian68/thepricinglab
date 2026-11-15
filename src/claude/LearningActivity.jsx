import React from 'react';
import {Link} from 'react-router-dom';
const Count=({label,value})=><div><dt className="label" style={{fontSize:10,lineHeight:1.6}}>{label}</dt><dd className="mono" style={{fontSize:24,margin:'8px 0 0'}}>{value}</dd></div>;
export default function LearningActivity({learning}){
 if(!learning?.hasStarted&&!learning?.hasActivity)return null;
 return <section className="panel learning-activity" aria-labelledby="dashboard-learning-heading" style={{padding:24,marginBottom:18}}>
  <h2 id="dashboard-learning-heading" style={{fontSize:20,margin:'0 0 10px'}}>Your saved practice</h2>
  <p className="mute" style={{fontSize:12,lineHeight:1.7}}>Written answers and timed practice stay private. These records are separate from course completion and Interview Lab checks; they are not certified mastery.</p>
  <div className="learning-ledger-grid">
   <article data-learning-ledger="exercises"><h3 style={{fontSize:17}}>Written exercise practice</h3><dl className="learning-ledger-counts"><Count label="Saved written attempts" value={learning.exerciseAttempts}/><Count label="Self-review records" value={learning.exerciseReviews}/></dl>{learning.exerciseResume?<Link className="btn btn-outline btn-sm" to={learning.exerciseResume.path}>Resume written attempt →</Link>:<Link className="btn btn-ghost btn-sm" to="/exercises">Open exercise library →</Link>}<p className="mute" style={{fontSize:12,lineHeight:1.65}}>Answers remain unchanged when you add a self-review. No automatic prose score or expert assessment is assigned.</p></article>
   <article data-learning-ledger="survival"><h3 style={{fontSize:17}}>Timed Survival practice</h3><dl className="learning-ledger-counts"><Count label="Runs started" value={learning.survivalRuns}/><Count label="Questions answered" value={learning.survivalAnswers}/><Count label="Runs ended" value={learning.survivalEnded}/></dl>{learning.survivalResume?<><Link className="btn btn-outline btn-sm" to={learning.survivalResume.path}>{learning.survivalResume.completed?'Review saved Survival run':'Resume saved Survival run'} →</Link><p className="mute" style={{fontSize:12}}>This run: {learning.survivalResume.answered_count} of {learning.survivalResume.total_questions} answers saved.{learning.survivalResume.answered_count===0?' Started, with no submitted answer yet.':''}</p></>:<Link className="btn btn-ghost btn-sm" to="/survival">Open timed practice →</Link>}<p className="mute" style={{fontSize:12,lineHeight:1.65}}>Practice is unranked. A run can end with no lives; an ended run is not a passed assessment.</p></article>
  </div>
  {learning.lastActivityAt&&<p className="mute" style={{fontSize:11,margin:'12px 0 0'}}>Last saved practice record: <time dateTime={learning.lastActivityAt}>{new Date(learning.lastActivityAt).toLocaleString()}</time>. The resumable run can be older when unfinished.</p>}
 </section>;
}
