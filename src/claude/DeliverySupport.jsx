import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function ServiceUnavailable({ title = 'Service temporarily unavailable', onRetry }) {
  return <div className="panel service-state" role="status" data-service-unavailable="true">
    <h2>{title}</h2>
    <p>We could not load this information. Your existing records have not been changed. Please try again.</p>
    <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
      {onRetry && <button type="button" className="btn btn-outline" onClick={onRetry}>Try again</button>}
      <Link className="btn btn-ghost" to="/tools/bs-pricer">Use the free calculator</Link>
    </div>
  </div>;
}

export function AboutPage() {
  return <div className="container page about-page">
    <div className="section-eyebrow">THE PRICING LIBRARY</div>
    <h1 className="page-title">Understand the model. Reproduce the result.</h1>
    <p className="page-sub">Applied quantitative finance for students, junior desk analysts and developers moving from formulas to pricing and risk decisions.</p>
    <section className="section"><h2 className="section-title">A practical learning loop</h2>
      <div className="grid-3">{[
        ['01 · Learn', 'Read the assumptions, a worked example and the limits of the model.', '/courses', 'Browse courses'],
        ['02 · Calculate', 'Change the inputs, inspect the diagnostics and export a reproducible result.', '/tools/bs-pricer', 'Try Black-Scholes free'],
        ['03 · Practise', 'Work through a case, compare the correction and record your progress when signed in.', '/practice', 'Explore practice'],
      ].map(([title, text, to, label]) => <article className="panel" key={title} style={{ padding: 24 }}><h3>{title}</h3><p className="text-2">{text}</p><Link className="btn btn-outline" to={to}>{label}</Link></article>)}</div>
    </section>
    <section className="panel" style={{ padding: 28 }}><h2>What you can verify</h2><p className="text-2">Calculators show their inputs, conventions and model limits. Teaching simulations are identified as simulations. Course references are separated from the authored explanations. A generated exercise identifies when it uses a local fallback.</p><p className="text-2">Start with the Black-Scholes calculator and the short course preview, without an account. Full courses and workspaces require the corresponding plan; the pricing page shows current availability.</p><div className="row" style={{ gap: 12, flexWrap: 'wrap' }}><Link to="/pricing" className="btn btn-outline">Access and plans</Link><Link to="/contact" className="btn btn-ghost">Contact and support</Link></div></section>
  </div>;
}

export function RouteMetadata({ path }) {
  useEffect(() => {
    const root = document.querySelector('main');
    const update = () => {
      const heading = root?.querySelector('h1');
      const pageMetadata = root?.querySelector('[data-page-title]');
      const title = pageMetadata?.dataset.pageTitle || heading?.textContent?.replace(/\s+/g, ' ').trim();
      document.title = title ? `${title} | The Pricing Library` : 'The Pricing Library | Applied quantitative finance';
      const isPublic = ['/', '/about', '/courses', '/tools', '/tools/bs-pricer', '/pricing', '/blog', '/practice', '/contact', '/legal', '/terms', '/privacy', '/refund'].includes(path) || path === '/courses/black-scholes';
      const missing = /not found|404/i.test(title || '');
      const robots = document.querySelector('meta[name="robots"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'robots' }));
      robots.content = isPublic && !missing ? 'index,follow' : 'noindex,follow';
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.href = `https://thepricinglibrary.com${path === '/' ? '/' : path}`;
      const description = pageMetadata?.dataset.pageDescription || root?.querySelector('.page-sub, .hero-sub')?.textContent?.trim() || 'Learn applied quantitative finance with explicit assumptions, worked examples and reproducible pricing tools.';
      for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) document.querySelector(selector)?.setAttribute('content', description.slice(0, 240));
      for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) document.querySelector(selector)?.setAttribute('content', document.title);
      for (const selector of ['meta[property="og:url"]', 'meta[name="twitter:url"]']) document.querySelector(selector)?.setAttribute('content', `https://thepricinglibrary.com${path}`);
      return Boolean(heading);
    };
    update();
    const observer = new MutationObserver(() => { if (update()) observer.disconnect(); });
    if (root) observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [path]);
  return null;
}

export function downloadExercise(exercise) {
  // A real local export, with no remote-save or cross-device persistence claim.
  const content = { ...exercise };
  delete content.done;
  const blob = new Blob([JSON.stringify({ schema: 'tpl.exercise-export.v1', exportedAt: new Date().toISOString(), exercise: content }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${String(exercise.id || 'exercise').replace(/[^a-z0-9-]/gi, '_')}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadExerciseMarkdown(exercise) {
  const blob = new Blob([exercise.content || ''], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${String(exercise.id || 'exercise').replace(/[^a-z0-9-]/gi, '_')}.md`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
