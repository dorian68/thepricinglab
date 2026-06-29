/* Trading Room — shell: Icon, Sidebar, TopBar, TopNav, Ticker → window */
(function () {
  const NS = window.ThePricingLibraryDesignSystem_f20ac6;
  const { TickerStrip } = NS;

  /* React-safe Lucide icon: React owns only the wrapper span; we inject the
     <i data-lucide> as innerHTML and let lucide convert it to <svg>. */
  function Icon({ name, size = 16, color, style }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.innerHTML = `<i data-lucide="${name}"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }, [name]);
    return (
      <span data-tr-icon ref={ref}
        style={{ display: 'inline-flex', width: size, height: size, color: color || 'currentColor', flex: 'none', ...style }} />
    );
  }

  const Logo = ({ small }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
      <div style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: small ? 13 : 14, lineHeight: 1.02, letterSpacing: '0.16em', color: '#fff' }}>
        THE<br />PRICING<br />LIBRARY
        <span style={{ position: 'absolute', top: -2, right: -7, width: 5, height: 5, background: 'var(--red-500)', borderRadius: 1 }} />
      </div>
    </div>
  );

  function Sidebar({ active, onNav }) {
    const Item = ({ it }) => {
      const on = it.id === active;
      return (
        <button onClick={() => onNav(it.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 11, width: '100%',
            padding: '9px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: on ? 'var(--red-tint)' : 'transparent',
            borderLeft: `2px solid ${on ? 'var(--red-500)' : 'transparent'}`,
            color: on ? 'var(--red-400)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: on ? 600 : 500,
            transition: 'background var(--dur-fast), color var(--dur-fast)',
          }}
          onMouseEnter={(e) => { if (!on) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
          onMouseLeave={(e) => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
        >
          <Icon name={it.icon} size={17} />
          {it.label}
        </button>
      );
    };
    return (
      <aside style={{ width: 'var(--sidebar-w)', flex: 'none', background: 'var(--bg-base)', borderRight: '1px solid var(--border-hairline)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div onClick={() => onNav('dashboard')} style={{ padding: '16px 14px 18px', borderBottom: '1px solid var(--border-hairline)', cursor: 'pointer' }}><Logo /></div>
        <nav style={{ padding: '10px 0 6px', display: 'flex', flexDirection: 'column' }}>
          {window.TR.sidebar.map((it) => <Item key={it.id} it={it} />)}
        </nav>
        <div style={{ height: 1, background: 'var(--border-hairline)', margin: '8px 14px' }} />
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {window.TR.sidebarSecondary.map((it) => <Item key={it.id} it={it} />)}
        </nav>
        <div style={{ marginTop: 'auto', padding: 14, borderTop: '1px solid var(--border-hairline)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Desk</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>
            Fixed Income <Icon name="chevron-down" size={14} color="var(--text-muted)" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-dim)', marginTop: 12 }}>Environment</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green-400)', marginTop: 4, letterSpacing: '.04em' }}>EDUCATIONAL MODE</div>
          <button style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', width: '100%', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <Icon name="rocket" size={14} color="var(--red-500)" /> Switch to Pro Mode
          </button>
        </div>
      </aside>
    );
  }

  function HeaderTicks() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {window.TR.headerTicks.map((t, i) => {
          const up = t.delta.startsWith('+');
          return (
            <span key={i} style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.3 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{t.sym} <span style={{ color: 'var(--text-primary)' }}>{t.value}</span></span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: up ? 'var(--green-500)' : 'var(--red-500)' }}>{t.delta}</span>
            </span>
          );
        })}
      </div>
    );
  }

  function UserChip() {
    const u = window.TR.user;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'inline-flex' }}>
          <Icon name="bell" size={18} />
          <span style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: '50%', background: 'var(--red-500)' }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--purple-600)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{u.initials}</span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)' }}>{u.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{u.plan}</span>
          </span>
        </div>
      </div>
    );
  }

  /* Top navigation bar used inside the app shell (left-sidebar variant). */
  /* One shared nav list drives BOTH the sidebar and the top bar, so they can
     never diverge. Top bar = all primary desk views + Learning Hub. */
  window.TR_NAV = window.TR.sidebar.concat(
    window.TR.sidebarSecondary.filter((s) => s.id === 'learn')
  );

  function TopBar({ active, onNav }) {
    const items = window.TR_NAV;
    return (
      <header style={{ height: 'var(--topnav-h)', flex: 'none', display: 'flex', alignItems: 'center', gap: 22, padding: '0 22px', borderBottom: '1px solid var(--border-hairline)', background: 'var(--bg-base)' }}>
        <div onClick={() => onNav('dashboard')} style={{ cursor: 'pointer', flex: 'none' }}><Logo small /></div>
        <div style={{ width: 1, height: 26, background: 'var(--border-hairline)', flex: 'none' }} />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 18, height: '100%', flex: 1, minWidth: 0, overflowX: 'auto' }}>
          {items.map((it) => {
            const on = it.id === active;
            return (
              <button key={it.id} onClick={() => onNav(it.id)}
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', height: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: on ? 'var(--red-500)' : 'var(--text-muted)', whiteSpace: 'nowrap', flex: 'none', transition: 'color var(--dur-fast)' }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.color = 'var(--text-muted)'; }}>
                {it.label}
                {on && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: 'var(--red-500)' }} />}
              </button>
            );
          })}
        </nav>
        <div style={{ width: 1, height: 26, background: 'var(--border-hairline)', flex: 'none' }} />
        <button title="Exit to ThePricingLibrary"
          onClick={() => { try { (window.top || window).location.pathname = '/dashboard'; } catch (e) { window.location.href = '/dashboard'; } }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none', background: 'none', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: '6px 9px', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <Icon name="log-out" size={13} /> Exit
        </button>
        <UserChip />
      </header>
    );
  }

  function Ticker() {
    /* Live: poll the stateful trading-room and refresh the strip every 2s. */
    const [items, setItems] = React.useState(window.TR.ticker);
    React.useEffect(() => {
      let alive = true;
      const deltas = Object.fromEntries(window.TR.ticker.map((t) => [t.sym, t.delta]));
      const map = { 'SPX': 'SPX', 'WTI': 'WTI', 'BRENT': 'BRENT', 'GOLD': 'GOLD', 'EUR/USD': 'EUR/USD', '10Y US': 'US 10Y' };
      const poll = () => fetch(window.TR_API + '/agent/desk/state').then((r) => r.ok ? r.json() : null).then((s) => {
        if (!alive || !s || !s.market_watch) return;
        setItems(window.TR.ticker.map((t) => {
          const k = map[t.sym]; const mv = k && s.market_watch[k];
          return mv ? { sym: t.sym, value: mv.v, delta: deltas[t.sym] } : t;
        }));
      }).catch(() => {});
      poll(); const id = setInterval(poll, 2000);
      return () => { alive = false; clearInterval(id); };
    }, []);
    return <TickerStrip status="All Systems Operational" items={items}
      right={<span style={{ display: 'inline-flex', color: 'var(--text-muted)' }}><Icon name="settings" size={14} /></span>} />;
  }

  Object.assign(window, { TRIcon: Icon, TRSidebar: Sidebar, TRTopBar: TopBar, TRTicker: Ticker, TRLogo: Logo, TRUserChip: UserChip, TRHeaderTicks: HeaderTicks });
})();
