// Keep learning activity categories separate: a saved attempt is not mastery.
export function interviewProgressView(progress) {
  const data = progress?.interview;
  if (!data || typeof data !== 'object') return null;
  const count = (key) => Number.isSafeInteger(data[key]) && data[key] >= 0 ? data[key] : 0;
  const candidate = data.resume?.path;
  const resumePath = typeof candidate === 'string' && /^\/interview\/[a-z0-9-]+(?:\?variant=(?:primary|transfer))?$/.test(candidate)
    ? candidate : '/interview';
  return {
    attempts: count('attempt_count'),
    cases: count('case_count'),
    numericalPasses: count('numerical_pass_count'),
    independentChecks: count('independent_check_count'),
    reasoningReviews: count('reasoning_review_count'),
    events: count('event_count'),
    hasActivity: count('event_count') > 0 || count('attempt_count') > 0,
    resumePath,
    hasResume: resumePath !== '/interview',
    phase: ['answer', 'feedback', 'reference'].includes(data.resume?.phase) ? data.resume.phase : null,
  };
}

export function learningProgressView(progress){
  const data=progress?.learning;
  if(!data||typeof data!=='object')return null;
  const count=key=>Number.isSafeInteger(data[key])&&data[key]>=0?data[key]:0;
  const exercise=data.exercise_resume,run=data.survival_resume;
  const exerciseValid=/^[a-z][a-z0-9_-]{0,99}$/.test(exercise?.exercise_id||'')&&/^exa_[a-f0-9]{32}$/.test(exercise?.attempt_id||'')&&exercise.path===`/exercises/${exercise.exercise_id}?attempt=${exercise.attempt_id}`;
  const survivalValid=/^srv_[a-f0-9]{32}$/.test(run?.run_id||'')&&run.wave==='core'&&run.path===`/survival/core?run=${run.run_id}`&&['answer','feedback','complete'].includes(run.phase);
  const exerciseAttempts=count('exercise_attempt_count'),survivalAnswers=count('survival_answer_count');
  return {
    exerciseAttempts,exerciseReviews:count('exercise_review_count'),survivalAnswers,
    survivalRuns:count('survival_run_count'),survivalEnded:count('survival_completed_count'),
    hasActivity:exerciseAttempts>0||survivalAnswers>0,
    hasStarted:count('survival_run_count')>0||exerciseAttempts>0,
    exerciseResume:exerciseValid?exercise:null,survivalResume:survivalValid?run:null,
    lastActivityAt:typeof data.last_activity_at==='string'&&Number.isFinite(Date.parse(data.last_activity_at))?data.last_activity_at:null,
  };
}
