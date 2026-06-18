// AG-UI AgentDock — global launcher + conversational panel. Replaces the old
// mock ChatFab. DA-consistent (TPL red square avatar, panel/mono tokens).
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useAgent } from './AgentProvider';
import { suggestionsFor } from './appContext';
import { AgentUIBlockRenderer } from './uiblocks';
import './agent.css';

function Avatar({ size = 22 }) {
  return <span className="agui-avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>TPL</span>;
}

function ThinkingDots() {
  return (
    <span className="agui-thinking" aria-label="L'assistant réfléchit">
      <span /><span /><span />
    </span>
  );
}

function ToolChips({ calls }) {
  if (!calls?.length) return null;
  const LABELS = {
    rag_search: 'Recherche RAG', compute_black_scholes: 'Calcul Black-Scholes',
    generate_exercise: 'Génération exercice', navigate: 'Navigation', set_tool_params: 'Pilotage outil',
  };
  return (
    <div className="agui-toolchips">
      {calls.map((c) => (
        <span key={c.id} className={`agui-toolchip ${c.status}`}>
          <i className={`icon ${c.status === 'running' ? 'icon-loader' : 'icon-check'}`} />
          {LABELS[c.name] || c.name}
        </span>
      ))}
    </div>
  );
}

function AssistantMessage({ msg, onSuggest }) {
  const showThinking = msg.status === 'thinking' && !msg.content;
  return (
    <div className="agui-msg agui-msg-assistant">
      <Avatar size={26} />
      <div className="agui-msg-body">
        <ToolChips calls={msg.toolCalls} />
        {showThinking ? (
          <ThinkingDots />
        ) : (
          <div className="agui-md">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {msg.content || ''}
            </ReactMarkdown>
          </div>
        )}
        {msg.blocks?.map((b, i) => (
          <AgentUIBlockRenderer key={i} block={b} onSuggest={onSuggest} />
        ))}
      </div>
    </div>
  );
}

function Landing({ page, threads, onSuggest, onResume }) {
  const suggestions = suggestionsFor(page);
  const last = threads?.[0];
  return (
    <div className="agui-landing">
      <Avatar size={46} />
      <h3 className="agui-landing-title">Assistant pédagogique</h3>
      <p className="agui-landing-sub">
        Je connais la page où tu es ({page.pageTitle}). Pose-moi une question sur le concept,
        demande un exercice, ou laisse-moi piloter les outils pour te montrer une notion.
      </p>
      <div className="agui-suggestions">
        {suggestions.map((s) => (
          <button key={s} className="agui-chip" onClick={() => onSuggest(s)}>{s}</button>
        ))}
      </div>
      {last && (
        <button className="agui-resume" onClick={() => onResume(last.id)}>
          <i className="icon icon-history" /> Reprendre : <span className="mono">{last.title}</span>
        </button>
      )}
    </div>
  );
}

function Composer({ onSend, isRunning, onStop }) {
  const [text, setText] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [text]);

  const submit = () => {
    const t = text.trim();
    if (!t || isRunning) return;
    onSend(t);
    setText('');
  };

  return (
    <div className="agui-composer">
      <textarea
        ref={ref}
        rows={1}
        value={text}
        placeholder="Demande une explication, un exercice, ou « montre-moi la parité call-put »…"
        aria-label="Message à l'assistant"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
        }}
      />
      {isRunning ? (
        <button className="agui-send agui-stop" onClick={onStop} aria-label="Arrêter">
          <i className="icon icon-square" />
        </button>
      ) : (
        <button className="agui-send" onClick={submit} aria-label="Envoyer" disabled={!text.trim()}>
          <i className="icon icon-arrow-up" />
        </button>
      )}
    </div>
  );
}

export default function AgentDock() {
  const { open, setOpen, messages, isRunning, sendMessage, stop, newConversation, threads, resumeThread, page } = useAgent();
  const listRef = useRef(null);
  const atBottomRef = useRef(true);

  // Autoscroll only when the user is already at the bottom.
  useEffect(() => {
    const el = listRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  return (
    <>
      <button
        className={`agui-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}
      >
        <i className={`icon ${open ? 'icon-x' : 'icon-sparkles'}`} />
        {!open && <span className="agui-fab-dot" />}
      </button>

      {open && (
        <aside className="agui-panel" role="dialog" aria-label="Assistant pédagogique">
          <header className="agui-panel-head">
            <div className="agui-panel-title"><Avatar size={20} /> <span>Assistant TPL</span></div>
            <div className="agui-panel-actions">
              <button className="btn btn-ghost btn-sm" onClick={newConversation} aria-label="Nouvelle conversation">
                <i className="icon icon-plus" /> Nouveau
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Fermer">
                <i className="icon icon-x" />
              </button>
            </div>
          </header>

          <div className="agui-list" ref={listRef} onScroll={onScroll}>
            {messages.length === 0 ? (
              <Landing page={page} threads={threads} onSuggest={sendMessage} onResume={resumeThread} />
            ) : (
              messages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="agui-msg agui-msg-user">
                    <div className="agui-bubble-user">{m.content}</div>
                  </div>
                ) : (
                  <AssistantMessage key={m.id} msg={m} onSuggest={sendMessage} />
                ),
              )
            )}
          </div>

          <Composer onSend={sendMessage} isRunning={isRunning} onStop={stop} />
        </aside>
      )}
    </>
  );
}
