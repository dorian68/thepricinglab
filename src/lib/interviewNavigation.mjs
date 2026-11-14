const CASES = ['call-quote', 'dividend-parity', 'delta-hedge', 'gamma-vega', 'time-rates', 'quote-memo'];
export function interviewAuthLink(mode = 'login', caseId = '', variant = 'primary') {
  const query = new URLSearchParams({ next: 'interview' });
  if (CASES.includes(caseId)) { query.set('case', caseId); query.set('variant', variant === 'transfer' ? 'transfer' : 'primary'); }
  return `/auth/${mode === 'signup' ? 'signup' : 'login'}?${query}`;
}
export function interviewAuthDestination(query) {
  if (query.get('next') !== 'interview') return null;
  const id = query.get('case');
  return CASES.includes(id) ? `/interview/${id}?variant=${query.get('variant') === 'transfer' ? 'transfer' : 'primary'}` : '/interview';
}
