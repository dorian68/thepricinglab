import React, { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'tpl-splash-seen';
const AUTO_DISMISS_MS = 1500;
const EXIT_DURATION_MS = 400;

const SplashScreen: React.FC = () => {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setTimeout(() => setVisible(false), EXIT_DURATION_MS);
  }, [exiting]);

  useEffect(() => {
    if (!visible) return;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay = prefersReduced ? 600 : AUTO_DISMISS_MS;
    const timer = setTimeout(dismiss, delay);
    return () => clearTimeout(timer);
  }, [visible, dismiss]);

  if (!visible) return null;

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer select-none"
      onClick={dismiss}
      role="presentation"
      style={{
        background: '#0d0f14',
        opacity: exiting ? 0 : 1,
        transition: `opacity ${EXIT_DURATION_MS}ms ease-out`,
      }}
    >
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* SVG decorative layer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <style>{`
          @keyframes draw-integral {
            from { stroke-dashoffset: 600; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes draw-spark {
            from { stroke-dashoffset: 800; }
            to   { stroke-dashoffset: 0; }
          }
          .integral-path {
            stroke-dasharray: 600;
            stroke-dashoffset: 600;
            animation: draw-integral 800ms ease-out forwards;
          }
          .spark-path {
            stroke-dasharray: 800;
            stroke-dashoffset: 800;
            animation: draw-spark 1200ms ease-out forwards;
          }
          @media (prefers-reduced-motion: reduce) {
            .integral-path, .spark-path {
              animation: none;
              stroke-dashoffset: 0;
            }
          }
        `}</style>

        {/* Large integral sign */}
        <path
          className="integral-path"
          d="M580 120 C560 120, 540 160, 540 220 L540 560 C540 620, 520 680, 500 680 C520 680, 540 640, 540 580 L540 240 C540 180, 560 140, 580 120Z"
          fill="none"
          stroke="rgba(232,147,12,0.12)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Equations as decorative text */}
        <text x="120" y="200" fill="rgba(255,255,255,0.06)" fontSize="18" fontFamily="'JetBrains Mono', monospace">
          dSₜ = μSₜdt + σSₜdWₜ
        </text>
        <text x="700" y="650" fill="rgba(255,255,255,0.08)" fontSize="16" fontFamily="'JetBrains Mono', monospace">
          ∂V/∂t + ½σ²S² ∂²V/∂S² + rS ∂V/∂S − rV = 0
        </text>
        <text x="900" y="180" fill="rgba(255,255,255,0.05)" fontSize="20" fontFamily="'JetBrains Mono', monospace">
          ∫ σ²(S,t) dt
        </text>

        {/* Sparkline / price path */}
        <polyline
          className="spark-path"
          points="100,500 200,480 280,510 350,460 420,470 500,430 580,450 660,390 740,410 820,370 900,380 980,340 1060,360 1100,330"
          fill="none"
          stroke="rgba(232,147,12,0.15)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Center content */}
      <div className="relative z-10 text-center">
        <h1
          className="text-3xl md:text-5xl font-semibold tracking-tight"
          style={{
            fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
            color: 'hsl(210 10% 92%)',
            opacity: prefersReduced ? 1 : 0,
            transform: prefersReduced ? 'none' : 'translateY(12px)',
            animation: prefersReduced ? 'none' : 'splashTitleIn 500ms ease-out 400ms forwards',
          }}
        >
          The Pricing Library
        </h1>
        <p
          className="mt-4 text-sm md:text-base tracking-widest uppercase"
          style={{
            color: '#e8930c',
            opacity: prefersReduced ? 1 : 0,
            animation: prefersReduced ? 'none' : 'splashSubIn 500ms ease-out 600ms forwards',
          }}
        >
          Quantitative Finance · Option Pricing · Market Intelligence
        </p>
      </div>

      {/* Skip affordance */}
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        className="absolute bottom-8 right-8 text-xs uppercase tracking-widest opacity-30 hover:opacity-60 transition-opacity"
        style={{ color: 'hsl(210 10% 92%)' }}
      >
        Skip
      </button>

      {/* Keyframes for center content */}
      <style>{`
        @keyframes splashTitleIn {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashSubIn {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
