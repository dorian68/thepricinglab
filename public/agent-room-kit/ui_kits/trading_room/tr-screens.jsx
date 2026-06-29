/* Trading Room — screens → window (TRScreens) */
(function () {
  const NS = window.ThePricingLibraryDesignSystem_f20ac6;
  const { Panel, Button, Badge, Input, Tabs, SegmentedToggle, StatCard, Sparkline,
          LineChart, PayoffChart, OrderBook, VolHeatmap, Donut,
          AgentNode, IdeaCard, LearningTip, MetricRow, RfqHeader } = NS;
  const Icon = window.TRIcon;
  const TR = window.TR;

  const mono = (s) => ({ fontFamily: 'var(--font-mono)', ...s });
  const label = { fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' };

  /* ---------- shared right-rail market snapshot ---------- */
  function MarketSnapshot({ title = 'Market Context', live = true }) {
    const [tf, setTf] = React.useState('3M');
    return (
      <Panel title={title} live={live}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={mono({ fontSize: 13, color: 'var(--text-secondary)' })}>WTI Crude Oil</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span style={mono({ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' })}>78.42</span>
          <span style={mono({ fontSize: 11, color: 'var(--text-muted)' })}>USD/bbl</span>
          <span style={mono({ fontSize: 12, color: 'var(--green-500)', marginLeft: 'auto' })}>+1.32%</span>
        </div>
        <div style={{ margin: '8px 0 6px' }}>
          <LineChart data={TR.wtiSeries} tone="red" height={130} xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']} />
        </div>
        <SegmentedToggle value={tf} onChange={setTf} options={['1D', '1W', '1M', '3M', '1Y']} />
      </Panel>
    );
  }

  function ExampleChips() {
    const ex = ['Price a 5Y EUR Callable Note', 'Hedge rising rates', 'Inflation protection'];
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <span style={{ ...label, marginRight: 2 }}>Examples:</span>
        {ex.map((e, i) => (
          <span key={i} style={mono({ fontSize: 12, color: 'var(--text-secondary)', padding: '5px 10px', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' })}>{e}</span>
        ))}
        <span style={mono({ fontSize: 12, color: 'var(--text-muted)', padding: '5px 10px', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' })}>More ▾</span>
      </div>
    );
  }

  /* =====================================================================
     RFQ COCKPIT
     ===================================================================== */
  function RfqCockpit({ onNav }) {
    const go = (id) => onNav && onNav(id);
    const [q, setQ] = React.useState("J'ai peur que le pétrole augmente dans 5 mois, que me proposez-vous ?");
    const [sel, setSel] = React.useState(0);
    const [res, setRes] = React.useState(null);   // live desk-agent result
    const [busy, setBusy] = React.useState(false);
    const send = async () => {
      if (!q.trim()) return;
      setBusy(true);
      try {
        const r = await fetch(window.TR_API + '/agent/desk/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
        if (r.ok) setRes(await r.json());
      } catch (e) { /* backend offline -> keep static demo */ }
      setBusy(false);
    };
    const p = res && res.parsed;
    const interp = [
      { ic: 'shuffle', t: 'Request Type', v: p ? p.intention : 'Market Concern', d: 'You want to express a view or hedge a risk.' },
      { ic: 'flame', t: 'Underlying / Risk Factor', v: p ? p.underlying : 'Crude Oil (WTI)', d: p ? `Detected risk factor: ${p.underlying}.` : 'Concern about potential increase in oil price.' },
      { ic: 'calendar', t: 'Horizon', v: p ? p.horizon : '~ 5 Months', d: 'Short to medium-term view.' },
      { ic: 'target', t: 'Objective', v: p ? p.view : 'Hedge / Protect', d: p ? `Routed to the ${res.desk} desk.` : 'Reduce downside risk from oil price rise.' },
    ];
    return (
      <ScreenGrid rail={
        <>
          <MarketSnapshot title="Market Context" />
          <Panel title="Key Drivers">
            <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Geopolitical tensions in Middle East impacting supply risk.', 'OPEC+ production cuts extended.', 'Summer demand season approaching.', 'Inventories slightly below 5Y average.'].map((d, i) => (
                <li key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, lineHeight: 1.45, color: 'var(--text-secondary)' }}>{d}</li>
              ))}
            </ul>
          </Panel>
          <LearningTip label="Learning Tip" icon={<Icon name="graduation-cap" size={14} />} linkLabel="Learn more about Oil Derivatives">
            Rising oil price expectation = you want instruments that increase in value when oil goes up.
          </LearningTip>
          <Panel title="Your Recent RFQs">
            {[['Hedge rising rates', '2h ago'], ['5Y EUR Callable Note', '1d ago'], ['Inflation protection idea', '2d ago']].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={mono({ fontSize: 12, color: 'var(--text-secondary)' })}>{r[0]}</span>
                <span style={mono({ fontSize: 11, color: 'var(--text-dim)' })}>{r[1]}</span>
              </div>
            ))}
            <a style={{ ...mono({ fontSize: 12 }), color: 'var(--blue-500)', display: 'inline-block', marginTop: 8 }}>View all →</a>
          </Panel>
        </>
      }>
        <Panel title="1. What is your request?">
          <p style={{ margin: '0 0 12px', ...mono({ fontSize: 12, color: 'var(--text-muted)' }) }}>Ask in natural language. Our agents will handle the rest.</p>
          <Input as="textarea" accent rows={2} value={q} onChange={(e) => setQ(e.target.value)}
            suffix={
              <button onClick={send} disabled={busy} style={{ background: 'var(--red-500)', border: 'none', borderRadius: 'var(--radius-sm)', width: 38, height: 38, cursor: 'pointer', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}>
                <Icon name={busy ? 'loader-2' : 'send'} size={16} color="#fff" />
              </button>
            } />
          {res && <div style={{ marginTop: 8, ...mono({ fontSize: 11, color: 'var(--green-500)' }) }}>● Routed to the {res.desk} desk · {res.agents.length} agents · est. {res.pricing.est_price}{res.pricing.unit}</div>}
          <div style={{ textAlign: 'right', marginTop: 4, ...mono({ fontSize: 11, color: 'var(--text-dim)' }) }}>{q.length} / 500</div>
          <ExampleChips />
        </Panel>

        <Panel title="2. RFQ Interpretation" right={<span style={label}>Detected by Sales Agent</span>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {interp.map((c, i) => (
              <div key={i} style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: 'var(--text-muted)' }}><Icon name={c.ic} size={14} /><span style={label}>{c.t}</span></div>
                <div style={mono({ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 })}>{c.v}</div>
                <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 11.5, lineHeight: 1.45, color: 'var(--text-muted)' }}>{c.d}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="3. Possible Approaches" right={<span style={label}>Suggested by Structurer Agent</span>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {TR.ideas.map((idea, i) => (
              <IdeaCard key={i} {...idea} selected={sel === i} onClick={() => setSel(i)} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <span style={mono({ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' })}>See all ideas (6) →</span>
          </div>
        </Panel>

        <Panel title="4. Next Step" right={<span style={label}>Recommended</span>}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--red-700)', background: 'var(--red-tint)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red-500)' }}><Icon name="zap" size={16} /></span>
            <div>
              <div style={mono({ fontSize: 13, color: 'var(--text-primary)' })}>Select an approach above to build the product and get a pricing.</div>
              <div style={mono({ fontSize: 12, color: 'var(--text-muted)' })}>You can modify parameters in the Product Builder.</div>
            </div>
            <div style={{ marginLeft: 'auto' }}><Button variant="primary" onClick={() => go('builder')} iconRight={<Icon name="arrow-right" size={15} color="#fff" />}>Go to Product Builder</Button></div>
          </div>
        </Panel>
      </ScreenGrid>
    );
  }

  /* =====================================================================
     AGENT ROOM
     ===================================================================== */
  function AgentRoom() {
    const [view, setView] = React.useState('Pipeline');
    const logRows = [
      ['15:42:17', 'Sales Agent received request', 'red'], ['15:42:25', 'Structurer generated 4 ideas', 'amber'],
      ['15:42:32', 'Market Data loaded 4 datasets', 'blue'], ['15:42:44', 'Quant Agent selected model', 'purple'],
      ['15:42:56', 'Pricing completed', 'green'], ['15:43:02', 'Trader generated quote', 'amber'],
      ['15:43:10', 'Risk Manager approved', 'blue'], ['15:43:24', 'PnL & Greeks updated', 'green'],
    ];
    return (
      <ScreenGrid rail={
        <>
          <MarketSnapshot title="Live Market Snapshot" />
          <Panel title="Workflow Log" live liveLabel="Live">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {logRows.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: `var(--${r[2]}-500)`, flex: 'none' }} />
                  <span style={mono({ fontSize: 11, color: 'var(--text-dim)' })}>{r[0]}</span>
                  <span style={mono({ fontSize: 11.5, color: 'var(--text-secondary)' })}>{r[1]}</span>
                </div>
              ))}
            </div>
          </Panel>
        </>
      }>
        <Panel title="Agent Workflow" right={<SegmentedToggle value={view} onChange={setView} options={['Pipeline', 'Map']} />}>
          <p style={{ margin: '0 0 14px', ...mono({ fontSize: 12, color: 'var(--text-muted)' }) }}>Our agents collaborate like a real desk to turn your request into a desk-ready answer.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {TR.agents.map((a, i) => (
              <AgentNode key={i} index={a.i} name={a.name} icon={<Icon name={a.icon} size={15} />} hue={a.hue}
                status={a.status} description={a.desc} rows={a.rows} elapsed={a.elapsed} progress={a.progress}
                active={a.progress > 0 && a.progress < 1} />
            ))}
          </div>
        </Panel>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12 }}>
          <Panel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Icon name="sparkles" size={15} color="var(--cyan-500)" /><span style={label}>What's Happening?</span></div>
            <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>Our agents are working in sequence, sharing insights and data. You can explore results as they become available or wait for the full analysis.</p>
          </Panel>
          <Panel>
            <span style={label}>Estimated Completion</span>
            <div style={mono({ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', margin: '6px 0' })}>00:45</div>
            <span style={mono({ fontSize: 11, color: 'var(--text-muted)' })}>Total Elapsed <span style={{ color: 'var(--green-500)' }}>01:17</span></span>
          </Panel>
          <Panel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Donut size={76} thickness={9} center={{ value: '87%' }} segments={[{ value: 87, color: 'var(--cyan-500)' }, { value: 13, color: 'var(--bg-elevated)' }]} />
              <div>
                <span style={label}>Confidence Score</span>
                <div style={mono({ fontSize: 16, fontWeight: 700, color: 'var(--green-500)', margin: '4px 0' })}>High</div>
                <span style={mono({ fontSize: 11, color: 'var(--text-muted)' })}>Strong data quality</span>
              </div>
            </div>
          </Panel>
        </div>
      </ScreenGrid>
    );
  }

  /* =====================================================================
     TRADER VIEW
     ===================================================================== */
  function TraderView() {
    const stats = [
      { label: 'Theo Price', value: '3.45', unit: '/bbl' },
      { label: 'Bid', value: '3.30', unit: '/bbl', valueColor: 'var(--red-500)', accent: true },
      { label: 'Ask', value: '3.60', unit: '/bbl', valueColor: 'var(--green-500)' },
      { label: 'Spread', value: '0.30', unit: '/bbl', sub: '8.70%' },
      { label: 'Mid', value: '3.45', unit: '/bbl' },
      { label: 'Your Quote', value: '3.30/3.60', valueColor: 'var(--purple-400)', sub: 'Size: $5.0M' },
    ];
    const trades = [['15:42:16', '78.44', '215', 'B'], ['15:42:14', '78.43', '160', 'S'], ['15:42:12', '78.42', '320', 'B'], ['15:42:10', '78.42', '180', 'S']];
    return (
      <ScreenGrid rail={
        <>
          <MarketSnapshot title="Live Market Snapshot" />
          <Panel title="Key Levels">
            {[['Resistance 2', '82.50', 'red'], ['Resistance 1', '80.20', 'red'], ['Current Price', '78.42', 'blue'], ['Support 1', '76.10', 'green'], ['Support 2', '74.00', 'green']].map((k, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: `var(--${k[2]}-500)` }} />
                <span style={mono({ fontSize: 12, color: 'var(--text-secondary)' })}>{k[0]}</span>
                <span style={mono({ fontSize: 12, color: 'var(--text-primary)', marginLeft: 'auto' })}>{k[1]}</span>
              </div>
            ))}
          </Panel>
          <Panel title="News Flow">
            {[['15:41', 'OPEC+ hints at supply cuts extension'], ['15:38', 'China demand outlook revised up'], ['15:33', 'US inventories down 2.1M barrels']].map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0' }}>
                <span style={mono({ fontSize: 11, color: 'var(--text-dim)' })}>{n[0]}</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)' }}>{n[1]}</span>
              </div>
            ))}
          </Panel>
        </>
      }>
        <Panel pad={false} style={{ background: 'transparent', border: 'none' }}>
          <RfqHeader title="Trader View" subtitle="Desk execution, hedging strategy and live market context."
            rfqId={TR.rfqId} savedAt={TR.savedAt}
            right={<Button variant="secondary" icon={<Icon name="upload" size={14} />}>Export Quote</Button>} />
        </Panel>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr 1fr', gap: 12 }}>
          <Panel title="Quote Management">
            <div style={{ ...label, marginBottom: 6 }}>Side</div>
            <SegmentedToggle value="bid" onChange={() => {}} options={[{ id: 'bid', label: 'Bid / Offer' }, { id: 'mid', label: 'Mid' }]} />
            <div style={{ ...label, margin: '14px 0 6px' }}>Quantity</div>
            <Input value="5,000,000" icon={<span style={mono({ color: 'var(--text-muted)' })}>$</span>} />
            <div style={{ ...label, margin: '14px 0 6px' }}>Valid For</div>
            <Input value="2 Hours" suffix={<Icon name="chevron-down" size={14} />} />
            <div style={{ marginTop: 16 }}>
              <Button variant="primary" fullWidth iconRight={<Icon name="send" size={14} color="#fff" />}>Send Quote to Client</Button>
            </div>
          </Panel>

          <Panel title="Hedging Strategy">
            <Tabs dense value="rec" onChange={() => {}} items={[{ id: 'rec', label: 'Recommended' }, { id: 'alt', label: 'Alternative' }, { id: 'cust', label: 'Custom' }]} />
            <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={mono({ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' })}>Dynamic Delta Hedge</span>
                <Badge kind="approved" size="sm">Recommended</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <MetricRow label="Hedge Ratio (Δ)" value="0.62" />
                <MetricRow label="Hedge Notional" value="$3.10M" />
                <MetricRow label="Residual Δ" value="0.04" />
                <MetricRow label="Effectiveness" value="87%" change="" />
              </div>
            </div>
          </Panel>

          <Panel title="Market Depth (WTI Futures)">
            <OrderBook bids={TR.bids} asks={TR.asks} mid="78.42" spread="0.01" highlight={78.44} />
            <div style={{ ...label, margin: '12px 0 6px' }}>Last Trades</div>
            {trades.map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, padding: '4px 0' }}>
                <span style={mono({ fontSize: 11, color: 'var(--text-muted)' })}>{t[0]}</span>
                <span style={mono({ fontSize: 11, color: 'var(--text-primary)' })}>{t[1]}</span>
                <span style={mono({ fontSize: 11, color: 'var(--text-secondary)' })}>{t[2]}</span>
                <span style={mono({ fontSize: 11, color: t[3] === 'B' ? 'var(--green-500)' : 'var(--red-500)' })}>{t[3]}</span>
              </div>
            ))}
          </Panel>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <Panel title="Position Summary">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Donut size={120} thickness={15} center={{ value: '', label: '' }} segments={[{ value: 6, color: 'var(--blue-500)' }, { value: 12, color: 'var(--purple-500)' }, { value: 28, color: 'var(--amber-500)' }, { value: 4, color: 'var(--cyan-500)' }, { value: 50, color: 'var(--bg-elevated)' }]} />
            </div>
          </Panel>
          <Panel title="Risk Exposure">
            <MetricRow label="Delta (Abs)" value="0.04" />
            <MetricRow label="VaR 1d (95%)" value="$64,200" />
            <MetricRow label="Expected Shortfall" value="$89,430" />
            <MetricRow label="Stress Loss (±10%)" value="$112,000" />
          </Panel>
          <Panel title="Quick Actions">
            {[['refresh-cw', 'Rebalance Hedge'], ['activity', 'Simulate Re-Hedge'], ['help-circle', 'What-if Scenario'], ['thermometer', 'Run Stress Test']].map((a, i) => (
              <button key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '9px 11px', marginBottom: 8, cursor: 'pointer', color: 'var(--text-secondary)', ...mono({ fontSize: 12 }) }}>
                <Icon name={a[0]} size={14} color="var(--text-muted)" />{a[1]}
              </button>
            ))}
          </Panel>
          <Panel title="Trader Notes">
            <Input as="textarea" rows={4} placeholder="Add your notes…" />
            <div style={{ marginTop: 8, ...mono({ fontSize: 11, color: 'var(--text-dim)' }) }}>Last updated by you 15:41:02</div>
          </Panel>
        </div>
      </ScreenGrid>
    );
  }

  /* =====================================================================
     DASHBOARD (master agent room)
     ===================================================================== */
  function Dashboard({ onNav }) {
    const go = (id) => onNav && onNav(id);
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr 0.7fr', gap: 12, alignItems: 'start' }}>
          {/* hero */}
          <div style={{ position: 'relative', padding: '6px 4px' }}>
            <div style={{ ...label, color: 'var(--red-500)', marginBottom: 12 }}>Agentic Trading Room · Fixed Income Desk</div>
            <h1 style={mono({ fontSize: 42, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 })}>
              From any market<br />question to a <span style={{ color: 'var(--red-500)' }}>desk-<br />ready</span> answer.
            </h1>
            <p style={{ margin: '16px 0 16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 360 }}>Ask anything. Our agents structure, price, and analyze financial products for you.</p>
            <Input accent value="J'ai peur que le pétrole augmente dans 5 mois, que me proposez-vous ?"
              suffix={<Button variant="primary" size="sm" onClick={() => go('rfq')} iconRight={<Icon name="send" size={13} color="#fff" />}>Send</Button>} />
            <ExampleChips />
          </div>
          {/* SPX panel */}
          <Panel title="SPX · S&P 500 Index">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={mono({ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' })}>5,872.34</span>
              <Badge kind="positive" size="sm">+0.31%</Badge>
            </div>
            <LineChart data={TR.spxSeries} theoretical={TR.spxTheo} tone="red" height={170} xLabels={['17-6', '18-6', '19-6', '20-6', '21-6']} />
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={mono({ fontSize: 11, color: 'var(--red-500)' })}>— SPX</span>
              <span style={mono({ fontSize: 11, color: 'var(--blue-500)' })}>-- Theoretical (Mid)</span>
            </div>
          </Panel>
          {/* vol + order book */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Panel title="Vol Surface · SPX">
              <VolHeatmap matrix={TR.volHeat} rowLabels={['80%', '100%', '120%', '', '']} colLabels={['1M', '6M', '1Y', '2Y', '5Y']} cell={20} />
            </Panel>
            <Panel title="Order Book · SPX">
              <OrderBook bids={TR.bids.slice(0, 3).map((b, i) => ({ price: (5872.18 - i * 0.2).toFixed(2), size: b.size }))}
                asks={TR.asks.slice(0, 3).map((a, i) => ({ price: (5872.00 + i * 0.2).toFixed(2), size: a.size }))} mid="5,872.34" spread="0.16" />
            </Panel>
          </div>
        </div>

        {/* agent pipeline strip */}
        <Panel title="Agent Room · Task in Progress">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 10 }}>
            {TR.agents.slice(0, 8).map((a, i) => (
              <div key={i} style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 10, textAlign: 'center' }}>
                <div style={{ color: `var(--${a.hue}-500)`, display: 'flex', justifyContent: 'center', marginBottom: 6 }}><Icon name={a.icon} size={18} /></div>
                <div style={mono({ fontSize: 11, color: 'var(--text-primary)', marginBottom: 6 })}>{a.name}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.progress >= 1 ? 'var(--green-500)' : `var(--${a.hue}-500)` }} />
                  <span style={mono({ fontSize: 10, color: 'var(--text-muted)' })}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  /* ---------- layout helper: main column + right rail ---------- */
  function ScreenGrid({ children, rail }) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) var(--rail-w)', gap: 12, padding: 16, overflow: 'auto', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>{children}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{rail}</div>
      </div>
    );
  }

  /* =====================================================================
     PRODUCT BUILDER
     ===================================================================== */
  function ProductBuilder({ onNav }) {
    const go = (id) => onNav && onNav(id);
    const [type, setType] = React.useState('Call Option (WTI)');
    const types = ['Call Option (WTI)', 'Call Spread', 'Collar', 'Future (Long)', 'Commodity Note'];
    const param = (lab, val, suffix) => (
      <div style={{ marginBottom: 12 }}>
        <div style={{ ...label, marginBottom: 6 }}>{lab}</div>
        <Input value={val} suffix={suffix} />
      </div>
    );
    return (
      <ScreenGrid rail={<><MarketSnapshot title="Market Context" /><LearningTip label="Learning Tip" icon={<Icon name="graduation-cap" size={14} />} linkLabel="How payoffs work">A call option gains value when the underlying rises above the strike; your max loss is the premium paid.</LearningTip></>}>
        <Panel pad={false} style={{ background: 'transparent', border: 'none' }}>
          <RfqHeader title="Product Builder" subtitle="Configure the structure, parameters and payoff." rfqId={TR.rfqId} savedAt={TR.savedAt}
            right={<Button variant="primary" onClick={() => go('pricing')} iconRight={<Icon name="arrow-right" size={14} color="#fff" />}>Price This Product</Button>} />
        </Panel>
        <Panel title="Product Type">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {types.map((t, i) => (
              <button key={i} onClick={() => setType(t)} style={{ textAlign: 'left', cursor: 'pointer', background: type === t ? 'var(--red-tint)' : 'var(--bg-inset)', border: `1px solid ${type === t ? 'var(--red-600)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', padding: 11, color: 'var(--text-primary)' }}>
                <div style={mono({ fontSize: 12.5, fontWeight: 600 })}>{t}</div>
                <div style={{ marginTop: 8 }}><PayoffChart strike={85} spot={78.42} height={56} /></div>
              </button>
            ))}
          </div>
        </Panel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
          <Panel title="Parameters">
            {param('Notional', '1,000,000', <span style={mono({ color: 'var(--text-muted)' })}>USD</span>)}
            {param('Strike', '85.00', <span style={mono({ color: 'var(--text-muted)' })}>/bbl</span>)}
            {param('Maturity', '5 Months', <Icon name="chevron-down" size={14} />)}
            {param('Premium (est.)', '3.45', <span style={mono({ color: 'var(--text-muted)' })}>/bbl</span>)}
          </Panel>
          <Panel title="Payoff Preview" right={<span style={label}>at maturity</span>}>
            <PayoffChart strike={85} spot={78.42} height={210} showBreakeven />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 12 }}>
              <StatCard label="Est. Price" value="3.45" unit="/bbl" />
              <StatCard label="Break-even" value="88.45" />
              <StatCard label="Max Loss" value="345" />
              <StatCard label="Max Profit" value="∞" valueColor="var(--red-500)" />
            </div>
          </Panel>
        </div>
      </ScreenGrid>
    );
  }

  /* =====================================================================
     PRICING & RISK
     ===================================================================== */
  function PricingRisk() {
    const stats = [
      { label: 'Theoretical', value: '3.45', unit: '/bbl', accent: true },
      { label: 'Clean Price', value: '3.45', unit: '/bbl' },
      { label: 'Dirty Price', value: '3.47', unit: '/bbl' },
      { label: 'Implied Vol', value: '42.6%' },
      { label: 'NPV', value: '$24,580', valueColor: 'var(--green-500)' },
      { label: 'Data Quality', value: '0.92', sub: 'high' },
    ];
    return (
      <ScreenGrid rail={<><MarketSnapshot title="Market Context" /><Panel title="Model & Assumptions"><div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{[['Model', 'Black-Scholes'], ['Vol', 'Constant 42.6%'], ['Rate', '4.00%'], ['Dividend', '0.0%'], ['Day count', 'ACT/365']].map((a, i) => <MetricRow key={i} label={a[0]} value={a[1]} />)}</div></Panel></>}>
        <Panel pad={false} style={{ background: 'transparent', border: 'none' }}>
          <RfqHeader title="Pricing & Risk" subtitle="Theoretical valuation, Greeks and scenario sensitivities." rfqId={TR.rfqId} savedAt={TR.savedAt}
            right={<Button variant="secondary" icon={<Icon name="refresh-cw" size={14} />}>Re-price</Button>} />
        </Panel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>{stats.map((s, i) => <StatCard key={i} {...s} />)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Panel title="Greeks">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MetricRow label="Delta (Δ)" value="0.62" /><MetricRow label="Gamma (Γ)" value="0.020" />
              <MetricRow label="Vega (ν)" value="0.39" /><MetricRow label="Theta (Θ)" value="-0.011" />
              <MetricRow label="Rho (ρ)" value="0.08" /><MetricRow label="Vanna" value="0.004" />
            </div>
          </Panel>
          <Panel title="Risk Limits" live liveLabel="GREEN">
            <MetricRow label="DV01" value="—" /><MetricRow label="Vega notional" value="$390 / vol pt" />
            <MetricRow label="Stress (-5 vol)" value="-$19,500" /><MetricRow label="Limit usage" value="42%" />
            <div style={{ marginTop: 10 }}><Badge kind="approved">Risk Approved</Badge></div>
          </Panel>
        </div>
        <Panel title="Scenario Sensitivity" right={<span style={label}>spot shock</span>}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Spot', '-20%', '-10%', 'Flat', '+10%', '+20%'].map((h, i) => <th key={i} style={{ textAlign: i ? 'right' : 'left', ...label, padding: '6px 8px' }}>{h}</th>)}</tr></thead>
            <tbody>{[['Price', '0.30', '1.05', '3.45', '7.80', '13.2'], ['P&L', '-315', '-240', '0', '+435', '+975']].map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>{r.map((c, j) => <td key={j} style={{ textAlign: j ? 'right' : 'left', padding: '8px', ...mono({ fontSize: 12, color: j === 0 ? 'var(--text-muted)' : (c.startsWith('-') ? 'var(--red-500)' : c.startsWith('+') ? 'var(--green-500)' : 'var(--text-primary)') }) }}>{c}</td>)}</tr>
            ))}</tbody>
          </table>
        </Panel>
      </ScreenGrid>
    );
  }

  /* =====================================================================
     PAYOFF / SCENARIOS
     ===================================================================== */
  function PayoffScenarios() {
    const scen = [['Bull +20%', '+$975', 'green'], ['Base case', '+$435', 'green'], ['Flat', '$0', 'muted'], ['Bear -10%', '-$240', 'red'], ['Crash -20%', '-$315', 'red']];
    return (
      <ScreenGrid rail={<><MarketSnapshot title="Market Context" /><Panel title="Scenario P&L">{scen.map((s, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}><span style={mono({ fontSize: 12, color: 'var(--text-secondary)' })}>{s[0]}</span><span style={mono({ fontSize: 12, color: `var(--${s[2] === 'muted' ? 'text-muted' : s[2] + '-500'})` })}>{s[1]}</span></div>))}</Panel></>}>
        <Panel pad={false} style={{ background: 'transparent', border: 'none' }}>
          <RfqHeader title="Payoff / Scenarios" subtitle="Payoff at maturity, break-even and stress scenarios." rfqId={TR.rfqId} savedAt={TR.savedAt} />
        </Panel>
        <Panel title="Payoff at Maturity · WTI Call Option (5M)">
          <PayoffChart strike={85} spot={78.42} height={280} showBreakeven />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 12 }}>
            <StatCard label="Est. Price" value="3.45" unit="/bbl" /><StatCard label="Break-even" value="88.45" />
            <StatCard label="Max Loss" value="345" /><StatCard label="Max Profit" value="∞" valueColor="var(--red-500)" />
          </div>
        </Panel>
      </ScreenGrid>
    );
  }

  /* =====================================================================
     PnL & GREEKS
     ===================================================================== */
  function PnlGreeks() {
    const [snap, setSnap] = React.useState(null);
    React.useEffect(() => {
      let ok = true;
      const poll = () => fetch(window.TR_API + '/agent/desk/state').then(r => r.ok ? r.json() : null).then(s => ok && s && setSnap(s)).catch(() => {});
      poll(); const id = setInterval(poll, 3000);
      return () => { ok = false; clearInterval(id); };
    }, []);
    const d = snap && snap.desk;
    const books = (snap && snap.books) || {};
    const usd = (x) => (x >= 0 ? '+' : '') + '$' + Math.round(x).toLocaleString();
    // live per-desk P&L attribution from the stateful room
    const attrib = Object.keys(books).map((k) => {
      const pnl = books[k].reduce((s, p) => s + (p.pnl_today || 0), 0);
      return [k, pnl];
    });
    const maxAbs = Math.max(1, ...attrib.map((a) => Math.abs(a[1])));
    return (
      <ScreenGrid rail={
        <>
          <MarketSnapshot title="Live Market Snapshot" />
          <Panel title="Book Greeks" live={!!d} liveLabel={d ? d.risk_status : ''}>
            <MetricRow label="DV01" value={d ? usd(d.dv01) : '—'} />
            <MetricRow label="CS01" value={d ? usd(d.cs01) : '—'} />
            <MetricRow label="Positions" value={d ? String(d.positions) : '—'} />
            <MetricRow label="Limit usage" value={d ? Math.round(d.limit_usage * 100) + '%' : '—'} />
          </Panel>
        </>
      }>
        <Panel pad={false} style={{ background: 'transparent', border: 'none' }}>
          <RfqHeader title="PnL & Greeks" subtitle="Live desk P&L attribution by book and the stateful room's P&L curve." rfqId={TR.rfqId} savedAt={snap ? snap.clock : TR.savedAt}
            right={<Button variant="secondary" icon={<Icon name="download" size={14} />}>Export</Button>} />
        </Panel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          <StatCard label="PnL Today" value={d ? usd(d.pnl_today) : '—'} valueColor={d && d.pnl_today >= 0 ? 'var(--green-500)' : 'var(--red-500)'} accent />
          <StatCard label="DV01" value={d ? usd(d.dv01) : '—'} />
          <StatCard label="Risk Status" value={d ? d.risk_status : '—'} valueColor={d && d.risk_status === 'GREEN' ? 'var(--green-500)' : 'var(--amber-500)'} />
          <StatCard label="Positions" value={d ? String(d.positions) : '—'} sub="live book" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 12 }}>
          <Panel title="P&L Attribution (by desk, live)">
            {attrib.length ? attrib.map((a, i) => { const w = Math.min(100, Math.abs(a[1]) / maxAbs * 100); const tone = a[1] >= 0 ? 'green' : 'red'; return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <span style={mono({ fontSize: 12, color: 'var(--text-secondary)', width: 90 })}>{a[0]}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--bg-inset)', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: w + '%', background: `var(--${tone}-500)` }} /></div>
                <span style={mono({ fontSize: 12, color: `var(--${tone}-500)`, width: 74, textAlign: 'right' })}>{usd(a[1])}</span>
              </div>
            ); }) : <div style={mono({ fontSize: 12, color: 'var(--text-muted)' })}>connecting to the live room…</div>}
          </Panel>
          <Panel title="Room P&L Curve" live={!!d}><LineChart data={d && d.pnl_curve && d.pnl_curve.length ? d.pnl_curve : TR.pnlSpark} tone={d && d.pnl_today >= 0 ? 'green' : 'red'} height={210} /></Panel>
        </div>
      </ScreenGrid>
    );
  }

  /* =====================================================================
     REPORT CENTER
     ===================================================================== */
  function ReportCenter() {
    const docs = [
      ['Term Sheet – WTI Call Option (5M).pdf', 'Term Sheet', 'red', 'Summary of key terms', '245 KB'],
      ['Pricing Report.pdf', 'Pricing Report', 'red', 'Pricing methodology and results', '1.2 MB'],
      ['Risk Analysis Report.pdf', 'Risk Report', 'amber', 'Greeks, sensitivities, stress', '1.8 MB'],
      ['Model Notebook.ipynb', 'Notebook', 'green', 'Python notebook with pricing model', '3.4 MB'],
      ['Market Data Snapshot.csv', 'Data Export', 'blue', 'Market data used for pricing', '512 KB'],
      ['Payoff Diagram.pdf', 'Analysis', 'purple', 'Payoff at maturity and scenarios', '320 KB'],
    ];
    return (
      <ScreenGrid rail={
        <>
          <Panel title="Package Preview">
            {docs.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <Icon name="file-text" size={14} color={`var(--${d[2]}-500)`} />
                <span style={mono({ fontSize: 12, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{d[0]}</span>
                <span style={mono({ fontSize: 11, color: 'var(--text-dim)' })}>{d[4]}</span>
              </div>
            ))}
            <div style={{ marginTop: 12 }}><Button variant="primary" fullWidth iconRight={<Icon name="download" size={14} color="#fff" />}>Download Full Package</Button></div>
          </Panel>
          <Panel title="Storage Usage">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Donut size={88} thickness={11} center={{ value: '2.1 GB', label: 'of 10' }} segments={[{ value: 12, color: 'var(--red-500)' }, { value: 5, color: 'var(--blue-500)' }, { value: 3, color: 'var(--purple-500)' }, { value: 80, color: 'var(--bg-elevated)' }]} />
              <div><div style={mono({ fontSize: 12, color: 'var(--green-500)' })}>21% Used</div><div style={mono({ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 })}>8.0 GB Available</div></div>
            </div>
          </Panel>
        </>
      }>
        <Panel pad={false} style={{ background: 'transparent', border: 'none' }}>
          <RfqHeader title="Report Center" subtitle="All your outputs, documents and analyses in one place." rfqId={TR.rfqId} savedAt={TR.savedAt}
            right={<Button variant="primary" iconRight={<Icon name="download" size={14} color="#fff" />}>Generate Full Package</Button>} />
        </Panel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          <StatCard label="Documents" value="12" sub="Generated" /><StatCard label="Analyses" value="8" sub="Reports" />
          <StatCard label="Data Exports" value="5" sub="Files" /><StatCard label="Last Updated" value="15:42" sub="Just now" /><StatCard label="Package Size" value="24.8 MB" sub="ZIP" />
        </div>
        <Panel title="All Documents">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Name', 'Type', 'Description', 'Size'].map((h, i) => <th key={i} style={{ textAlign: 'left', ...label, padding: '6px 8px' }}>{h}</th>)}</tr></thead>
            <tbody>{docs.map((d, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '9px 8px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="file-text" size={14} color={`var(--${d[2]}-500)`} /><span style={mono({ fontSize: 12.5, color: 'var(--text-primary)' })}>{d[0]}</span></span></td>
                <td style={{ padding: '9px 8px' }}><span style={mono({ fontSize: 11, color: `var(--${d[2]}-500)` })}>{d[1]}</span></td>
                <td style={{ padding: '9px 8px', ...mono({ fontSize: 12, color: 'var(--text-secondary)' }) }}>{d[3]}</td>
                <td style={{ padding: '9px 8px', ...mono({ fontSize: 12, color: 'var(--text-muted)' }) }}>{d[4]}</td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>
      </ScreenGrid>
    );
  }

  /* =====================================================================
     CRYPTO VOL / OPTIONS  (BTC/ETH options priced by the VolSurface engine)
     ===================================================================== */
  function CryptoVol() {
    const [asset, setAsset] = React.useState('BTC');
    const [vol, setVol] = React.useState(null);
    const [hist, setHist] = React.useState(null);
    const [res, setRes] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    React.useEffect(() => {
      let ok = true;
      fetch(window.TR_API + '/agent/crypto/vol?asset=' + asset).then(r => r.ok ? r.json() : null).then(v => ok && setVol(v)).catch(() => {});
      const sym = asset === 'BTC' ? 'BTC-USD' : 'ETH-USD';
      fetch(window.TR_API + '/market/history/' + sym + '?points=180').then(r => r.ok ? r.json() : null).then(h => ok && setHist(h)).catch(() => {});
      return () => { ok = false; };
    }, [asset]);
    const price = async () => {
      setBusy(true);
      try {
        const q = asset === 'BTC' ? 'Price me an ATM Bitcoin call option for 3 months' : 'Price me an ATM Ethereum call option for 1 month';
        const r = await fetch(window.TR_API + '/agent/desk/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
        if (r.ok) setRes(await r.json());
      } catch (e) { /* offline */ }
      setBusy(false);
    };
    const pr = (res && res.pricing_result) || {};
    const g = pr.greeks || {};
    const closes = hist && hist.series ? hist.series.map(s => s.close) : TR.spxSeries;
    const spot = closes.length ? closes[closes.length - 1] : null;
    const rvHist = vol && vol.realized && vol.realized.history ? vol.realized.history.map(p => p.rv) : null;
    const rv30 = vol && vol.realized ? vol.realized.rv_30d : null;
    const liveIv = vol && vol.live ? vol.live.atm_iv : null;
    const engine = (vol && vol.engine) || (pr.engine) || '—';
    const pct = (x) => x == null ? '—' : (x * 100).toFixed(1) + '%';
    const stats = [
      { label: 'Spot', value: spot != null ? Number(spot).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—', unit: 'USD', accent: true },
      { label: '30d Realized Vol', value: pct(rv30) },
      { label: 'Live ATM IV', value: liveIv != null ? pct(liveIv) : 'offline', sub: liveIv != null ? 'Deribit' : 'network' },
      { label: 'Pricing Engine', value: engine === 'volsurface' ? 'VolSurface' : engine, sub: 'BS + SVI' },
    ];
    return (
      <ScreenGrid rail={
        <>
          <Panel title={asset + ' / USD'} live>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={mono({ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' })}>{spot != null ? Number(spot).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}</span>
              <span style={mono({ fontSize: 11, color: 'var(--text-muted)' })}>USD</span>
            </div>
            <div style={{ margin: '8px 0 6px' }}><LineChart data={closes} tone="amber" height={130} /></div>
            <div style={mono({ fontSize: 11, color: 'var(--text-dim)' })}>{hist ? hist.rows.toLocaleString() + ' bars aspirated (yfinance)' : 'loading history…'}</div>
          </Panel>
          <Panel title="Realized Vol (annualised)">
            {rvHist ? <LineChart data={rvHist} tone="purple" height={90} /> : <div style={mono({ fontSize: 12, color: 'var(--text-muted)' })}>loading…</div>}
            <div style={{ marginTop: 8 }}><MetricRow label="RV 7d" value={pct(vol && vol.realized && vol.realized.rv_7d)} /><MetricRow label="RV 30d" value={pct(rv30)} /></div>
          </Panel>
          <LearningTip label="Learning Tip" icon={<Icon name="graduation-cap" size={14} />} linkLabel="Vol surfaces & the smile">
            Crypto options trade a pronounced volatility smile; the desk calibrates an SVI surface from the live Deribit chain to price away from the money.
          </LearningTip>
        </>
      }>
        <Panel pad={false} style={{ background: 'transparent', border: 'none' }}>
          <RfqHeader title="Crypto Vol / Options Desk" subtitle="BTC & ETH options priced on the VolSurface engine (Black-Scholes + SVI smile)."
            rfqId={TR.rfqId} savedAt={TR.savedAt}
            right={<Button variant="primary" disabled={busy} onClick={price} iconRight={<Icon name={busy ? 'loader-2' : 'zap'} size={14} color="#fff" />}>{busy ? 'Pricing…' : 'Price ATM Option'}</Button>} />
        </Panel>
        <Panel title="Underlying" right={<span style={label}>select asset</span>}>
          <SegmentedToggle value={asset} onChange={setAsset} options={[{ id: 'BTC', label: 'Bitcoin (BTC)' }, { id: 'ETH', label: 'Ethereum (ETH)' }]} />
        </Panel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>{stats.map((s, i) => <StatCard key={i} {...s} />)}</div>
        {res && (
          <Panel title={'Priced by the ' + res.desk + ' desk'} right={<span style={{ ...label, color: 'var(--green-500)' }}>{res.agents.length} agents · {engine}</span>}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
              <StatCard label="Theoretical" value={pr.theoretical_price} unit={pr.unit} accent />
              <StatCard label="Strike (ATM)" value={pr.strike} />
              <StatCard label="Vol used" value={pct(pr.vol)} />
              <StatCard label="Quote (bid/ask)" value={res.quote ? res.quote.bid + ' / ' + res.quote.ask : '—'} valueColor="var(--purple-400)" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              <MetricRow label="Delta (Δ)" value={g.delta} /><MetricRow label="Gamma (Γ)" value={g.gamma} />
              <MetricRow label="Vega (ν)" value={g.vega} /><MetricRow label="Theta (Θ)" value={g.theta} />
            </div>
            <div style={{ marginTop: 10, ...mono({ fontSize: 11.5, color: 'var(--text-muted)' }) }}>{pr.hedge_hint}</div>
          </Panel>
        )}
        {!res && (
          <Panel title="Vol Surface (illustrative)">
            <VolHeatmap matrix={TR.volHeat} rowLabels={['80%', '100%', '120%', '', '']} colLabels={['1W', '1M', '3M', '6M', '1Y']} cell={20} />
            <div style={{ marginTop: 8, ...mono({ fontSize: 11.5, color: 'var(--text-muted)' }) }}>Press “Price ATM Option” to run the 8-agent desk on the live VolSurface engine.</div>
          </Panel>
        )}
      </ScreenGrid>
    );
  }

  /* =====================================================================
     STRATEGY LAB  (the TRADING algo engine, driven from the room)
     ===================================================================== */
  function StrategyLab() {
    const [meta, setMeta] = React.useState(null);
    const [instr, setInstr] = React.useState('EURUSD');
    const [res, setRes] = React.useState(null);
    const [scan, setScan] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const [scanBusy, setScanBusy] = React.useState(false);
    React.useEffect(() => { fetch(window.TR_API + '/strategy/instruments').then(r => r.ok ? r.json() : null).then(setMeta).catch(() => {}); }, []);
    const run = async () => {
      setBusy(true); setRes(null);
      try { const r = await fetch(window.TR_API + '/strategy/backtest?instrument=' + instr, { method: 'POST' }); if (r.ok) setRes(await r.json()); } catch (e) {}
      setBusy(false);
    };
    const runScan = async () => {
      setScanBusy(true);
      try { const r = await fetch(window.TR_API + '/strategy/scan', { method: 'POST' }); if (r.ok) setScan(await r.json()); } catch (e) {}
      setScanBusy(false);
    };
    const instruments = (meta && meta.instruments) || [{ key: 'EURUSD', label: 'EUR/USD', asset_class: 'fx' }, { key: 'XAUUSD', label: 'Gold', asset_class: 'commodity' }, { key: 'BTCUSD', label: 'Bitcoin', asset_class: 'crypto' }];
    const strategies = (meta && meta.strategies) || [];
    const m = (res && res.metrics) || {};
    const eq = res && res.equity ? res.equity.map(p => p.v) : [];
    const num = (x, d = 2) => (typeof x === 'number' ? x.toFixed(d) : '—');
    const col = (x) => x > 0 ? 'var(--green-500)' : x < 0 ? 'var(--red-500)' : 'var(--text-primary)';
    return (
      <ScreenGrid rail={
        <>
          <Panel title="Strategy Library">
            {strategies.length ? strategies.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan-500)' }} />
                <span style={mono({ fontSize: 12, color: 'var(--text-secondary)' })}>{s.replace(/_/g, ' ')}</span>
              </div>
            )) : <div style={mono({ fontSize: 12, color: 'var(--text-muted)' })}>loading…</div>}
          </Panel>
          <Panel title="Multi-Asset Scan">
            <Button variant="secondary" fullWidth disabled={scanBusy} onClick={runScan} icon={<Icon name={scanBusy ? 'loader-2' : 'radar'} size={14} />}>{scanBusy ? 'Scanning…' : 'Run Scan'}</Button>
            {scan && scan.ranking && (
              <div style={{ marginTop: 10 }}>
                {scan.ranking.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={mono({ fontSize: 12, color: 'var(--text-secondary)' })}>{r.label || r.instrument}</span>
                    <span style={mono({ fontSize: 12, color: 'var(--text-primary)' })}>{r.error ? 'err' : 'edge ' + num(r.edge_score)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <LearningTip label="Learning Tip" icon={<Icon name="graduation-cap" size={14} />} linkLabel="Why so few trades?">
            The engine refuses any trade whose minimum lot risks more than the account allows — discipline over frequency. Negative returns here are the real, un-tuned backtest.
          </LearningTip>
        </>
      }>
        <Panel pad={false} style={{ background: 'transparent', border: 'none' }}>
          <RfqHeader title="Strategy Lab" subtitle="The systematic trading engine — real backtests on 15-min history, executed live from the room."
            rfqId={TR.rfqId} savedAt={TR.savedAt}
            right={<Button variant="primary" disabled={busy} onClick={run} iconRight={<Icon name={busy ? 'loader-2' : 'play'} size={14} color="#fff" />}>{busy ? 'Running…' : 'Run Backtest'}</Button>} />
        </Panel>
        <Panel title="Instrument" right={<span style={label}>{(meta && meta.available) ? 'engine ready' : 'engine offline'}</span>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + Math.min(6, instruments.length) + ',1fr)', gap: 10 }}>
            {instruments.map((it, i) => (
              <button key={i} onClick={() => setInstr(it.key)} style={{ textAlign: 'left', cursor: 'pointer', background: instr === it.key ? 'var(--red-tint)' : 'var(--bg-inset)', border: `1px solid ${instr === it.key ? 'var(--red-600)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', padding: 11, color: 'var(--text-primary)' }}>
                <div style={mono({ fontSize: 12.5, fontWeight: 600 })}>{it.label}</div>
                <div style={mono({ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.08em' })}>{it.asset_class}</div>
              </button>
            ))}
          </div>
        </Panel>
        {busy && <Panel><div style={{ ...mono({ fontSize: 13, color: 'var(--text-muted)' }), display: 'flex', alignItems: 'center', gap: 10, padding: 8 }}><Icon name="loader-2" size={16} /> Running the engine on {instr} 15-min history… (a few seconds)</div></Panel>}
        {res && res.error && <Panel><div style={mono({ fontSize: 13, color: 'var(--red-500)' })}>Engine error: {res.error}</div></Panel>}
        {res && !res.error && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
              <StatCard label="Return" value={num(m.return_pct) + '%'} valueColor={col(m.return_pct)} accent />
              <StatCard label="Sharpe" value={num(m.sharpe)} valueColor={col(m.sharpe)} />
              <StatCard label="Trades" value={m.trades != null ? String(Math.round(m.trades)) : '—'} />
              <StatCard label="Max DD" value={num(m.max_drawdown_pct) + '%'} valueColor="var(--red-500)" />
              <StatCard label="Profit Factor" value={num(m.profit_factor)} />
              <StatCard label="PSR" value={num(m.psr)} sub="prob. Sharpe>0" />
            </div>
            <Panel title={'Equity Curve · ' + res.instrument} right={<span style={label}>{res.bars ? res.bars.toLocaleString() + ' bars · ' + (res.timeframe || '') : ''}</span>}>
              {eq.length ? <LineChart data={eq} tone={m.return_pct >= 0 ? 'green' : 'red'} height={220} /> : <div style={mono({ fontSize: 12, color: 'var(--text-muted)' })}>no equity points</div>}
            </Panel>
            <Panel title={'Trade Journal · ' + (res.n_trades || 0) + ' trades'}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Opened', 'Dir', 'Entry', 'Exit', 'P&L', 'Reason'].map((h, i) => <th key={i} style={{ textAlign: i > 1 ? 'right' : 'left', ...label, padding: '6px 8px' }}>{h}</th>)}</tr></thead>
                <tbody>{(res.trades || []).slice(0, 14).map((t, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '7px 8px', ...mono({ fontSize: 11, color: 'var(--text-muted)' }) }}>{String(t.opened_at).slice(0, 16)}</td>
                    <td style={{ padding: '7px 8px', ...mono({ fontSize: 11, color: t.direction > 0 ? 'var(--green-500)' : 'var(--red-500)' }) }}>{t.direction > 0 ? 'LONG' : 'SHORT'}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', ...mono({ fontSize: 11, color: 'var(--text-secondary)' }) }}>{num(t.entry_price, 4)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', ...mono({ fontSize: 11, color: 'var(--text-secondary)' }) }}>{num(t.exit_price, 4)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', ...mono({ fontSize: 11, color: col(t.pnl) }) }}>{num(t.pnl)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', ...mono({ fontSize: 10.5, color: 'var(--text-dim)' }) }}>{t.exit_reason}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Panel>
          </>
        )}
        {!res && !busy && <Panel><div style={mono({ fontSize: 13, color: 'var(--text-muted)' })}>Pick an instrument and press “Run Backtest” to execute the real engine on 15-minute history.</div></Panel>}
      </ScreenGrid>
    );
  }

  window.TRScreens = { rfq: RfqCockpit, agent: AgentRoom, trader: TraderView, dashboard: Dashboard,
    builder: ProductBuilder, pricing: PricingRisk, payoff: PayoffScenarios, pnl: PnlGreeks, report: ReportCenter,
    cryptovol: CryptoVol, strategylab: StrategyLab };
})();
