// AG-UI agent provider — owns conversation state, streaming, and the dispatch
// of agent Custom events to real frontend actions (drive a tool, navigate,
// render a UIBlock). Mounted once globally inside the Router.
import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { runAgUI } from './aguiClient';
import { buildAppContext } from './appContext';
import { setToolParams } from './toolControl';
import { ALLOWED_BLOCKS } from './uiblocks';
import { getPracticeApiBase } from '../claude/practiceEngine';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'tpl.agui.threads.v1';
const AgentContext = createContext(null);

const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 10)}`;

function loadThreads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveThreads(threads) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(threads.slice(0, 20))); } catch { /* ignore */ }
}

export function AgentProvider({ children }) {
  const location = useLocation();
  let user = null;
  try { user = useAuth()?.user || null; } catch { user = null; }

  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState(() => uid('thread'));
  const [messages, setMessages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [threads, setThreads] = useState(() => loadThreads());

  const messagesRef = useRef(messages);
  const assistantIdRef = useRef(null);
  const abortRef = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;
  const locationRef = useRef(location);
  locationRef.current = location;

  const setMessagesSync = useCallback((fn) => {
    setMessages((prev) => {
      const next = fn(prev);
      messagesRef.current = next;
      return next;
    });
  }, []);

  const updateMsg = useCallback((id, fn) => {
    setMessagesSync((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
  }, [setMessagesSync]);

  const persist = useCallback((tid, msgs) => {
    const userMsgs = msgs.filter((m) => m.role === 'user');
    if (!userMsgs.length) return;
    const title = userMsgs[0].content.slice(0, 60);
    setThreads((prev) => {
      const rest = prev.filter((t) => t.id !== tid);
      const next = [{ id: tid, title, messages: msgs, updatedAt: Date.now() }, ...rest];
      saveThreads(next);
      return next;
    });
  }, []);

  const pageContext = useCallback(
    () => buildAppContext(locationRef.current?.pathname || '/', userRef.current),
    [],
  );

  const handleCustom = useCallback((ev, asstId) => {
    const name = ev.name;
    const value = ev.value || {};
    if (name === 'app.render_component') {
      if (ALLOWED_BLOCKS.has(value.component)) {
        updateMsg(asstId, (m) => ({ ...m, blocks: [...m.blocks, { component: value.component, props: value.props || {} }] }));
      }
    } else if (name === 'app.tool.set_params') {
      if (value.tool) {
        setToolParams(value.tool, value.params || {});
        updateMsg(asstId, (m) => ({ ...m, toolCalls: [...m.toolCalls, { id: uid('tc'), name: `⚙ ${value.tool}`, status: 'done' }] }));
      }
    } else if (name === 'app.navigate') {
      if (value.path && typeof window !== 'undefined' && typeof window.nav === 'function') {
        window.nav(value.path);
      }
    }
  }, [updateMsg]);

  const handleEvent = useCallback((ev, asstId) => {
    switch (ev.type) {
      case 'TextMessageStart':
        updateMsg(asstId, (m) => ({ ...m, status: 'streaming' }));
        break;
      case 'TextMessageContent':
        updateMsg(asstId, (m) => ({ ...m, content: m.content + (ev.delta || '') }));
        break;
      case 'ToolCallStart':
        updateMsg(asstId, (m) => ({ ...m, toolCalls: [...m.toolCalls, { id: ev.toolCallId, name: ev.toolCallName, status: 'running' }] }));
        break;
      case 'ToolCallResult':
        updateMsg(asstId, (m) => ({ ...m, toolCalls: m.toolCalls.map((t) => (t.id === ev.toolCallId ? { ...t, status: 'done' } : t)) }));
        break;
      case 'Custom':
        handleCustom(ev, asstId);
        break;
      case 'RunError':
        updateMsg(asstId, (m) => ({ ...m, status: 'error', content: m.content || "Une erreur est survenue côté assistant." }));
        break;
      default:
        break;
    }
  }, [updateMsg, handleCustom]);

  const sendMessage = useCallback(async (text) => {
    const content = String(text || '').trim();
    if (!content || isRunning) return;

    const userMsg = { id: uid('u'), role: 'user', content };
    const asstId = uid('a');
    const asstMsg = { id: asstId, role: 'assistant', content: '', blocks: [], toolCalls: [], status: 'thinking' };
    assistantIdRef.current = asstId;

    const history = [...messagesRef.current, userMsg]
      .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
      .map((m) => ({ id: m.id, role: m.role, content: m.content }));

    setMessagesSync((prev) => [...prev, userMsg, asstMsg]);
    setIsRunning(true);

    const ctx = pageContext();
    const input = {
      threadId,
      runId: uid('run'),
      messages: history,
      state: ctx,
      forwardedProps: ctx,
    };

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await runAgUI(getPracticeApiBase(), input, (ev) => handleEvent(ev, asstId), controller.signal);
    } catch (e) {
      if (e.name !== 'AbortError') {
        updateMsg(asstId, (m) => ({
          ...m,
          status: 'error',
          content: m.content || "Impossible de joindre l'assistant pour le moment. Vérifie que le backend est lancé, puis réessaie.",
        }));
      }
    } finally {
      setIsRunning(false);
      updateMsg(asstId, (m) => (m.status === 'error' ? m : { ...m, status: 'done' }));
      persist(threadId, messagesRef.current);
    }
  }, [isRunning, threadId, pageContext, handleEvent, setMessagesSync, updateMsg, persist]);

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setIsRunning(false);
  }, []);

  const newConversation = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setThreadId(uid('thread'));
    setMessagesSync(() => []);
    setIsRunning(false);
  }, [setMessagesSync]);

  const resumeThread = useCallback((tid) => {
    const t = threads.find((x) => x.id === tid);
    if (!t) return;
    setThreadId(t.id);
    setMessagesSync(() => t.messages || []);
  }, [threads, setMessagesSync]);

  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const value = useMemo(() => ({
    open, setOpen,
    threadId, messages, isRunning, threads,
    sendMessage, stop, newConversation, resumeThread,
    page: buildAppContext(location?.pathname || '/', user),
  }), [open, threadId, messages, isRunning, threads, sendMessage, stop, newConversation, resumeThread, location, user]);

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used within AgentProvider');
  return ctx;
}
