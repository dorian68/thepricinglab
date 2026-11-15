import { getPracticeApiBase } from './practiceEngine';

async function responseFor(path, token, body, method = body ? 'POST' : 'GET') {
  if (!token) { const error = new Error('Sign in to save and retrieve your practice.'); error.status = 401; throw error; }
  let response;
  try { response = await fetch(`${getPracticeApiBase()}${path}`, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) }); }
  catch { throw new Error('The practice service did not respond. Your current input is retained; retry the same action.'); }
  if (!response.ok) {
    const value = await response.json().catch(()=>({}));
    const message = typeof value.detail === 'string' ? value.detail : Array.isArray(value.detail) ? value.detail.map(item=>item.msg).join(' ') : response.status === 404 ? 'This private practice record was not found for your account.' : 'This action could not be completed. Retry or reload the saved state.';
    const error = new Error(message); error.status = response.status; throw error;
  }
  return response;
}
export async function learningJson(path, token, body, method) { return (await responseFor(path,token,body,method)).json(); }
export async function learningDownload(path, token, filename, body) {
  const response = await responseFor(path,token,body);
  const url = URL.createObjectURL(await response.blob());
  const anchor=document.createElement('a');anchor.href=url;anchor.download=filename.replace(/[^A-Za-z0-9_.-]/g,'-');document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
