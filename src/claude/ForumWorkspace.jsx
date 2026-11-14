import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { platformApi } from './practiceEngine';
import { ServiceUnavailable } from './DeliverySupport';

export default function ForumWorkspace({ composing, setComposing, reloadKey, onPosted }) {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('thread');
  const [threads, setThreads] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ title: '', body: '', tag: '' });
  const [comments, setComments] = useState(null);
  const [commentError, setCommentError] = useState(false);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const heading = useRef(null);
  const refetch = useCallback(async () => {
    setLoadError(false);
    try { setThreads(await platformApi.listThreads('forum')); }
    catch { setLoadError(true); }
  }, []);
  useEffect(() => { void refetch(); }, [refetch, reloadKey]);
  const reloadComments = useCallback(async () => {
    if (!selectedId) return;
    setCommentError(false);
    try { setComments(await platformApi.listComments(selectedId)); }
    catch { setCommentError(true); }
  }, [selectedId]);
  useEffect(() => {
    setComments(null);
    setReply('');
    setNotice('');
    void reloadComments();
    heading.current?.focus();
  }, [reloadComments]);
  useEffect(() => { if (composing && selectedId) setParams({}); }, [composing, selectedId, setParams]);
  const thread = threads?.find((item) => String(item.id) === selectedId);
  const displayed = (threads || []).filter((item) => `${item.title} ${item.body} ${(item.tags || []).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  async function post(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setNotice('');
    try {
      const created = await platformApi.createThread({ channel: 'forum', title: form.title.trim(), body: form.body.trim(), tags: form.tag.trim() ? [form.tag.trim()] : [] });
      await refetch();
      setComposing(false);
      setForm({ title: '', body: '', tag: '' });
      setParams({ thread: String(created.id) });
      onPosted?.();
    } catch { setNotice('Your post was not published. Please try again.'); }
    finally { setBusy(false); }
  }
  async function respond(event) {
    event.preventDefault();
    if (busy || !reply.trim()) return;
    setBusy(true); setNotice('');
    try {
      await platformApi.addComment(selectedId, { body: reply.trim() });
      setReply('');
      setNotice('Your reply was published.');
      await reloadComments();
      await refetch();
    } catch { setNotice('Your reply was not published. Your draft is still here; please try again.'); }
    finally { setBusy(false); }
  }
  async function vote(id) {
    if (busy) return;
    setBusy(true); setNotice('');
    try { await platformApi.voteThread(id); await refetch(); }
    catch { setNotice('Your vote could not be recorded. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="workspace-with-aside">
    <section className="panel forum-workspace">
      {notice && <p role="status" className="form-notice">{notice}</p>}
      {composing && <form className="col forum-composer" onSubmit={post} style={{ gap: 16 }}>
        <h2>Start a discussion</h2>
        <label className="field">Title<input required minLength={3} maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label className="field">Your question<textarea aria-label="Your question" required minLength={3} maxLength={5000} rows={5} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label>
        <label className="field">Topic tag (optional)<input maxLength={40} value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} /></label>
        <div className="row" style={{ gap: 12 }}><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish discussion'}</button><button type="button" className="btn btn-ghost" onClick={() => setComposing(false)}>Cancel</button></div>
      </form>}
      {loadError ? <ServiceUnavailable title="Discussions could not be loaded" onRetry={refetch} /> : threads === null ? <p role="status">Loading discussions…</p> : selectedId ? thread ? <article data-forum-thread={thread.id}>
        <button className="btn btn-ghost" onClick={() => setParams({})}>← All discussions</button>
        <h2 tabIndex={-1} ref={heading}>{thread.title}</h2>
        <p className="mute">by @{thread.author} · {new Date(thread.created_at * 1000).toLocaleDateString('en-GB')}</p>
        <p className="forum-message">{thread.body}</p>
        <button className="btn btn-outline" aria-label={`Upvote discussion: ${thread.votes} votes`} disabled={busy} onClick={() => vote(thread.id)}>▲ {thread.votes} votes</button>
        <h3>Replies</h3>
        {commentError ? <ServiceUnavailable title="Replies could not be loaded" onRetry={reloadComments} /> : comments === null ? <p role="status">Loading replies…</p> : comments.length ? comments.map((comment) => <article className="forum-reply" key={comment.id}><p className="mute">@{comment.author} · {new Date(comment.created_at * 1000).toLocaleDateString('en-GB')}</p><p className="forum-message">{comment.body}</p></article>) : <p className="text-2">No replies yet. Add the first one.</p>}
        <form className="col" onSubmit={respond} style={{ gap: 14 }}><label className="field">Your reply<textarea aria-label="Your reply" required maxLength={5000} rows={4} value={reply} onChange={(event) => setReply(event.target.value)} /></label><button className="btn btn-primary" type="submit" disabled={busy || !reply.trim()}>{busy ? 'Publishing…' : 'Publish reply'}</button></form>
      </article> : <div><h2>Discussion not found</h2><button className="btn btn-outline" onClick={() => setParams({})}>Back to discussions</button></div> : <>
        <label className="field">Search discussions<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <p className="mono mute">{displayed.length} discussion{displayed.length === 1 ? '' : 's'}</p>
        {!displayed.length && <p className="text-2">{threads.length ? 'No discussion matches your search.' : 'No discussions yet. Start one with “New post”.'}</p>}
        {displayed.map((item) => <article className="forum-topic" key={item.id}><h2><button onClick={() => { setComposing(false); setParams({ thread: String(item.id) }); }}>{item.title}</button></h2><p className="mute">@{item.author} · {item.comment_count} replies · {item.votes} votes</p><div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>{(item.tags || []).map((tag) => <span className="badge" key={tag}>{tag}</span>)}</div></article>)}
      </>}
    </section>
    <aside className="panel forum-guidance"><h2>Discuss the assumptions</h2><p className="text-2">Include your inputs, conventions and the result you are trying to understand.</p><p className="text-2">Do not share confidential data, investment solicitations or copyrighted documents. Use the support page to report abuse.</p></aside>
  </div>;
}
