// AG-UI UIBlock renderer — renders ONLY allowlisted, typed component blocks
// emitted by the agent (never arbitrary model HTML). DA-consistent with the
// rest of the app (panel / mono / --red tokens).
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const ALLOWED_BLOCKS = new Set([
  // generic
  'summary_card', 'action_card', 'confirmation_card', 'metric_grid', 'data_table',
  'chart_block', 'form_block', 'suggestion_chips', 'progress_steps', 'error_card',
  'calculation_steps',
  // RAG
  'source_card', 'rag_source_block',
  // quant finance
  'latex_formula_block', 'derivation_steps_block', 'payoff_chart_block', 'payoff_block',
  'black_scholes_explorer_block', 'bs_pricer_block', 'greeks_sensitivity_block',
  'put_call_parity_block', 'monte_carlo_simulation_block', 'binomial_tree_block',
  'structured_product_payoff_block',
  // learning
  'exercise_block', 'quiz_block', 'answer_feedback_block', 'concept_map_block',
]);

const md = (children) => (
  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
    {children}
  </ReactMarkdown>
);

function nav(path) {
  if (typeof window !== 'undefined' && typeof window.nav === 'function') window.nav(path);
}

function SourceCard({ props }) {
  const sources = props?.sources || [];
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-book-open" /> Sources ({sources.length})</div>
      <div className="agui-block-body">
        {sources.map((s, i) => (
          <div key={i} className="agui-source">
            <div className="agui-source-title">[S{i + 1}] {s.title}</div>
            {typeof s.score === 'number' && <span className="agui-source-score mono">score {s.score}</span>}
            {s.snippet && <div className="agui-source-snippet">{s.snippet}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricGrid({ props }) {
  const metrics = props?.metrics || [];
  return (
    <div className="agui-block">
      {props?.title && <div className="agui-block-head"><i className="icon icon-calculator" /> {props.title}</div>}
      <div className="agui-metric-grid">
        {metrics.map((m, i) => (
          <div key={i} className="agui-metric">
            <div className="agui-metric-label mono">{m.label}</div>
            <div className="agui-metric-value mono">{String(m.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalculationSteps({ props }) {
  const steps = props?.steps || [];
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-list-checks" /> {props?.title || 'Calcul vérifié'}</div>
      <div className="agui-block-body">
        {steps.map((s, i) => (
          <div key={i} className="agui-step">
            <div className="agui-step-label">{s.label}</div>
            {s.formula && <div className="agui-step-formula mono">{s.formula}</div>}
            {s.result != null && <div className="agui-step-result mono">= {String(s.result)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function BsPricerBlock({ props }) {
  const p = props?.params || props || {};
  const rows = [
    ['Call', props?.call], ['Put', props?.put],
    ['C − P', props?.parity_lhs], ['S·e^(−qT) − K·e^(−rT)', props?.parity_rhs],
  ].filter((r) => r[1] != null);
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-trending-up" /> Black-Scholes</div>
      <div className="agui-metric-grid">
        {rows.map((r, i) => (
          <div key={i} className="agui-metric">
            <div className="agui-metric-label mono">{r[0]}</div>
            <div className="agui-metric-value mono">{String(r[1])}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => nav('/tools/bs-pricer')}>
        Ouvrir le pricer <i className="icon icon-arrow-right" />
      </button>
    </div>
  );
}

function PayoffBlock({ props }) {
  const legs = props?.legs || [];
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-activity" /> {props?.name || 'Payoff'}</div>
      <table className="agui-table mono">
        <thead><tr><th>Type</th><th>Sens</th><th>K</th><th>Qté</th><th>Prime</th></tr></thead>
        <tbody>
          {legs.map((l, i) => (
            <tr key={i}><td>{l.type}</td><td>{l.side}</td><td>{l.K}</td><td>{l.qty}</td><td>{l.prem}</td></tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => nav('/tools/payoff')}>
        Ouvrir le visualizer <i className="icon icon-arrow-right" />
      </button>
    </div>
  );
}

function ExerciseBlock({ props }) {
  const [open, setOpen] = useState(false);
  const pack = props?.calculation_pack;
  const steps = pack?.steps || [];
  return (
    <div className="agui-block agui-exercise">
      <div className="agui-block-head"><i className="icon icon-file-text" /> {props?.title || 'Exercice'}</div>
      <div className="agui-md">{md(props?.markdown || '')}</div>
      {(props?.sources?.length > 0) && (
        <div className="agui-exercise-sources mono">
          {props.sources.map((s, i) => <span key={i}>[S{i + 1}] {s.title}</span>)}
        </div>
      )}
      {(pack && steps.length > 0) && (
        <>
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen((o) => !o)}>
            {open ? 'Masquer' : 'Voir'} le corrigé chiffré vérifié
          </button>
          {open && (
            <div className="agui-block-body">
              {steps.map((s, i) => (
                <div key={i} className="agui-step">
                  <div className="agui-step-label">{s.label}</div>
                  {s.formula && <div className="agui-step-formula mono">{s.formula}</div>}
                  {s.substitution && <div className="agui-step-formula mono">{s.substitution}</div>}
                  {s.result != null && <div className="agui-step-result mono">= {String(s.result)}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DataTable({ props }) {
  const cols = props?.columns || [];
  const rows = props?.rows || [];
  return (
    <div className="agui-block">
      {props?.title && <div className="agui-block-head">{props.title}</div>}
      <table className="agui-table mono">
        <thead><tr>{cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{String(c)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function SuggestionChips({ props, onSuggest }) {
  const items = props?.items || [];
  return (
    <div className="agui-chips">
      {items.map((s, i) => (
        <button key={i} className="agui-chip" onClick={() => onSuggest && onSuggest(s)}>{s}</button>
      ))}
    </div>
  );
}

function ConfirmationCard({ props, onConfirm, onReject }) {
  return (
    <div className="agui-block agui-confirm">
      <div className="agui-block-head"><i className="icon icon-shield" /> {props?.title || 'Confirmer l’action'}</div>
      {props?.description && <div className="agui-block-body">{props.description}</div>}
      <div className="agui-confirm-actions">
        <button className="btn btn-primary btn-sm" onClick={() => onConfirm && onConfirm(props)}>Valider</button>
        <button className="btn btn-outline btn-sm" onClick={() => onReject && onReject(props)}>Annuler</button>
      </div>
    </div>
  );
}

function ErrorCard({ props }) {
  return (
    <div className="agui-block agui-error-card">
      <div className="agui-block-head"><i className="icon icon-alert-triangle" /> {props?.title || 'Action impossible'}</div>
      {props?.message && <div className="agui-block-body">{props.message}</div>}
    </div>
  );
}

// ---- SVG chart helpers ----------------------------------------------------
function MiniLine({ series, color = 'var(--red)', zeroLine = false, height = 150, fill = false }) {
  const pts = (series || []).filter((p) => p && isFinite(p.x) && isFinite(p.y));
  if (pts.length < 2) return null;
  const W = 320; const H = height; const pad = 22;
  const xs = pts.map((p) => p.x); const ys = pts.map((p) => p.y);
  let ymin = Math.min(...ys); let ymax = Math.max(...ys);
  if (zeroLine) { ymin = Math.min(ymin, 0); ymax = Math.max(ymax, 0); }
  if (ymin === ymax) { ymax += 1; ymin -= 1; }
  const xmin = Math.min(...xs); const xmax = Math.max(...xs);
  const X = (x) => pad + ((x - xmin) / (xmax - xmin || 1)) * (W - 2 * pad);
  const Y = (y) => H - pad - ((y - ymin) / (ymax - ymin || 1)) * (H - 2 * pad);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const z = zeroLine ? Y(0) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--line)" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--line)" />
      {z != null && <line x1={pad} y1={z} x2={W - pad} y2={z} stroke="var(--amber)" strokeDasharray="3 3" opacity="0.6" />}
      {fill && <path d={`${d} L ${X(xmax)} ${H - pad} L ${X(xmin)} ${H - pad} Z`} fill={color} opacity="0.08" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

function Histogram({ bars, color = 'var(--red)', height = 120 }) {
  const data = (bars || []).filter((b) => b && isFinite(b.count));
  if (!data.length) return null;
  const W = 320; const H = height; const pad = 18;
  const max = Math.max(...data.map((b) => b.count)) || 1;
  const bw = (W - 2 * pad) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      {data.map((b, i) => {
        const h = (b.count / max) * (H - 2 * pad);
        return <rect key={i} x={pad + i * bw + 1} y={H - pad - h} width={Math.max(bw - 2, 1)} height={h} fill={color} opacity="0.6" />;
      })}
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--line)" />
    </svg>
  );
}

function Grid({ rows }) {
  return (
    <div className="agui-metric-grid">
      {rows.filter((r) => r[1] != null).map((r, i) => (
        <div key={i} className="agui-metric">
          <div className="agui-metric-label mono">{r[0]}</div>
          <div className="agui-metric-value mono">{String(r[1])}</div>
        </div>
      ))}
    </div>
  );
}

// ---- Quant finance blocks -------------------------------------------------
function LatexFormulaBlock({ props }) {
  return (
    <div className="agui-block">
      <div className="agui-md" style={{ padding: 12 }}>{md(`$$${props?.latex || ''}$$`)}</div>
      {props?.caption && <div className="agui-block-body" style={{ borderTop: '1px solid var(--line)' }}>{md(props.caption)}</div>}
    </div>
  );
}

function DerivationStepsBlock({ props }) {
  const steps = props?.steps || [];
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-list-checks" /> {props?.title || 'Dérivation'}</div>
      <div className="agui-block-body">
        {steps.map((s, i) => (
          <div key={i} className="agui-step">
            {s.label && <div className="agui-step-label">{i + 1}. {s.label}</div>}
            {s.latex && <div className="agui-md">{md(`$$${s.latex}$$`)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PayoffChartBlock({ props }) {
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-activity" /> {props?.name || 'Payoff'}</div>
      <div style={{ padding: 8 }}><MiniLine series={props?.curve} zeroLine fill /></div>
      <Grid rows={[['Gain max', props?.max_gain], ['Perte max', props?.max_loss], ['Break-even', (props?.breakevens || []).join(', ') || '—'], ['Prime nette', props?.net_premium]]} />
    </div>
  );
}

function BlackScholesExplorerBlock({ props }) {
  const g = props?.result || {};
  const p = props?.params || {};
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-sliders" /> Black-Scholes — {`S=${p.S} K=${p.K} σ=${p.sigma}% T=${p.T}j`}</div>
      <Grid rows={[
        ['Call', g.call], ['Put', g.put], ['Delta', g.delta_call], ['Gamma', g.gamma],
        ['Vega', g.vega], ['Theta', g.theta_call], ['Rho', g.rho_call],
      ]} />
      <button className="btn btn-outline btn-sm" style={{ margin: 10 }} onClick={() => nav('/tools/bs-pricer')}>Ouvrir le pricer <i className="icon icon-arrow-right" /></button>
    </div>
  );
}

function GreeksSensitivityBlock({ props }) {
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-trending-up" /> {`${props?.greek || 'Greek'} vs ${props?.param || 'paramètre'}`}</div>
      <div style={{ padding: 8 }}><MiniLine series={props?.series} /></div>
    </div>
  );
}

function PutCallParityBlock({ props }) {
  const r = props?.result || {};
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-scale" /> Parité call-put</div>
      <div className="agui-md" style={{ padding: 12 }}>{md('$$C - P = S\\,e^{-qT} - K\\,e^{-rT}$$')}</div>
      <Grid rows={[
        ['Call', r.call], ['Put', r.put], ['C − P', r.parity_lhs],
        ['S·e^(−qT) − K·e^(−rT)', r.parity_rhs], ['Parité vérifiée', r.parity_holds ? '✓ Vrai' : '✗'],
      ]} />
    </div>
  );
}

function MonteCarloSimulationBlock({ props }) {
  const paths = props?.paths || [];
  const W = 320; const H = 150; const pad = 16;
  const all = paths.flat();
  const ymin = Math.min(...all); const ymax = Math.max(...all);
  const X = (i, n) => pad + (i / (n - 1 || 1)) * (W - 2 * pad);
  const Y = (v) => H - pad - ((v - ymin) / ((ymax - ymin) || 1)) * (H - 2 * pad);
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-git-branch" /> Monte Carlo — {props?.n} trajectoires</div>
      {paths.length > 0 && (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ padding: 8 }}>
          {paths.map((p, i) => (
            <path key={i} d={p.map((v, j) => `${j === 0 ? 'M' : 'L'} ${X(j, p.length).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')} fill="none" stroke="var(--red)" strokeWidth="0.6" opacity="0.45" />
          ))}
        </svg>
      )}
      <div style={{ padding: 8 }}><Histogram bars={props?.histogram} /></div>
      <Grid rows={[['Moyenne terminale', props?.terminal_mean], ['p5', props?.p5], ['p95', props?.p95]]} />
    </div>
  );
}

function BinomialTreeBlock({ props }) {
  const nodes = props?.nodes || [];
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-git-merge" /> Arbre binomial — prix {props?.price}</div>
      <div className="agui-block-body" style={{ overflowX: 'auto' }}>
        <table className="agui-table mono">
          <tbody>
            {nodes.map((level, i) => (
              <tr key={i}><td>t{i}</td>{level.map((v, j) => <td key={j}>{v}</td>)}</tr>
            ))}
          </tbody>
        </table>
        <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', marginTop: 6 }}>u={props?.u} d={props?.d} p*={props?.p}</div>
      </div>
    </div>
  );
}

function StructuredProductPayoffBlock({ props }) {
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-box" /> Produit structuré — {props?.kind}</div>
      <div style={{ padding: 8 }}><MiniLine series={props?.curve} color="var(--blue)" zeroLine /></div>
      <div className="agui-block-body">
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {(props?.scenarios || []).map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
        </ul>
      </div>
    </div>
  );
}

function QuizBlock({ props }) {
  const [sel, setSel] = useState(null);
  const options = props?.options || [];
  const answered = sel != null;
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-help-circle" /> Quiz</div>
      <div className="agui-block-body">
        <div className="agui-md">{md(props?.question || '')}</div>
        <div className="agui-chips" style={{ marginTop: 10 }}>
          {options.map((o) => {
            const isAnswer = o.id === props?.answer;
            const cls = answered ? (isAnswer ? 'agui-chip quiz-correct' : (o.id === sel ? 'agui-chip quiz-wrong' : 'agui-chip')) : 'agui-chip';
            return <button key={o.id} className={cls} disabled={answered} onClick={() => setSel(o.id)}>{o.label}</button>;
          })}
        </div>
        {answered && props?.explanation && (
          <div className="agui-md" style={{ marginTop: 10, color: sel === props?.answer ? 'var(--green)' : 'var(--text-2)' }}>
            {md((sel === props?.answer ? '**Correct.** ' : '**Pas tout à fait.** ') + props.explanation)}
          </div>
        )}
      </div>
    </div>
  );
}

function AnswerFeedbackBlock({ props }) {
  const V = { correct: ['var(--green)', '✓ Correct'], partial: ['var(--amber)', '~ Partiel'], incorrect: ['var(--red)', '✗ À revoir'] };
  const [color, label] = V[props?.verdict] || V.partial;
  const list = (title, items, c) => (items?.length ? (
    <div style={{ marginTop: 8 }}><div className="mono" style={{ fontSize: 11, color: c }}>{title}</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
  ) : null);
  return (
    <div className="agui-block">
      <div className="agui-block-head" style={{ color }}><i className="icon icon-clipboard-check" /> Correction — {label}{props?.score != null ? ` (${props.score}/100)` : ''}</div>
      <div className="agui-block-body">
        {list('Ce qui est juste', props?.correct, 'var(--green)')}
        {list('Ce qui manque / est faux', props?.wrong, 'var(--red)')}
        {list('Comment améliorer', props?.improve, 'var(--amber)')}
        {props?.solution && <div style={{ marginTop: 8 }}><div className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>Solution</div><div className="agui-md">{md(props.solution)}</div></div>}
      </div>
    </div>
  );
}

function ConceptMapBlock({ props }) {
  const chip = (label, items) => (items?.length ? (
    <div style={{ marginTop: 8 }}><div className="mono" style={{ fontSize: 10, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
      <div className="agui-toolchips" style={{ marginTop: 4 }}>{items.map((c, i) => <span key={i} className="agui-toolchip">{c}</span>)}</div></div>
  ) : null);
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-share-2" /> Carte conceptuelle</div>
      <div className="agui-block-body">
        <div className="mono" style={{ fontSize: 15, color: 'var(--text)', fontWeight: 700 }}>{props?.central}</div>
        {chip('Prérequis', props?.prerequisites)}
        {chip('Concepts liés', props?.related)}
        {props?.next && <div style={{ marginTop: 8 }} className="mono">→ Suivant : <span style={{ color: 'var(--red)' }}>{props.next}</span></div>}
      </div>
    </div>
  );
}

// ---- Generic blocks -------------------------------------------------------
function SummaryCard({ props }) {
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-bookmark" /> {props?.title || 'Résumé'}</div>
      <div className="agui-block-body">
        <ul style={{ margin: 0, paddingLeft: 16 }}>{(props?.points || []).map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}</ul>
      </div>
    </div>
  );
}

function ActionCard({ props, onSuggest }) {
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-zap" /> {props?.title || 'Action'}</div>
      {props?.description && <div className="agui-block-body">{props.description}</div>}
      <div className="agui-confirm-actions">
        {(props?.actions || []).map((a, i) => (
          <button key={i} className={`btn btn-${i === 0 ? 'primary' : 'outline'} btn-sm`} onClick={() => onSuggest && onSuggest(a.prompt || a.label)}>{a.label}</button>
        ))}
      </div>
    </div>
  );
}

function ProgressSteps({ props }) {
  return (
    <div className="agui-block">
      {props?.title && <div className="agui-block-head">{props.title}</div>}
      <div className="agui-block-body">
        {(props?.steps || []).map((s, i) => (
          <div key={i} className="agui-step" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <i className={`icon ${s.done ? 'icon-check' : 'icon-circle'}`} style={{ color: s.done ? 'var(--green)' : 'var(--mute)' }} />
            <span style={{ color: s.done ? 'var(--text)' : 'var(--text-2)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartBlock({ props }) {
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-bar-chart-2" /> {props?.title || 'Graphique'}</div>
      <div style={{ padding: 8 }}><MiniLine series={props?.series} zeroLine={!!props?.zeroLine} /></div>
    </div>
  );
}

function FormBlock({ props, onSuggest }) {
  const [vals, setVals] = useState({});
  const fields = props?.fields || [];
  return (
    <div className="agui-block">
      <div className="agui-block-head"><i className="icon icon-edit" /> {props?.title || 'Formulaire'}</div>
      <div className="agui-block-body">
        {fields.map((f) => (
          <div key={f.name} className="field" style={{ marginBottom: 8 }}>
            <label className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>{f.label || f.name}</label>
            <input className="agui-form-input" value={vals[f.name] || ''} placeholder={f.placeholder || ''} onChange={(e) => setVals((v) => ({ ...v, [f.name]: e.target.value }))} />
          </div>
        ))}
        <button className="btn btn-primary btn-sm" onClick={() => onSuggest && onSuggest(`${props?.submitPrompt || 'Voici mes réponses'}: ${JSON.stringify(vals)}`)}>{props?.submitLabel || 'Envoyer'}</button>
      </div>
    </div>
  );
}

const REGISTRY = {
  // generic
  summary_card: SummaryCard,
  action_card: ActionCard,
  confirmation_card: ConfirmationCard,
  metric_grid: MetricGrid,
  data_table: DataTable,
  chart_block: ChartBlock,
  form_block: FormBlock,
  suggestion_chips: SuggestionChips,
  progress_steps: ProgressSteps,
  error_card: ErrorCard,
  calculation_steps: CalculationSteps,
  // RAG
  source_card: SourceCard,
  rag_source_block: SourceCard,
  // quant finance
  latex_formula_block: LatexFormulaBlock,
  derivation_steps_block: DerivationStepsBlock,
  payoff_chart_block: PayoffChartBlock,
  payoff_block: PayoffBlock,
  black_scholes_explorer_block: BlackScholesExplorerBlock,
  bs_pricer_block: BsPricerBlock,
  greeks_sensitivity_block: GreeksSensitivityBlock,
  put_call_parity_block: PutCallParityBlock,
  monte_carlo_simulation_block: MonteCarloSimulationBlock,
  binomial_tree_block: BinomialTreeBlock,
  structured_product_payoff_block: StructuredProductPayoffBlock,
  // learning
  exercise_block: ExerciseBlock,
  quiz_block: QuizBlock,
  answer_feedback_block: AnswerFeedbackBlock,
  concept_map_block: ConceptMapBlock,
};

export function AgentUIBlockRenderer({ block, onSuggest, onConfirm, onReject }) {
  if (!block || !ALLOWED_BLOCKS.has(block.component)) return null;
  const Cmp = REGISTRY[block.component];
  if (!Cmp) return null;
  return <Cmp props={block.props || {}} onSuggest={onSuggest} onConfirm={onConfirm} onReject={onReject} />;
}
