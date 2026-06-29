/* @ds-bundle: {"format":3,"namespace":"ThePricingLibraryDesignSystem_f20ac6","components":[{"name":"Donut","sourcePath":"components/charts/Donut.jsx"},{"name":"LineChart","sourcePath":"components/charts/LineChart.jsx"},{"name":"OrderBook","sourcePath":"components/charts/OrderBook.jsx"},{"name":"PayoffChart","sourcePath":"components/charts/PayoffChart.jsx"},{"name":"Sparkline","sourcePath":"components/charts/Sparkline.jsx"},{"name":"VolHeatmap","sourcePath":"components/charts/VolHeatmap.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"SegmentedToggle","sourcePath":"components/core/SegmentedToggle.jsx"},{"name":"StatCard","sourcePath":"components/core/StatCard.jsx"},{"name":"Switch","sourcePath":"components/core/Switch.jsx"},{"name":"Tabs","sourcePath":"components/core/Tabs.jsx"},{"name":"AgentNode","sourcePath":"components/desk/AgentNode.jsx"},{"name":"IdeaCard","sourcePath":"components/desk/IdeaCard.jsx"},{"name":"LearningTip","sourcePath":"components/desk/LearningTip.jsx"},{"name":"MetricRow","sourcePath":"components/desk/MetricRow.jsx"},{"name":"RfqHeader","sourcePath":"components/desk/RfqHeader.jsx"},{"name":"TickerStrip","sourcePath":"components/desk/TickerStrip.jsx"}],"sourceHashes":{"components/charts/Donut.jsx":"0d545c15e952","components/charts/LineChart.jsx":"0bc2c8499571","components/charts/OrderBook.jsx":"7d0fb32b3b65","components/charts/PayoffChart.jsx":"ad5483b7acd4","components/charts/Sparkline.jsx":"3c75ee1f5411","components/charts/VolHeatmap.jsx":"3da227b826b0","components/core/Badge.jsx":"78d2da5f4000","components/core/Button.jsx":"0fed6be5ab5c","components/core/Input.jsx":"21a073cd37bd","components/core/Panel.jsx":"aa67ea230325","components/core/SegmentedToggle.jsx":"ae080b62cff1","components/core/StatCard.jsx":"ee0447b50eaa","components/core/Switch.jsx":"2ffba48ddf09","components/core/Tabs.jsx":"4310e1d7e6cb","components/desk/AgentNode.jsx":"3c461d2487f6","components/desk/IdeaCard.jsx":"cbbab39a4477","components/desk/LearningTip.jsx":"95436cd1a04e","components/desk/MetricRow.jsx":"fded057407a0","components/desk/RfqHeader.jsx":"8ec760f31232","components/desk/TickerStrip.jsx":"9cf86a33ba0b","ui_kits/trading_room/tr-data.js":"40184894a6aa","ui_kits/trading_room/tr-screens.jsx":"c4d92959ec85","ui_kits/trading_room/tr-shell.jsx":"7cfc6e8d4ce2"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ThePricingLibraryDesignSystem_f20ac6 = window.ThePricingLibraryDesignSystem_f20ac6 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/charts/Donut.jsx
try { (() => {
/**
 * Donut — ring chart for storage usage, risk breakdown and confidence. Pass
 * `segments` [{ value, color, label }]; optional center value/label.
 */
function Donut({
  segments = [],
  size = 140,
  thickness = 16,
  center = null,
  // { value, label }
  gap = 2,
  // degrees between segments
  style
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    style: {
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--bg-inset)",
    strokeWidth: thickness
  }), segments.map((seg, i) => {
    const frac = seg.value / total;
    const len = Math.max(0, frac * c - gap);
    const dash = `${len} ${c - len}`;
    const el = /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: size / 2,
      cy: size / 2,
      r: r,
      fill: "none",
      stroke: seg.color,
      strokeWidth: thickness,
      strokeDasharray: dash,
      strokeDashoffset: -offset,
      strokeLinecap: "butt"
    });
    offset += frac * c;
    return el;
  })), center && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 'var(--text-lg)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, center.value), center.label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-label)',
      color: 'var(--text-muted)'
    }
  }, center.label)));
}
Object.assign(__ds_scope, { Donut });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/Donut.jsx", error: String((e && e.message) || e) }); }

// components/charts/LineChart.jsx
try { (() => {
/**
 * LineChart — terminal price chart. Solid primary line (red by default) with an
 * optional dashed "theoretical" series, gradient area fill, faint grid, and
 * x-axis tick labels. SVG, responsive via viewBox.
 */
function LineChart({
  data = [],
  theoretical = null,
  width = 560,
  height = 220,
  tone = 'red',
  xLabels = [],
  yTicks = 4,
  area = true,
  padding = {
    t: 12,
    r: 12,
    b: 22,
    l: 34
  },
  style
}) {
  const color = tone === 'red' ? 'var(--red-500)' : tone === 'green' ? 'var(--green-500)' : tone;
  const id = React.useId();
  const all = theoretical ? data.concat(theoretical) : data;
  const min = Math.min(...all),
    max = Math.max(...all);
  const span = max - min || 1;
  const iw = width - padding.l - padding.r;
  const ih = height - padding.t - padding.b;
  const toXY = arr => arr.map((v, i) => {
    const x = padding.l + i / (arr.length - 1) * iw;
    const y = padding.t + ih - (v - min) / span * ih;
    return [x, y];
  });
  const path = arr => toXY(arr).map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const linePts = toXY(data);
  const areaPath = `${path(data)} L${padding.l + iw} ${padding.t + ih} L${padding.l} ${padding.t + ih} Z`;
  const grid = Array.from({
    length: yTicks + 1
  }, (_, i) => padding.t + i / yTicks * ih);
  return /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: `0 0 ${width} ${height}`,
    style: {
      display: 'block',
      ...style
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: `lc-${id}`,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.20"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), grid.map((y, i) => /*#__PURE__*/React.createElement("line", {
    key: i,
    x1: padding.l,
    x2: width - padding.r,
    y1: y,
    y2: y,
    stroke: "var(--border-subtle)",
    strokeWidth: "1"
  })), grid.map((y, i) => {
    const val = max - i / yTicks * span;
    return /*#__PURE__*/React.createElement("text", {
      key: `yl-${i}`,
      x: padding.l - 6,
      y: y + 3,
      textAnchor: "end",
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fill: 'var(--text-dim)'
      }
    }, Math.round(val));
  }), area && /*#__PURE__*/React.createElement("path", {
    d: areaPath,
    fill: `url(#lc-${id})`
  }), theoretical && /*#__PURE__*/React.createElement("path", {
    d: path(theoretical),
    fill: "none",
    stroke: "var(--blue-500)",
    strokeWidth: "1.5",
    strokeDasharray: "4 3",
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("path", {
    d: path(data),
    fill: "none",
    stroke: color,
    strokeWidth: "1.75",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }), xLabels.map((lab, i) => {
    const x = padding.l + i / (xLabels.length - 1) * iw;
    return /*#__PURE__*/React.createElement("text", {
      key: `xl-${i}`,
      x: x,
      y: height - 6,
      textAnchor: "middle",
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fill: 'var(--text-dim)'
      }
    }, lab);
  }));
}
Object.assign(__ds_scope, { LineChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/LineChart.jsx", error: String((e && e.message) || e) }); }

// components/charts/OrderBook.jsx
try { (() => {
/**
 * OrderBook — bid/ask depth ladder. Asks render red (depth bar from the right),
 * bids render green (depth bar from the left), with a MID + SPREAD row between.
 * Pass `rows` as the combined ladder, or `bids`/`asks` separately.
 */
function OrderBook({
  bids = [],
  // [{ price, size }] ascending toward mid
  asks = [],
  // [{ price, size }] ascending away from mid
  mid,
  spread,
  highlight = null,
  // price to highlight
  style
}) {
  const maxSize = Math.max(1, ...bids.map(b => b.size), ...asks.map(a => a.size));
  const Row = ({
    row,
    side
  }) => {
    const pct = row.size / maxSize * 100;
    const isAsk = side === 'ask';
    const depthColor = isAsk ? 'rgba(255,46,69,0.16)' : 'rgba(46,204,113,0.16)';
    const sizeColor = isAsk ? 'var(--red-400)' : 'var(--green-400)';
    const hot = highlight != null && Math.abs(row.price - highlight) < 1e-6;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        height: 22,
        padding: '0 8px',
        background: hot ? 'var(--bg-hover)' : 'transparent'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        [isAsk ? 'right' : 'left']: 0,
        width: `${pct}%`,
        background: depthColor
      }
    }), isAsk ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        fontFamily: 'var(--font-numeric)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-primary)'
      }
    }, row.price), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        textAlign: 'right',
        fontFamily: 'var(--font-numeric)',
        fontSize: 'var(--text-xs)',
        color: sizeColor
      }
    }, row.size)) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        fontFamily: 'var(--font-numeric)',
        fontSize: 'var(--text-xs)',
        color: sizeColor
      }
    }, row.size), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        textAlign: 'right',
        fontFamily: 'var(--font-numeric)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-primary)'
      }
    }, row.price)));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0 8px 6px',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-label)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "BID SIZE"), /*#__PURE__*/React.createElement("span", null, "PRICE"), /*#__PURE__*/React.createElement("span", null, "ASK SIZE")), [...asks].reverse().map((a, i) => /*#__PURE__*/React.createElement(Row, {
    key: `a${i}`,
    row: a,
    side: "ask"
  })), mid != null && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5px 8px',
      margin: '2px 0',
      borderTop: '1px solid var(--border-hairline)',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-label)',
      color: 'var(--text-muted)'
    }
  }, "MID"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 'var(--text-sm)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, mid), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)'
    }
  }, "SPREAD ", spread)), bids.map((b, i) => /*#__PURE__*/React.createElement(Row, {
    key: `b${i}`,
    row: b,
    side: "bid"
  })));
}
Object.assign(__ds_scope, { OrderBook });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/OrderBook.jsx", error: String((e && e.message) || e) }); }

// components/charts/PayoffChart.jsx
try { (() => {
/**
 * PayoffChart — option payoff / P&L diagram (hockey-stick). Draws the payoff
 * line (red), a zero baseline, dashed break-even + spot/strike markers. Set
 * `mini` for the compact version inside idea cards.
 */
function PayoffChart({
  points = null,
  // [{x, y}] in data space; if null, a default call payoff is drawn
  width = 520,
  height = 240,
  tone = 'red',
  spot = null,
  // x value for spot marker
  strike = null,
  // x value for strike marker
  breakeven = null,
  // x value for break-even marker
  xDomain = [50, 120],
  mini = false,
  showZero = true,
  style
}) {
  const color = tone === 'red' ? 'var(--red-500)' : tone === 'green' ? 'var(--green-500)' : tone;
  const id = React.useId();
  const pad = mini ? {
    t: 8,
    r: 8,
    b: 8,
    l: 8
  } : {
    t: 16,
    r: 16,
    b: 28,
    l: 40
  };

  // default: long call payoff, strike 85, premium ~ -1
  const pts = points || (() => {
    const k = strike ?? 85,
      prem = 1;
    const out = [];
    for (let x = xDomain[0]; x <= xDomain[1]; x += 2) {
      out.push({
        x,
        y: Math.max(0, x - k) - prem
      });
    }
    return out;
  })();
  const xs = pts.map(p => p.x),
    ys = pts.map(p => p.y);
  const xmin = xDomain[0],
    xmax = xDomain[1];
  const ymin = Math.min(...ys, 0),
    ymax = Math.max(...ys, 1);
  const yspan = ymax - ymin || 1;
  const iw = width - pad.l - pad.r,
    ih = height - pad.t - pad.b;
  const X = x => pad.l + (x - xmin) / (xmax - xmin) * iw;
  const Y = y => pad.t + ih - (y - ymin) / yspan * ih;
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const zeroY = Y(0);
  return /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: `0 0 ${width} ${height}`,
    style: {
      display: 'block',
      ...style
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: `pf-${id}`,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.16"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), !mini && /*#__PURE__*/React.createElement(React.Fragment, null, [0, 0.25, 0.5, 0.75, 1].map((t, i) => /*#__PURE__*/React.createElement("line", {
    key: i,
    x1: pad.l,
    x2: width - pad.r,
    y1: pad.t + t * ih,
    y2: pad.t + t * ih,
    stroke: "var(--border-subtle)",
    strokeWidth: "1"
  }))), /*#__PURE__*/React.createElement("path", {
    d: `${line} L${X(xmax)} ${zeroY} L${X(xmin)} ${zeroY} Z`,
    fill: `url(#pf-${id})`,
    opacity: "0.7"
  }), showZero && /*#__PURE__*/React.createElement("line", {
    x1: pad.l,
    x2: width - pad.r,
    y1: zeroY,
    y2: zeroY,
    stroke: "var(--border-strong)",
    strokeWidth: "1",
    strokeDasharray: mini ? '3 3' : '0'
  }), strike != null && /*#__PURE__*/React.createElement("line", {
    x1: X(strike),
    x2: X(strike),
    y1: pad.t,
    y2: pad.t + ih,
    stroke: "var(--text-muted)",
    strokeWidth: "1",
    strokeDasharray: "4 3"
  }), spot != null && /*#__PURE__*/React.createElement("line", {
    x1: X(spot),
    x2: X(spot),
    y1: pad.t,
    y2: pad.t + ih,
    stroke: "var(--purple-500)",
    strokeWidth: "1",
    strokeDasharray: "4 3"
  }), breakeven != null && /*#__PURE__*/React.createElement("circle", {
    cx: X(breakeven),
    cy: zeroY,
    r: "3",
    fill: "var(--text-primary)"
  }), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: color,
    strokeWidth: mini ? 1.5 : 2,
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }));
}
Object.assign(__ds_scope, { PayoffChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/PayoffChart.jsx", error: String((e && e.message) || e) }); }

// components/charts/Sparkline.jsx
try { (() => {
function buildPath(data, w, h, pad) {
  const min = Math.min(...data),
    max = Math.max(...data);
  const span = max - min || 1;
  const innerW = w - pad * 2,
    innerH = h - pad * 2;
  return data.map((v, i) => {
    const x = pad + i / (data.length - 1) * innerW;
    const y = pad + innerH - (v - min) / span * innerH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

/**
 * Sparkline — tiny area+line trend used inside StatCards and rows.
 */
function Sparkline({
  data = [],
  width = 120,
  height = 32,
  tone = 'green',
  strokeWidth = 1.5,
  fill = true,
  style
}) {
  const color = tone === 'red' ? 'var(--red-500)' : tone === 'green' ? 'var(--green-500)' : tone;
  const grad = tone === 'red' ? 'var(--grad-chart-red)' : 'var(--grad-chart-green)';
  const pad = 2;
  const line = buildPath(data, width, height, pad);
  const id = React.useId();
  const area = `${line} L${width - pad} ${height - pad} L${pad} ${height - pad} Z`;
  return /*#__PURE__*/React.createElement("svg", {
    width: width,
    height: height,
    viewBox: `0 0 ${width} ${height}`,
    style: {
      display: 'block',
      ...style
    },
    preserveAspectRatio: "none"
  }, fill && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: `spk-${id}`,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.22"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: `url(#spk-${id})`
  })), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }));
}
Object.assign(__ds_scope, { Sparkline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/Sparkline.jsx", error: String((e && e.message) || e) }); }

// components/charts/VolHeatmap.jsx
try { (() => {
/**
 * VolHeatmap — implied-vol surface grid (Strike rows × Tenor columns) with
 * red-intensity cells. Pass a 2D `matrix` of values in [0,1] (or raw values +
 * min/max), plus axis labels.
 */
function VolHeatmap({
  matrix = [],
  // rows of numbers
  rowLabels = [],
  // strike / moneyness
  colLabels = [],
  // tenor
  min,
  max,
  cell = 26,
  gap = 2,
  style
}) {
  const flat = matrix.flat();
  const lo = min ?? Math.min(...flat);
  const hi = max ?? Math.max(...flat);
  const span = hi - lo || 1;
  const color = v => {
    const t = Math.max(0, Math.min(1, (v - lo) / span));
    // dark navy → vivid red
    const r = Math.round(20 + t * 235);
    const g = Math.round(28 + t * 18);
    const b = Math.round(40 + t * 29);
    return `rgb(${r}, ${g}, ${b})`;
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 8,
      ...style
    }
  }, rowLabels.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateRows: `repeat(${matrix.length}, ${cell}px)`,
      gap,
      alignItems: 'center'
    }
  }, rowLabels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)',
      textAlign: 'right'
    }
  }, l))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${colLabels.length || (matrix[0] || []).length}, ${cell}px)`,
      gap
    }
  }, matrix.map((row, ri) => row.map((v, ci) => /*#__PURE__*/React.createElement("div", {
    key: `${ri}-${ci}`,
    title: `${v}`,
    style: {
      width: cell,
      height: cell,
      borderRadius: 'var(--radius-xs)',
      background: color(v)
    }
  })))), colLabels.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${colLabels.length}, ${cell}px)`,
      gap,
      marginTop: 4
    }
  }, colLabels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)',
      textAlign: 'center'
    }
  }, l)))));
}
Object.assign(__ds_scope, { VolHeatmap });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/VolHeatmap.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Tone → color mapping for badges, tags, and status pills. */
const TONES = {
  red: {
    fg: 'var(--red-400)',
    bg: 'var(--red-tint)',
    bd: 'var(--red-700)'
  },
  green: {
    fg: 'var(--green-400)',
    bg: 'var(--green-tint)',
    bd: 'var(--green-600)'
  },
  amber: {
    fg: 'var(--amber-400)',
    bg: 'var(--amber-tint)',
    bd: 'var(--amber-600)'
  },
  purple: {
    fg: 'var(--purple-400)',
    bg: 'var(--purple-tint)',
    bd: 'var(--purple-600)'
  },
  blue: {
    fg: 'var(--blue-400)',
    bg: 'var(--blue-tint)',
    bd: 'var(--blue-600)'
  },
  cyan: {
    fg: 'var(--cyan-400)',
    bg: 'var(--cyan-tint)',
    bd: 'var(--cyan-600)'
  },
  neutral: {
    fg: 'var(--text-secondary)',
    bg: 'rgba(138,148,164,0.10)',
    bd: 'var(--border-strong)'
  }
};

/* Semantic aliases used across the desk. */
const SEMANTIC = {
  directional: 'red',
  balanced: 'purple',
  hedge: 'amber',
  structured: 'green',
  'high-exposure': 'amber',
  'data-export': 'blue',
  'term-sheet': 'red',
  notebook: 'green',
  high: 'green',
  medium: 'amber',
  low: 'red',
  approved: 'green',
  live: 'green',
  'in-progress': 'purple',
  locked: 'neutral',
  completed: 'green',
  positive: 'green',
  negative: 'red'
};

/**
 * Badge / Tag / Status pill. Pass `tone` directly (red, green, amber, …) or a
 * semantic `kind` (directional, hedge, high, approved, live …) that maps to a tone.
 */
function Badge({
  children,
  tone,
  kind,
  variant = 'soft',
  // 'soft' | 'outline' | 'dot'
  uppercase = true,
  dot = false,
  size = 'md',
  style,
  ...rest
}) {
  const toneName = tone || (kind ? SEMANTIC[kind] : null) || 'neutral';
  const t = TONES[toneName] || TONES.neutral;
  const sm = size === 'sm';
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: sm ? 18 : 22,
    padding: sm ? '0 6px' : '0 9px',
    fontFamily: 'var(--font-mono)',
    fontSize: sm ? 'var(--text-2xs)' : 'var(--text-xs)',
    fontWeight: 600,
    letterSpacing: uppercase ? 'var(--tracking-label)' : '0.01em',
    textTransform: uppercase ? 'uppercase' : 'none',
    lineHeight: 1,
    borderRadius: 'var(--radius-xs)',
    whiteSpace: 'nowrap'
  };
  const skin = variant === 'outline' ? {
    color: t.fg,
    background: 'transparent',
    border: `1px solid ${t.bd}`
  } : {
    color: t.fg,
    background: t.bg,
    border: `1px solid transparent`
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      ...base,
      ...skin,
      ...style
    }
  }, rest), (dot || variant === 'dot') && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: t.fg,
      flex: 'none'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — terminal-style action button.
 * Primary = solid red; secondary = hairline outline; ghost = bare.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconRight = null,
  disabled = false,
  fullWidth = false,
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '6px 10px',
      fontSize: 'var(--text-xs)',
      height: 28,
      gap: 6
    },
    md: {
      padding: '9px 14px',
      fontSize: 'var(--text-sm)',
      height: 36,
      gap: 8
    },
    lg: {
      padding: '12px 18px',
      fontSize: 'var(--text-md)',
      height: 44,
      gap: 10
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: 'var(--red-500)',
      color: 'var(--text-on-accent)',
      border: '1px solid var(--red-500)',
      boxShadow: '0 0 0 0 var(--red-glow)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent'
    },
    danger: {
      background: 'transparent',
      color: 'var(--red-400)',
      border: '1px solid var(--red-700)'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      width: fullWidth ? '100%' : undefined,
      fontFamily: 'var(--font-mono)',
      fontSize: s.fontSize,
      fontWeight: 600,
      letterSpacing: '0.02em',
      lineHeight: 1,
      borderRadius: 'var(--radius-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      whiteSpace: 'nowrap',
      transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast), box-shadow var(--dur-fast), transform var(--dur-instant)',
      ...variants[variant],
      ...style
    },
    onMouseEnter: e => {
      if (disabled) return;
      if (variant === 'primary') {
        e.currentTarget.style.background = 'var(--red-400)';
        e.currentTarget.style.boxShadow = 'var(--glow-red-sm)';
      }
      if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--border-bright)';
      if (variant === 'ghost') {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }
      if (variant === 'danger') e.currentTarget.style.background = 'var(--red-tint)';
    },
    onMouseLeave: e => {
      if (variant === 'primary') {
        e.currentTarget.style.background = 'var(--red-500)';
        e.currentTarget.style.boxShadow = '0 0 0 0 var(--red-glow)';
      }
      if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--border-strong)';
      if (variant === 'ghost') {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }
      if (variant === 'danger') e.currentTarget.style.background = 'transparent';
    },
    onMouseDown: e => {
      if (!disabled && variant === 'primary') e.currentTarget.style.background = 'var(--red-700)';
    },
    onMouseUp: e => {
      if (!disabled && variant === 'primary') e.currentTarget.style.background = 'var(--red-400)';
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, icon) : null, children, iconRight ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, iconRight) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input / Textarea — terminal field. Dark elevated fill, hairline border that
 * turns red on focus with a soft red glow (matches the RFQ prompt box).
 */
function Input({
  as = 'input',
  value,
  onChange,
  placeholder,
  icon = null,
  suffix = null,
  rows = 3,
  accent = false,
  // always-on red border (active request box)
  disabled = false,
  style,
  inputStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const active = focus || accent;
  const Tag = as;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: as === 'textarea' ? 'flex-start' : 'center',
      gap: 8,
      background: 'var(--bg-elevated)',
      border: `1px solid ${active ? 'var(--red-500)' : 'var(--border-hairline)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: as === 'textarea' ? '12px 12px' : '0 10px',
      boxShadow: active ? 'var(--glow-focus)' : 'none',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-muted)',
      marginTop: as === 'textarea' ? 2 : 0
    }
  }, icon), /*#__PURE__*/React.createElement(Tag, _extends({
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    rows: as === 'textarea' ? rows : undefined,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      resize: as === 'textarea' ? 'none' : undefined,
      color: 'var(--text-primary)',
      fontFamily: as === 'textarea' ? 'var(--font-body)' : 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      lineHeight: 1.5,
      height: as === 'textarea' ? undefined : 36,
      ...inputStyle
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)'
    }
  }, suffix));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Panel — the workhorse container. Flat dark fill, 1px hairline, 4px radius,
 * faint top inner-gradient. Optional uppercase title (eyebrow), right-side
 * actions, and a "live" indicator.
 */
function Panel({
  title,
  titleColor,
  right = null,
  live = false,
  liveLabel = 'LIVE',
  inset = false,
  pad = true,
  children,
  style,
  bodyStyle,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      position: 'relative',
      background: inset ? 'var(--bg-inset)' : 'var(--bg-panel)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-md)',
      backgroundImage: 'var(--grad-panel)',
      ...style
    }
  }, rest), (title || right || live) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      padding: '11px 14px',
      borderBottom: children ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: titleColor || 'var(--text-secondary)',
      whiteSpace: 'nowrap'
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, live && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      letterSpacing: 'var(--tracking-label)',
      color: 'var(--green-500)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--green-500)',
      boxShadow: 'var(--glow-green)',
      animation: 'tpl-pulse var(--pulse) infinite'
    }
  }), liveLabel), right)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: pad ? 'var(--pad-panel)' : 0,
      ...bodyStyle
    }
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/core/SegmentedToggle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SegmentedToggle — small pill group (1D / 1W / 1M / 3M / 1Y, or Bid / Mid).
 * Active segment fills with the chosen tone (default red).
 */
function SegmentedToggle({
  options = [],
  value,
  onChange,
  tone = 'red',
  size = 'sm',
  style,
  ...rest
}) {
  const toneFill = tone === 'red' ? 'var(--red-500)' : tone === 'green' ? 'var(--green-600)' : tone;
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      padding: 2,
      gap: 2,
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-sm)',
      ...style
    }
  }, rest), options.map(opt => {
    const o = typeof opt === 'string' ? {
      id: opt,
      label: opt
    } : opt;
    const active = o.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o.id,
      onClick: () => onChange && onChange(o.id),
      style: {
        border: 'none',
        cursor: 'pointer',
        padding: sm ? '4px 9px' : '6px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: sm ? 'var(--text-2xs)' : 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: '0.04em',
        borderRadius: 'var(--radius-xs)',
        background: active ? toneFill : 'transparent',
        color: active ? 'var(--text-on-accent)' : 'var(--text-muted)',
        transition: 'background var(--dur-fast), color var(--dur-fast)'
      },
      onMouseEnter: e => {
        if (!active) e.currentTarget.style.color = 'var(--text-primary)';
      },
      onMouseLeave: e => {
        if (!active) e.currentTarget.style.color = 'var(--text-muted)';
      }
    }, o.label);
  }));
}
Object.assign(__ds_scope, { SegmentedToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SegmentedToggle.jsx", error: String((e && e.message) || e) }); }

// components/core/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * StatCard — the dense KPI tile used across the desk (THEO PRICE, BID, DAILY
 * PNL, VAR …). Uppercase label, big mono value with unit, optional coloured
 * delta and a sparkline/area slot beneath.
 */
function StatCard({
  label,
  value,
  unit,
  delta,
  deltaTone,
  // 'positive' | 'negative' | tone override
  sub,
  valueColor,
  accent = false,
  // red-accent emphasis card (e.g. BID / YOUR QUOTE)
  chart = null,
  // sparkline node rendered below
  size = 'md',
  style,
  ...rest
}) {
  const big = size === 'lg';
  const tone = deltaTone === 'positive' ? 'var(--green-500)' : deltaTone === 'negative' ? 'var(--red-500)' : deltaTone || 'var(--text-secondary)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      background: 'var(--bg-panel)',
      border: `1px solid ${accent ? 'var(--red-700)' : 'var(--border-hairline)'}`,
      borderRadius: 'var(--radius-md)',
      padding: 'var(--pad-card)',
      overflow: 'hidden',
      backgroundImage: accent ? 'var(--grad-hero)' : 'var(--grad-panel)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 600,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: 8,
      whiteSpace: 'nowrap'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontVariantNumeric: 'tabular-nums',
      fontSize: big ? 'var(--text-3xl)' : 'var(--text-2xl)',
      fontWeight: 700,
      lineHeight: 1,
      color: valueColor || 'var(--text-primary)'
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, unit), delta != null && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-numeric)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: tone
    }
  }, delta)), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, sub), chart && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, chart));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Switch.jsx
try { (() => {
/**
 * Switch — terminal toggle. Off = hairline track; on = red track.
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  tone = 'red',
  style,
  ...rest
}) {
  const onColor = tone === 'green' ? 'var(--green-500)' : 'var(--red-500)';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": checked,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 34,
      height: 18,
      padding: 2,
      borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--border-strong)',
      background: checked ? onColor : 'var(--bg-inset)',
      borderColor: checked ? onColor : 'var(--border-strong)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background var(--dur-fast), border-color var(--dur-fast)',
      display: 'inline-flex',
      alignItems: 'center',
      ...rest.buttonStyle
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: checked ? 'var(--text-on-accent)' : 'var(--text-muted)',
      transform: checked ? 'translateX(16px)' : 'translateX(0)',
      transition: 'transform var(--dur-fast) var(--ease-snap), background var(--dur-fast)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-secondary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Switch.jsx", error: String((e && e.message) || e) }); }

// components/core/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tabs — underline tab bar. Active tab is red text with a 2px red underline.
 * Items: [{ id, label }]. Controlled via `value` + `onChange`.
 */
function Tabs({
  items = [],
  value,
  onChange,
  style,
  dense = false,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'flex',
      alignItems: 'stretch',
      gap: dense ? 18 : 24,
      borderBottom: '1px solid var(--border-hairline)',
      ...style
    }
  }, rest), items.map(it => {
    const active = it.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      role: "tab",
      "aria-selected": active,
      onClick: () => onChange && onChange(it.id),
      style: {
        position: 'relative',
        background: 'none',
        border: 'none',
        padding: dense ? '8px 0' : '10px 0',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase',
        color: active ? 'var(--red-500)' : 'var(--text-muted)',
        transition: 'color var(--dur-fast) var(--ease-out)',
        whiteSpace: 'nowrap'
      },
      onMouseEnter: e => {
        if (!active) e.currentTarget.style.color = 'var(--text-secondary)';
      },
      onMouseLeave: e => {
        if (!active) e.currentTarget.style.color = 'var(--text-muted)';
      }
    }, it.label, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -1,
        height: 2,
        background: 'var(--red-500)',
        transform: active ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left',
        transition: 'transform var(--dur-fast) var(--ease-snap)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/desk/AgentNode.jsx
try { (() => {
const HUE = {
  red: 'var(--red-500)',
  amber: 'var(--amber-500)',
  blue: 'var(--blue-500)',
  purple: 'var(--purple-500)',
  green: 'var(--green-500)',
  cyan: 'var(--cyan-500)'
};

/**
 * AgentNode — a node card in the agent pipeline. Numbered title with a domain
 * icon in a tinted ring, a coloured status word, a short description, optional
 * data rows, an elapsed timer, and a status-hued progress bar at the bottom.
 */
function AgentNode({
  index,
  name,
  icon = null,
  status = '',
  // e.g. UNDERSTANDING
  hue = 'red',
  description,
  rows = [],
  // [{ label, value }]
  elapsed,
  // e.g. "00:08"
  progress = 0.6,
  // 0..1
  active = false,
  style
}) {
  const color = HUE[hue] || hue;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      background: 'var(--bg-panel)',
      border: `1px solid ${active ? color : 'var(--border-hairline)'}`,
      borderRadius: 'var(--radius-md)',
      padding: 12,
      overflow: 'hidden',
      boxShadow: active ? `0 0 16px ${color}33` : 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      flex: 'none',
      borderRadius: 'var(--radius-sm)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `${color}1F`,
      border: `1px solid ${color}55`,
      color
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, index != null ? `${index}. ` : '', name), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 8px ${color}`
    }
  })), status && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-label)',
      color,
      marginBottom: 6
    }
  }, status), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 8px',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      lineHeight: 1.45,
      color: 'var(--text-secondary)'
    }
  }, description), rows.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      marginBottom: 8
    }
  }, rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, r.label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: r.tone || 'var(--text-primary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, r.value)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, elapsed && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-dim)'
    }
  }, elapsed)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 8,
      height: 2,
      background: 'var(--bg-inset)',
      borderRadius: 2,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${Math.round(progress * 100)}%`,
      height: '100%',
      background: color,
      boxShadow: `0 0 6px ${color}`
    }
  })));
}
Object.assign(__ds_scope, { AgentNode });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/desk/AgentNode.jsx", error: String((e && e.message) || e) }); }

// components/desk/IdeaCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IdeaCard — an "approach" / proposal card. A mini red payoff chart, title,
 * one-line rationale, a product tag chip, and (optionally) Est. Cost +
 * Confidence. Selectable with a red ring + check.
 */
function IdeaCard({
  title,
  rationale,
  tagKind = 'directional',
  tagLabel,
  payoff = null,
  // PayoffChart props override
  estCost,
  confidence,
  // 'high' | 'medium' | 'low'
  selected = false,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      position: 'relative',
      background: 'var(--bg-panel)',
      border: `1px solid ${selected ? 'var(--red-500)' : 'var(--border-hairline)'}`,
      borderRadius: 'var(--radius-md)',
      padding: 12,
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: selected ? 'var(--glow-red-sm)' : 'none',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
      ...style
    },
    onMouseEnter: e => {
      if (!selected) e.currentTarget.style.borderColor = 'var(--border-bright)';
    },
    onMouseLeave: e => {
      if (!selected) e.currentTarget.style.borderColor = 'var(--border-hairline)';
    }
  }, selected && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: 'var(--red-500)',
      color: '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 700
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)',
      marginBottom: 8
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xs)',
      height: 72,
      marginBottom: 10,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.PayoffChart, _extends({
    mini: true,
    height: 72,
    width: 240
  }, payoff || {}))), rationale && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 10px',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      lineHeight: 1.45,
      color: 'var(--text-secondary)'
    }
  }, rationale), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    kind: tagKind
  }, tagLabel || tagKind), (estCost != null || confidence) && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10
    }
  }, estCost != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)'
    }
  }, "Est. ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      color: 'var(--text-primary)'
    }
  }, estCost)), confidence && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    kind: confidence,
    size: "sm"
  }, confidence))));
}
Object.assign(__ds_scope, { IdeaCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/desk/IdeaCard.jsx", error: String((e && e.message) || e) }); }

// components/desk/LearningTip.jsx
try { (() => {
/**
 * LearningTip — the educational aside. Tinted blue panel, graduation-cap glyph,
 * uppercase label, explanatory body, and an optional "learn more" link.
 */
function LearningTip({
  label = 'LEARNING TIP',
  icon = null,
  children,
  linkLabel,
  onLink,
  tone = 'blue',
  style
}) {
  const color = tone === 'amber' ? 'var(--amber-500)' : tone === 'green' ? 'var(--green-500)' : 'var(--blue-500)';
  const bg = tone === 'amber' ? 'var(--amber-tint)' : tone === 'green' ? 'var(--green-tint)' : 'var(--blue-tint)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      border: `1px solid ${color}40`,
      borderRadius: 'var(--radius-md)',
      padding: 12,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color,
      display: 'inline-flex'
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-label)',
      color
    }
  }, label)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      lineHeight: 1.5,
      color: 'var(--text-secondary)'
    }
  }, children), linkLabel && /*#__PURE__*/React.createElement("button", {
    onClick: onLink,
    style: {
      marginTop: 8,
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      color
    }
  }, linkLabel, " \u2192"));
}
Object.assign(__ds_scope, { LearningTip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/desk/LearningTip.jsx", error: String((e && e.message) || e) }); }

// components/desk/MetricRow.jsx
try { (() => {
/**
 * MetricRow — a label/value row for Greeks tables, key-metric lists and exposure
 * summaries. Optional unit, coloured change, and description column.
 */
function MetricRow({
  label,
  value,
  unit,
  change,
  changeTone,
  desc,
  emphasize = false,
  style
}) {
  const tone = changeTone === 'positive' ? 'var(--green-500)' : changeTone === 'negative' ? 'var(--red-500)' : changeTone || 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '7px 0',
      borderBottom: '1px solid var(--border-subtle)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '0 0 auto',
      minWidth: 92,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 'var(--text-sm)',
      fontWeight: emphasize ? 700 : 600,
      color: emphasize ? 'var(--text-primary)' : 'var(--text-primary)'
    }
  }, value, unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-dim)',
      fontWeight: 400
    }
  }, " ", unit) : null), change != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 'var(--text-xs)',
      color: tone
    }
  }, change), desc && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, desc));
}
Object.assign(__ds_scope, { MetricRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/desk/MetricRow.jsx", error: String((e && e.message) || e) }); }

// components/desk/RfqHeader.jsx
try { (() => {
/**
 * RfqHeader — screen header row. Big title + helper subtitle on the left; on the
 * right an RFQ-ID with a copy button and a green "Auto-Saved HH:MM:SS" state.
 */
function RfqHeader({
  title,
  subtitle,
  rfqId,
  savedAt,
  right = null,
  copyIcon = null,
  style
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    try {
      navigator.clipboard && navigator.clipboard.writeText(rfqId);
    } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xl)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-primary)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, rfqId && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-secondary)'
    }
  }, "RFQ ID: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-primary)'
    }
  }, rfqId), /*#__PURE__*/React.createElement("button", {
    onClick: copy,
    title: "Copy RFQ ID",
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: copied ? 'var(--green-500)' : 'var(--text-muted)',
      display: 'inline-flex',
      padding: 2
    }
  }, copyIcon || (copied ? '✓' : '⧉'))), savedAt && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 9px',
      borderRadius: 'var(--radius-xs)',
      background: 'var(--green-tint)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      letterSpacing: '0.04em',
      color: 'var(--green-400)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--green-500)'
    }
  }), "Auto-Saved ", savedAt), right));
}
Object.assign(__ds_scope, { RfqHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/desk/RfqHeader.jsx", error: String((e && e.message) || e) }); }

// components/desk/TickerStrip.jsx
try { (() => {
/**
 * TickerStrip — full-width MARKET WATCH bar. Red label on the left, then a row
 * of instruments with last price + signed delta (green up / red down). Optional
 * status + settings slot on the right.
 */
function TickerStrip({
  label = 'MARKET WATCH',
  items = [],
  // [{ sym, value, delta, dir }]
  status = null,
  // e.g. 'All Systems Operational'
  right = null,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      height: 'var(--ticker-h)',
      padding: '0 14px',
      background: 'var(--bg-base)',
      borderTop: '1px solid var(--border-hairline)',
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-label)',
      color: 'var(--red-500)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      flex: 1,
      minWidth: 0,
      overflow: 'hidden'
    }
  }, items.map((it, i) => {
    const up = it.dir ? it.dir === 'up' : String(it.delta).trim().startsWith('+') || String(it.delta).trim().startsWith('▲');
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-2xs)',
        letterSpacing: '0.06em',
        color: 'var(--text-muted)'
      }
    }, it.sym), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-numeric)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-primary)'
      }
    }, it.value), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-numeric)',
        fontSize: 'var(--text-2xs)',
        color: up ? 'var(--green-500)' : 'var(--red-500)'
      }
    }, it.delta));
  })), status && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      letterSpacing: '0.04em',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--green-500)'
    }
  }), status), right);
}
Object.assign(__ds_scope, { TickerStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/desk/TickerStrip.jsx", error: String((e && e.message) || e) }); }

// ui_kits/trading_room/tr-data.js
try { (() => {
/* Trading Room — shared mock data (window.TR) */
window.TR = function () {
  const wtiSeries = [70, 71, 69.5, 72, 71.4, 73.5, 72.2, 75, 74.6, 73.8, 76.5, 75.4, 77.2, 76.4, 78, 77.4, 78.42];
  const spxSeries = [5610, 5640, 5625, 5680, 5660, 5720, 5705, 5760, 5740, 5790, 5775, 5810, 5800, 5840, 5825, 5860, 5872.34];
  const spxTheo = spxSeries.map(v => v - 60 + Math.sin(v) * 5);
  const pnlSpark = [10, 12, 11, 14, 13, 16, 15, 18, 17, 20, 19, 22, 21, 24.58];
  return {
    user: {
      name: 'Alexandre D.',
      plan: 'Student Plan',
      initials: 'AD'
    },
    rfqId: 'RFQ-2026-0617-001',
    savedAt: '15:42:18',
    topNav: ['DASHBOARD', 'MARKETS', 'PRODUCTS', 'LEARNING', 'TOOLS', 'AGENT ROOM'],
    sidebar: [{
      id: 'rfq',
      label: 'RFQ Cockpit',
      icon: 'message-square-text'
    }, {
      id: 'agent',
      label: 'Agent Room',
      icon: 'workflow'
    }, {
      id: 'builder',
      label: 'Product Builder',
      icon: 'blocks'
    }, {
      id: 'pricing',
      label: 'Pricing & Risk',
      icon: 'crosshair'
    }, {
      id: 'payoff',
      label: 'Payoff / Scenarios',
      icon: 'git-branch'
    }, {
      id: 'trader',
      label: 'Trader View',
      icon: 'candlestick-chart'
    }, {
      id: 'pnl',
      label: 'PnL & Greeks',
      icon: 'sigma'
    }, {
      id: 'report',
      label: 'Report Center',
      icon: 'file-text'
    }],
    sidebarSecondary: [{
      id: 'data',
      label: 'Market Data',
      icon: 'bar-chart-2'
    }, {
      id: 'watch',
      label: 'Watchlist',
      icon: 'star'
    }, {
      id: 'tools',
      label: 'Tools',
      icon: 'settings-2'
    }, {
      id: 'learn',
      label: 'Learning Hub',
      icon: 'graduation-cap'
    }],
    ticker: [{
      sym: 'SPX',
      value: '5,872.34',
      delta: '+0.31%'
    }, {
      sym: 'WTI',
      value: '78.42',
      delta: '+1.32%'
    }, {
      sym: 'BRENT',
      value: '82.15',
      delta: '+1.08%'
    }, {
      sym: 'GOLD',
      value: '2,337.25',
      delta: '+0.45%'
    }, {
      sym: 'EUR/USD',
      value: '1.0712',
      delta: '-0.12%'
    }, {
      sym: '10Y US',
      value: '4.28%',
      delta: '-0.02bp'
    }],
    headerTicks: [{
      sym: 'SPX',
      value: '5,872.34',
      delta: '+0.31%'
    }, {
      sym: 'WTI',
      value: '78.42',
      delta: '+1.32%'
    }],
    wtiSeries,
    spxSeries,
    spxTheo,
    pnlSpark,
    agents: [{
      i: 1,
      name: 'Sales Agent',
      icon: 'user-round',
      hue: 'red',
      status: 'Understanding',
      desc: 'Interpreting your market concern and objective.',
      rows: [{
        label: 'Notes',
        value: 'oil ↑ ~5M'
      }],
      elapsed: '00:08',
      progress: 1
    }, {
      i: 2,
      name: 'Structurer',
      icon: 'boxes',
      hue: 'amber',
      status: 'Proposing',
      desc: 'Identifying suitable instruments and strategies.',
      rows: [{
        label: 'Ideas',
        value: '4'
      }],
      elapsed: '00:15',
      progress: 1
    }, {
      i: 3,
      name: 'Market Data',
      icon: 'database',
      hue: 'blue',
      status: 'Loading',
      desc: 'Fetching and validating market data.',
      rows: [{
        label: 'Datasets',
        value: '4'
      }],
      elapsed: '00:07',
      progress: 1
    }, {
      i: 4,
      name: 'Quant Agent',
      icon: 'sigma',
      hue: 'purple',
      status: 'Modeling',
      desc: 'Selecting model and calibrating parameters.',
      rows: [{
        label: 'Vol',
        value: '42.6%'
      }],
      elapsed: '00:12',
      progress: 0.8
    }, {
      i: 5,
      name: 'Pricing Agent',
      icon: 'line-chart',
      hue: 'green',
      status: 'Pricing',
      desc: 'Computing theoretical price and Greeks.',
      rows: [{
        label: 'Theo',
        value: '3.45'
      }],
      elapsed: '00:09',
      progress: 0.7
    }, {
      i: 6,
      name: 'Trader Agent',
      icon: 'target',
      hue: 'amber',
      status: 'Quoting',
      desc: 'Applying desk adjustments and generating quote.',
      rows: [{
        label: 'Bid/Ask',
        value: '3.30/3.60'
      }],
      elapsed: '00:06',
      progress: 0.5
    }, {
      i: 7,
      name: 'Risk Manager',
      icon: 'shield-check',
      hue: 'blue',
      status: 'Validating',
      desc: 'Checking limits and running risk scenarios.',
      rows: [{
        label: 'Limit',
        value: '42%'
      }],
      elapsed: '00:10',
      progress: 0.4
    }, {
      i: 8,
      name: 'Execution Agent',
      icon: 'zap',
      hue: 'red',
      status: 'Simulating',
      desc: 'Simulating hedging trades and costs.',
      rows: [{
        label: 'Est. Cost',
        value: '3.42'
      }],
      elapsed: '00:06',
      progress: 0.3
    }, {
      i: 9,
      name: 'PnL & Greeks',
      icon: 'sigma',
      hue: 'green',
      status: 'Analyzing',
      desc: 'Computing PnL and key risk metrics.',
      rows: [{
        label: 'Exp. PnL',
        value: '+8.7K'
      }],
      elapsed: '00:08',
      progress: 0.2
    }, {
      i: 10,
      name: 'Report Agent',
      icon: 'file-text',
      hue: 'purple',
      status: 'Preparing',
      desc: 'Preparing summary and educational report.',
      rows: [{
        label: 'Deliverables',
        value: '3'
      }],
      elapsed: '00:05',
      progress: 0.15
    }],
    ideas: [{
      title: 'Call Option (WTI)',
      tagKind: 'directional',
      tagLabel: 'Directional',
      rationale: 'Buy a call option to benefit from rising oil prices.',
      estCost: '$3.45 /bbl',
      confidence: 'high',
      payoff: {
        strike: 85,
        spot: 78.42
      }
    }, {
      title: 'Call Spread',
      tagKind: 'balanced',
      tagLabel: 'Balanced',
      rationale: 'Bull call spread to reduce cost while capping upside.',
      estCost: '$1.85 /bbl',
      confidence: 'high',
      payoff: {
        strike: 82,
        spot: 78.42,
        points: callSpread()
      }
    }, {
      title: 'Collar Strategy',
      tagKind: 'hedge',
      tagLabel: 'Hedge',
      rationale: 'Call spread + protective put for downside protection.',
      estCost: '$0.95 /bbl',
      confidence: 'medium',
      payoff: {
        strike: 80,
        spot: 78.42,
        points: collar()
      }
    }, {
      title: 'Future (Long)',
      tagKind: 'high-exposure',
      tagLabel: 'High Exposure',
      rationale: 'Long futures to gain direct exposure to oil price.',
      estCost: '$0.00 /bbl',
      confidence: 'medium',
      payoff: {
        points: linear()
      }
    }, {
      title: 'Commodity Linked Note',
      tagKind: 'structured',
      tagLabel: 'Structured',
      rationale: 'Structured note linked to oil with capital protection.',
      estCost: '$2.10 /bbl',
      confidence: 'high',
      payoff: {
        points: note()
      }
    }],
    bids: [{
      price: 78.41,
      size: 512
    }, {
      price: 78.40,
      size: 638
    }, {
      price: 78.39,
      size: 715
    }, {
      price: 78.38,
      size: 934
    }, {
      price: 78.37,
      size: 687
    }],
    asks: [{
      price: 78.42,
      size: 487
    }, {
      price: 78.43,
      size: 621
    }, {
      price: 78.44,
      size: 712
    }, {
      price: 78.45,
      size: 998
    }, {
      price: 78.46,
      size: 783
    }],
    volHeat: [[0.18, 0.30, 0.45, 0.58, 0.66], [0.28, 0.46, 0.66, 0.82, 0.74], [0.40, 0.66, 0.95, 0.78, 0.55], [0.30, 0.50, 0.70, 0.60, 0.42], [0.22, 0.36, 0.50, 0.44, 0.30]],
    greeks: [{
      g: 'Delta',
      v: '0.62',
      d: '+0.02',
      dt: 'positive',
      desc: 'Directional sensitivity'
    }, {
      g: 'Gamma',
      v: '0.0187',
      d: '+0.0012',
      dt: 'positive',
      desc: 'Delta sensitivity'
    }, {
      g: 'Vega',
      v: '0.182',
      d: '+0.004',
      dt: 'positive',
      desc: 'Volatility sensitivity'
    }, {
      g: 'Theta',
      v: '-0.0062',
      d: '-0.0003',
      dt: 'negative',
      desc: 'Time decay'
    }, {
      g: 'Rho',
      v: '0.0021',
      d: '+0.0001',
      dt: 'positive',
      desc: 'Rate sensitivity'
    }, {
      g: 'Vanna',
      v: '0.0124',
      d: '+0.0007',
      dt: 'positive',
      desc: 'Delta-vol correlation'
    }, {
      g: 'Charm',
      v: '-0.0048',
      d: '-0.0002',
      dt: 'negative',
      desc: 'Delta time decay'
    }]
  };
  function callSpread() {
    const o = [];
    for (let x = 50; x <= 120; x += 2) {
      o.push({
        x,
        y: Math.min(Math.max(0, x - 82), 8) - 1.85
      });
    }
    return o;
  }
  function collar() {
    const o = [];
    for (let x = 50; x <= 120; x += 2) {
      let y;
      if (x < 74) y = -2;else if (x < 86) y = (x - 80) * 0.3;else y = Math.min((x - 86) * 1 + 1.8, 10);
      o.push({
        x,
        y
      });
    }
    return o;
  }
  function linear() {
    const o = [];
    for (let x = 50; x <= 120; x += 2) {
      o.push({
        x,
        y: (x - 78.42) * 0.4
      });
    }
    return o;
  }
  function note() {
    const o = [];
    for (let x = 50; x <= 120; x += 2) {
      o.push({
        x,
        y: x < 78 ? 0.5 : (x - 78) * 0.35 + 0.5
      });
    }
    return o;
  }
}();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trading_room/tr-data.js", error: String((e && e.message) || e) }); }

// ui_kits/trading_room/tr-screens.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Trading Room — screens → window (TRScreens) */
(function () {
  const NS = window.ThePricingLibraryDesignSystem_f20ac6;
  const {
    Panel,
    Button,
    Badge,
    Input,
    Tabs,
    SegmentedToggle,
    StatCard,
    Sparkline,
    LineChart,
    PayoffChart,
    OrderBook,
    VolHeatmap,
    Donut,
    AgentNode,
    IdeaCard,
    LearningTip,
    MetricRow,
    RfqHeader
  } = NS;
  const Icon = window.TRIcon;
  const TR = window.TR;
  const mono = s => ({
    fontFamily: 'var(--font-mono)',
    ...s
  });
  const label = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)'
  };

  /* ---------- shared right-rail market snapshot ---------- */
  function MarketSnapshot({
    title = 'Market Context',
    live = true
  }) {
    const [tf, setTf] = React.useState('3M');
    return /*#__PURE__*/React.createElement(Panel, {
      title: title,
      live: live
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 13,
        color: 'var(--text-secondary)'
      })
    }, "WTI Crude Oil")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 24,
        fontWeight: 700,
        color: 'var(--text-primary)'
      })
    }, "78.42"), /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 11,
        color: 'var(--text-muted)'
      })
    }, "USD/bbl"), /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 12,
        color: 'var(--green-500)',
        marginLeft: 'auto'
      })
    }, "+1.32%")), /*#__PURE__*/React.createElement("div", {
      style: {
        margin: '8px 0 6px'
      }
    }, /*#__PURE__*/React.createElement(LineChart, {
      data: TR.wtiSeries,
      tone: "red",
      height: 130,
      xLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    })), /*#__PURE__*/React.createElement(SegmentedToggle, {
      value: tf,
      onChange: setTf,
      options: ['1D', '1W', '1M', '3M', '1Y']
    }));
  }
  function ExampleChips() {
    const ex = ['Price a 5Y EUR Callable Note', 'Hedge rising rates', 'Inflation protection'];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...label,
        marginRight: 2
      }
    }, "Examples:"), ex.map((e, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      style: mono({
        fontSize: 12,
        color: 'var(--text-secondary)',
        padding: '5px 10px',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer'
      })
    }, e)), /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 12,
        color: 'var(--text-muted)',
        padding: '5px 10px',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer'
      })
    }, "More \u25BE"));
  }

  /* =====================================================================
     RFQ COCKPIT
     ===================================================================== */
  function RfqCockpit() {
    const [q, setQ] = React.useState("J'ai peur que le pétrole augmente dans 5 mois, que me proposez-vous ?");
    const [sel, setSel] = React.useState(0);
    const interp = [{
      ic: 'shuffle',
      t: 'Request Type',
      v: 'Market Concern',
      d: 'You want to express a view or hedge a risk.'
    }, {
      ic: 'flame',
      t: 'Underlying / Risk Factor',
      v: 'Crude Oil (WTI)',
      d: 'Concern about potential increase in oil price.'
    }, {
      ic: 'calendar',
      t: 'Horizon',
      v: '~ 5 Months',
      d: 'Short to medium-term view.'
    }, {
      ic: 'target',
      t: 'Objective',
      v: 'Hedge / Protect',
      d: 'Reduce downside risk from oil price rise.'
    }];
    return /*#__PURE__*/React.createElement(ScreenGrid, {
      rail: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(MarketSnapshot, {
        title: "Market Context"
      }), /*#__PURE__*/React.createElement(Panel, {
        title: "Key Drivers"
      }, /*#__PURE__*/React.createElement("ul", {
        style: {
          margin: 0,
          paddingLeft: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }
      }, ['Geopolitical tensions in Middle East impacting supply risk.', 'OPEC+ production cuts extended.', 'Summer demand season approaching.', 'Inventories slightly below 5Y average.'].map((d, i) => /*#__PURE__*/React.createElement("li", {
        key: i,
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          lineHeight: 1.45,
          color: 'var(--text-secondary)'
        }
      }, d)))), /*#__PURE__*/React.createElement(LearningTip, {
        label: "Learning Tip",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "graduation-cap",
          size: 14
        }),
        linkLabel: "Learn more about Oil Derivatives"
      }, "Rising oil price expectation = you want instruments that increase in value when oil goes up."), /*#__PURE__*/React.createElement(Panel, {
        title: "Your Recent RFQs"
      }, [['Hedge rising rates', '2h ago'], ['5Y EUR Callable Note', '1d ago'], ['Inflation protection idea', '2d ago']].map((r, i) => /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          padding: '7px 0',
          borderBottom: '1px solid var(--border-subtle)'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: mono({
          fontSize: 12,
          color: 'var(--text-secondary)'
        })
      }, r[0]), /*#__PURE__*/React.createElement("span", {
        style: mono({
          fontSize: 11,
          color: 'var(--text-dim)'
        })
      }, r[1]))), /*#__PURE__*/React.createElement("a", {
        style: {
          ...mono({
            fontSize: 12
          }),
          color: 'var(--blue-500)',
          display: 'inline-block',
          marginTop: 8
        }
      }, "View all \u2192")))
    }, /*#__PURE__*/React.createElement(Panel, {
      title: "1. What is your request?"
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '0 0 12px',
        ...mono({
          fontSize: 12,
          color: 'var(--text-muted)'
        })
      }
    }, "Ask in natural language. Our agents will handle the rest."), /*#__PURE__*/React.createElement(Input, {
      as: "textarea",
      accent: true,
      rows: 2,
      value: q,
      onChange: e => setQ(e.target.value),
      suffix: /*#__PURE__*/React.createElement("button", {
        style: {
          background: 'var(--red-500)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          width: 38,
          height: 38,
          cursor: 'pointer',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "send",
        size: 16,
        color: "#fff"
      }))
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right',
        marginTop: 4,
        ...mono({
          fontSize: 11,
          color: 'var(--text-dim)'
        })
      }
    }, q.length, " / 500"), /*#__PURE__*/React.createElement(ExampleChips, null)), /*#__PURE__*/React.createElement(Panel, {
      title: "2. RFQ Interpretation",
      right: /*#__PURE__*/React.createElement("span", {
        style: label
      }, "Detected by Sales Agent")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 10
      }
    }, interp.map((c, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: 'var(--bg-inset)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 11
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        marginBottom: 8,
        color: 'var(--text-muted)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: c.ic,
      size: 14
    }), /*#__PURE__*/React.createElement("span", {
      style: label
    }, c.t)), /*#__PURE__*/React.createElement("div", {
      style: mono({
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: 6
      })
    }, c.v), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-sans)',
        fontSize: 11.5,
        lineHeight: 1.45,
        color: 'var(--text-muted)'
      }
    }, c.d))))), /*#__PURE__*/React.createElement(Panel, {
      title: "3. Possible Approaches",
      right: /*#__PURE__*/React.createElement("span", {
        style: label
      }, "Suggested by Structurer Agent")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5,1fr)',
        gap: 10
      }
    }, TR.ideas.map((idea, i) => /*#__PURE__*/React.createElement(IdeaCard, _extends({
      key: i
    }, idea, {
      selected: sel === i,
      onClick: () => setSel(i)
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 12,
        color: 'var(--text-secondary)',
        cursor: 'pointer'
      })
    }, "See all ideas (6) \u2192"))), /*#__PURE__*/React.createElement(Panel, {
      title: "4. Next Step",
      right: /*#__PURE__*/React.createElement("span", {
        style: label
      }, "Recommended")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 34,
        height: 34,
        borderRadius: '50%',
        border: '1px solid var(--red-700)',
        background: 'var(--red-tint)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--red-500)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "zap",
      size: 16
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: mono({
        fontSize: 13,
        color: 'var(--text-primary)'
      })
    }, "Select an approach above to build the product and get a pricing."), /*#__PURE__*/React.createElement("div", {
      style: mono({
        fontSize: 12,
        color: 'var(--text-muted)'
      })
    }, "You can modify parameters in the Product Builder.")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: 'auto'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      iconRight: /*#__PURE__*/React.createElement(Icon, {
        name: "arrow-right",
        size: 15,
        color: "#fff"
      })
    }, "Go to Product Builder")))));
  }

  /* =====================================================================
     AGENT ROOM
     ===================================================================== */
  function AgentRoom() {
    const [view, setView] = React.useState('Pipeline');
    const logRows = [['15:42:17', 'Sales Agent received request', 'red'], ['15:42:25', 'Structurer generated 4 ideas', 'amber'], ['15:42:32', 'Market Data loaded 4 datasets', 'blue'], ['15:42:44', 'Quant Agent selected model', 'purple'], ['15:42:56', 'Pricing completed', 'green'], ['15:43:02', 'Trader generated quote', 'amber'], ['15:43:10', 'Risk Manager approved', 'blue'], ['15:43:24', 'PnL & Greeks updated', 'green']];
    return /*#__PURE__*/React.createElement(ScreenGrid, {
      rail: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(MarketSnapshot, {
        title: "Live Market Snapshot"
      }), /*#__PURE__*/React.createElement(Panel, {
        title: "Workflow Log",
        live: true,
        liveLabel: "Live"
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 9
        }
      }, logRows.map((r, i) => /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 9
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: `var(--${r[2]}-500)`,
          flex: 'none'
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: mono({
          fontSize: 11,
          color: 'var(--text-dim)'
        })
      }, r[0]), /*#__PURE__*/React.createElement("span", {
        style: mono({
          fontSize: 11.5,
          color: 'var(--text-secondary)'
        })
      }, r[1]))))))
    }, /*#__PURE__*/React.createElement(Panel, {
      title: "Agent Workflow",
      right: /*#__PURE__*/React.createElement(SegmentedToggle, {
        value: view,
        onChange: setView,
        options: ['Pipeline', 'Map']
      })
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '0 0 14px',
        ...mono({
          fontSize: 12,
          color: 'var(--text-muted)'
        })
      }
    }, "Our agents collaborate like a real desk to turn your request into a desk-ready answer."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5,1fr)',
        gap: 10
      }
    }, TR.agents.map((a, i) => /*#__PURE__*/React.createElement(AgentNode, {
      key: i,
      index: a.i,
      name: a.name,
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: a.icon,
        size: 15
      }),
      hue: a.hue,
      status: a.status,
      description: a.desc,
      rows: a.rows,
      elapsed: a.elapsed,
      progress: a.progress,
      active: a.progress > 0 && a.progress < 1
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr 1fr',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 15,
      color: "var(--cyan-500)"
    }), /*#__PURE__*/React.createElement("span", {
      style: label
    }, "What's Happening?")), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-sans)',
        fontSize: 12.5,
        lineHeight: 1.5,
        color: 'var(--text-secondary)'
      }
    }, "Our agents are working in sequence, sharing insights and data. You can explore results as they become available or wait for the full analysis.")), /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("span", {
      style: label
    }, "Estimated Completion"), /*#__PURE__*/React.createElement("div", {
      style: mono({
        fontSize: 30,
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: '6px 0'
      })
    }, "00:45"), /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 11,
        color: 'var(--text-muted)'
      })
    }, "Total Elapsed ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--green-500)'
      }
    }, "01:17"))), /*#__PURE__*/React.createElement(Panel, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Donut, {
      size: 76,
      thickness: 9,
      center: {
        value: '87%'
      },
      segments: [{
        value: 87,
        color: 'var(--cyan-500)'
      }, {
        value: 13,
        color: 'var(--bg-elevated)'
      }]
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      style: label
    }, "Confidence Score"), /*#__PURE__*/React.createElement("div", {
      style: mono({
        fontSize: 16,
        fontWeight: 700,
        color: 'var(--green-500)',
        margin: '4px 0'
      })
    }, "High"), /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 11,
        color: 'var(--text-muted)'
      })
    }, "Strong data quality"))))));
  }

  /* =====================================================================
     TRADER VIEW
     ===================================================================== */
  function TraderView() {
    const stats = [{
      label: 'Theo Price',
      value: '3.45',
      unit: '/bbl'
    }, {
      label: 'Bid',
      value: '3.30',
      unit: '/bbl',
      valueColor: 'var(--red-500)',
      accent: true
    }, {
      label: 'Ask',
      value: '3.60',
      unit: '/bbl',
      valueColor: 'var(--green-500)'
    }, {
      label: 'Spread',
      value: '0.30',
      unit: '/bbl',
      sub: '8.70%'
    }, {
      label: 'Mid',
      value: '3.45',
      unit: '/bbl'
    }, {
      label: 'Your Quote',
      value: '3.30/3.60',
      valueColor: 'var(--purple-400)',
      sub: 'Size: $5.0M'
    }];
    const trades = [['15:42:16', '78.44', '215', 'B'], ['15:42:14', '78.43', '160', 'S'], ['15:42:12', '78.42', '320', 'B'], ['15:42:10', '78.42', '180', 'S']];
    return /*#__PURE__*/React.createElement(ScreenGrid, {
      rail: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(MarketSnapshot, {
        title: "Live Market Snapshot"
      }), /*#__PURE__*/React.createElement(Panel, {
        title: "Key Levels"
      }, [['Resistance 2', '82.50', 'red'], ['Resistance 1', '80.20', 'red'], ['Current Price', '78.42', 'blue'], ['Support 1', '76.10', 'green'], ['Support 2', '74.00', 'green']].map((k, i) => /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 0',
          borderBottom: '1px solid var(--border-subtle)'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: `var(--${k[2]}-500)`
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: mono({
          fontSize: 12,
          color: 'var(--text-secondary)'
        })
      }, k[0]), /*#__PURE__*/React.createElement("span", {
        style: mono({
          fontSize: 12,
          color: 'var(--text-primary)',
          marginLeft: 'auto'
        })
      }, k[1])))), /*#__PURE__*/React.createElement(Panel, {
        title: "News Flow"
      }, [['15:41', 'OPEC+ hints at supply cuts extension'], ['15:38', 'China demand outlook revised up'], ['15:33', 'US inventories down 2.1M barrels']].map((n, i) => /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          display: 'flex',
          gap: 8,
          padding: '6px 0'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: mono({
          fontSize: 11,
          color: 'var(--text-dim)'
        })
      }, n[0]), /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          color: 'var(--text-secondary)'
        }
      }, n[1])))))
    }, /*#__PURE__*/React.createElement(Panel, {
      pad: false,
      style: {
        background: 'transparent',
        border: 'none'
      }
    }, /*#__PURE__*/React.createElement(RfqHeader, {
      title: "Trader View",
      subtitle: "Desk execution, hedging strategy and live market context.",
      rfqId: TR.rfqId,
      savedAt: TR.savedAt,
      right: /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "upload",
          size: 14
        })
      }, "Export Quote")
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(6,1fr)',
        gap: 10
      }
    }, stats.map((s, i) => /*#__PURE__*/React.createElement(StatCard, _extends({
      key: i
    }, s)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '0.9fr 1.1fr 1fr',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Panel, {
      title: "Quote Management"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...label,
        marginBottom: 6
      }
    }, "Side"), /*#__PURE__*/React.createElement(SegmentedToggle, {
      value: "bid",
      onChange: () => {},
      options: [{
        id: 'bid',
        label: 'Bid / Offer'
      }, {
        id: 'mid',
        label: 'Mid'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        ...label,
        margin: '14px 0 6px'
      }
    }, "Quantity"), /*#__PURE__*/React.createElement(Input, {
      value: "5,000,000",
      icon: /*#__PURE__*/React.createElement("span", {
        style: mono({
          color: 'var(--text-muted)'
        })
      }, "$")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        ...label,
        margin: '14px 0 6px'
      }
    }, "Valid For"), /*#__PURE__*/React.createElement(Input, {
      value: "2 Hours",
      suffix: /*#__PURE__*/React.createElement(Icon, {
        name: "chevron-down",
        size: 14
      })
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      fullWidth: true,
      iconRight: /*#__PURE__*/React.createElement(Icon, {
        name: "send",
        size: 14,
        color: "#fff"
      })
    }, "Send Quote to Client"))), /*#__PURE__*/React.createElement(Panel, {
      title: "Hedging Strategy"
    }, /*#__PURE__*/React.createElement(Tabs, {
      dense: true,
      value: "rec",
      onChange: () => {},
      items: [{
        id: 'rec',
        label: 'Recommended'
      }, {
        id: 'alt',
        label: 'Alternative'
      }, {
        id: 'cust',
        label: 'Custom'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--bg-inset)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 12,
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-primary)'
      })
    }, "Dynamic Delta Hedge"), /*#__PURE__*/React.createElement(Badge, {
      kind: "approved",
      size: "sm"
    }, "Recommended")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(MetricRow, {
      label: "Hedge Ratio (\u0394)",
      value: "0.62"
    }), /*#__PURE__*/React.createElement(MetricRow, {
      label: "Hedge Notional",
      value: "$3.10M"
    }), /*#__PURE__*/React.createElement(MetricRow, {
      label: "Residual \u0394",
      value: "0.04"
    }), /*#__PURE__*/React.createElement(MetricRow, {
      label: "Effectiveness",
      value: "87%",
      change: ""
    })))), /*#__PURE__*/React.createElement(Panel, {
      title: "Market Depth (WTI Futures)"
    }, /*#__PURE__*/React.createElement(OrderBook, {
      bids: TR.bids,
      asks: TR.asks,
      mid: "78.42",
      spread: "0.01",
      highlight: 78.44
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        ...label,
        margin: '12px 0 6px'
      }
    }, "Last Trades"), trades.map((t, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr auto',
        gap: 6,
        padding: '4px 0'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 11,
        color: 'var(--text-muted)'
      })
    }, t[0]), /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 11,
        color: 'var(--text-primary)'
      })
    }, t[1]), /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 11,
        color: 'var(--text-secondary)'
      })
    }, t[2]), /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 11,
        color: t[3] === 'B' ? 'var(--green-500)' : 'var(--red-500)'
      })
    }, t[3]))))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Panel, {
      title: "Position Summary"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Donut, {
      size: 120,
      thickness: 15,
      center: {
        value: '',
        label: ''
      },
      segments: [{
        value: 6,
        color: 'var(--blue-500)'
      }, {
        value: 12,
        color: 'var(--purple-500)'
      }, {
        value: 28,
        color: 'var(--amber-500)'
      }, {
        value: 4,
        color: 'var(--cyan-500)'
      }, {
        value: 50,
        color: 'var(--bg-elevated)'
      }]
    }))), /*#__PURE__*/React.createElement(Panel, {
      title: "Risk Exposure"
    }, /*#__PURE__*/React.createElement(MetricRow, {
      label: "Delta (Abs)",
      value: "0.04"
    }), /*#__PURE__*/React.createElement(MetricRow, {
      label: "VaR 1d (95%)",
      value: "$64,200"
    }), /*#__PURE__*/React.createElement(MetricRow, {
      label: "Expected Shortfall",
      value: "$89,430"
    }), /*#__PURE__*/React.createElement(MetricRow, {
      label: "Stress Loss (\xB110%)",
      value: "$112,000"
    })), /*#__PURE__*/React.createElement(Panel, {
      title: "Quick Actions"
    }, [['refresh-cw', 'Rebalance Hedge'], ['activity', 'Simulate Re-Hedge'], ['help-circle', 'What-if Scenario'], ['thermometer', 'Run Stress Test']].map((a, i) => /*#__PURE__*/React.createElement("button", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        width: '100%',
        background: 'var(--bg-inset)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '9px 11px',
        marginBottom: 8,
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        ...mono({
          fontSize: 12
        })
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: a[0],
      size: 14,
      color: "var(--text-muted)"
    }), a[1]))), /*#__PURE__*/React.createElement(Panel, {
      title: "Trader Notes"
    }, /*#__PURE__*/React.createElement(Input, {
      as: "textarea",
      rows: 4,
      placeholder: "Add your notes\u2026"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        ...mono({
          fontSize: 11,
          color: 'var(--text-dim)'
        })
      }
    }, "Last updated by you 15:41:02"))));
  }

  /* =====================================================================
     DASHBOARD (master agent room)
     ===================================================================== */
  function Dashboard() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflow: 'auto'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.05fr 0.95fr 0.7fr',
        gap: 12,
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        padding: '6px 4px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...label,
        color: 'var(--red-500)',
        marginBottom: 12
      }
    }, "Agentic Trading Room \xB7 Fixed Income Desk"), /*#__PURE__*/React.createElement("h1", {
      style: mono({
        fontSize: 42,
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        color: 'var(--text-primary)',
        margin: 0
      })
    }, "From any market", /*#__PURE__*/React.createElement("br", null), "question to a ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--red-500)'
      }
    }, "desk-", /*#__PURE__*/React.createElement("br", null), "ready"), " answer."), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '16px 0 16px',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        color: 'var(--text-muted)',
        maxWidth: 360
      }
    }, "Ask anything. Our agents structure, price, and analyze financial products for you."), /*#__PURE__*/React.createElement(Input, {
      accent: true,
      value: "J'ai peur que le p\xE9trole augmente dans 5 mois, que me proposez-vous ?",
      suffix: /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        size: "sm",
        iconRight: /*#__PURE__*/React.createElement(Icon, {
          name: "send",
          size: 13,
          color: "#fff"
        })
      }, "Send")
    }), /*#__PURE__*/React.createElement(ExampleChips, null)), /*#__PURE__*/React.createElement(Panel, {
      title: "SPX \xB7 S&P 500 Index"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--text-primary)'
      })
    }, "5,872.34"), /*#__PURE__*/React.createElement(Badge, {
      kind: "positive",
      size: "sm"
    }, "+0.31%")), /*#__PURE__*/React.createElement(LineChart, {
      data: TR.spxSeries,
      theoretical: TR.spxTheo,
      tone: "red",
      height: 170,
      xLabels: ['17-6', '18-6', '19-6', '20-6', '21-6']
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 16,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 11,
        color: 'var(--red-500)'
      })
    }, "\u2014 SPX"), /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 11,
        color: 'var(--blue-500)'
      })
    }, "-- Theoretical (Mid)"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Panel, {
      title: "Vol Surface \xB7 SPX"
    }, /*#__PURE__*/React.createElement(VolHeatmap, {
      matrix: TR.volHeat,
      rowLabels: ['80%', '100%', '120%', '', ''],
      colLabels: ['1M', '6M', '1Y', '2Y', '5Y'],
      cell: 20
    })), /*#__PURE__*/React.createElement(Panel, {
      title: "Order Book \xB7 SPX"
    }, /*#__PURE__*/React.createElement(OrderBook, {
      bids: TR.bids.slice(0, 3).map((b, i) => ({
        price: (5872.18 - i * 0.2).toFixed(2),
        size: b.size
      })),
      asks: TR.asks.slice(0, 3).map((a, i) => ({
        price: (5872.00 + i * 0.2).toFixed(2),
        size: a.size
      })),
      mid: "5,872.34",
      spread: "0.16"
    })))), /*#__PURE__*/React.createElement(Panel, {
      title: "Agent Room \xB7 Task in Progress"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(8,1fr)',
        gap: 10
      }
    }, TR.agents.slice(0, 8).map((a, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: 'var(--bg-inset)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 10,
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: `var(--${a.hue}-500)`,
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: a.icon,
      size: 18
    })), /*#__PURE__*/React.createElement("div", {
      style: mono({
        fontSize: 11,
        color: 'var(--text-primary)',
        marginBottom: 6
      })
    }, a.name), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: a.progress >= 1 ? 'var(--green-500)' : `var(--${a.hue}-500)`
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: mono({
        fontSize: 10,
        color: 'var(--text-muted)'
      })
    }, a.status)))))));
  }

  /* ---------- layout helper: main column + right rail ---------- */
  function ScreenGrid({
    children,
    rail
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) var(--rail-w)',
        gap: 12,
        padding: 16,
        overflow: 'auto',
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0
      }
    }, children), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, rail));
  }
  window.TRScreens = {
    rfq: RfqCockpit,
    agent: AgentRoom,
    trader: TraderView,
    dashboard: Dashboard
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trading_room/tr-screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/trading_room/tr-shell.jsx
try { (() => {
/* Trading Room — shell: Icon, Sidebar, TopBar, TopNav, Ticker → window */
(function () {
  const NS = window.ThePricingLibraryDesignSystem_f20ac6;
  const {
    TickerStrip
  } = NS;

  /* React-safe Lucide icon: React owns only the wrapper span; we inject the
     <i data-lucide> as innerHTML and let lucide convert it to <svg>. */
  function Icon({
    name,
    size = 16,
    color,
    style
  }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.innerHTML = `<i data-lucide="${name}"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }, [name]);
    return /*#__PURE__*/React.createElement("span", {
      "data-tr-icon": true,
      ref: ref,
      style: {
        display: 'inline-flex',
        width: size,
        height: size,
        color: color || 'currentColor',
        flex: 'none',
        ...style
      }
    });
  }
  const Logo = ({
    small
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      fontFamily: 'var(--font-mono)',
      fontWeight: 800,
      fontSize: small ? 13 : 14,
      lineHeight: 1.02,
      letterSpacing: '0.16em',
      color: '#fff'
    }
  }, "THE", /*#__PURE__*/React.createElement("br", null), "PRICING", /*#__PURE__*/React.createElement("br", null), "LIBRARY", /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -2,
      right: -7,
      width: 5,
      height: 5,
      background: 'var(--red-500)',
      borderRadius: 1
    }
  })));
  function Sidebar({
    active,
    onNav
  }) {
    const Item = ({
      it
    }) => {
      const on = it.id === active;
      return /*#__PURE__*/React.createElement("button", {
        onClick: () => onNav(it.id),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          width: '100%',
          padding: '9px 14px',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          background: on ? 'var(--red-tint)' : 'transparent',
          borderLeft: `2px solid ${on ? 'var(--red-500)' : 'transparent'}`,
          color: on ? 'var(--red-400)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          fontWeight: on ? 600 : 500,
          transition: 'background var(--dur-fast), color var(--dur-fast)'
        },
        onMouseEnter: e => {
          if (!on) {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }
        },
        onMouseLeave: e => {
          if (!on) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: it.icon,
        size: 17
      }), it.label);
    };
    return /*#__PURE__*/React.createElement("aside", {
      style: {
        width: 'var(--sidebar-w)',
        flex: 'none',
        background: 'var(--bg-base)',
        borderRight: '1px solid var(--border-hairline)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => onNav('dashboard'),
      style: {
        padding: '16px 14px 18px',
        borderBottom: '1px solid var(--border-hairline)',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(Logo, null)), /*#__PURE__*/React.createElement("nav", {
      style: {
        padding: '10px 0 6px',
        display: 'flex',
        flexDirection: 'column'
      }
    }, window.TR.sidebar.map(it => /*#__PURE__*/React.createElement(Item, {
      key: it.id,
      it: it
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 1,
        background: 'var(--border-hairline)',
        margin: '8px 14px'
      }
    }), /*#__PURE__*/React.createElement("nav", {
      style: {
        display: 'flex',
        flexDirection: 'column'
      }
    }, window.TR.sidebarSecondary.map(it => /*#__PURE__*/React.createElement(Item, {
      key: it.id,
      it: it
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'auto',
        padding: 14,
        borderTop: '1px solid var(--border-hairline)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: 'var(--text-dim)'
      }
    }, "Desk"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        color: 'var(--text-primary)'
      }
    }, "Fixed Income ", /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-down",
      size: 14,
      color: "var(--text-muted)"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: 'var(--text-dim)',
        marginTop: 12
      }
    }, "Environment"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--green-400)',
        marginTop: 4,
        letterSpacing: '.04em'
      }
    }, "EDUCATIONAL MODE"), /*#__PURE__*/React.createElement("button", {
      style: {
        marginTop: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'none',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-sm)',
        padding: '7px 10px',
        width: '100%',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "rocket",
      size: 14,
      color: "var(--red-500)"
    }), " Switch to Pro Mode")));
  }
  function HeaderTicks() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }
    }, window.TR.headerTicks.map((t, i) => {
      const up = t.delta.startsWith('+');
      return /*#__PURE__*/React.createElement("span", {
        key: i,
        style: {
          display: 'inline-flex',
          flexDirection: 'column',
          lineHeight: 1.3
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)'
        }
      }, t.sym, " ", /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--text-primary)'
        }
      }, t.value)), /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: up ? 'var(--green-500)' : 'var(--red-500)'
        }
      }, t.delta));
    }));
  }
  function UserChip() {
    const u = window.TR.user;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        position: 'relative',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        display: 'inline-flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "bell",
      size: 18
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'var(--red-500)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: 'var(--purple-600)',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 700
      }
    }, u.initials), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 1.25
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-primary)'
      }
    }, u.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--text-muted)'
      }
    }, u.plan))));
  }

  /* Top navigation bar used inside the app shell (left-sidebar variant). */
  /* One shared nav list drives BOTH the sidebar and the top bar, so they can
     never diverge. Top bar = all primary desk views + Learning Hub. */
  window.TR_NAV = window.TR.sidebar.concat(window.TR.sidebarSecondary.filter(s => s.id === 'learn'));
  function TopBar({
    active,
    onNav
  }) {
    const items = window.TR_NAV;
    return /*#__PURE__*/React.createElement("header", {
      style: {
        height: 'var(--topnav-h)',
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 18px',
        borderBottom: '1px solid var(--border-hairline)',
        background: 'var(--bg-base)'
      }
    }, /*#__PURE__*/React.createElement("nav", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        height: '100%',
        flex: 1,
        minWidth: 0,
        overflowX: 'auto'
      }
    }, items.map(it => {
      const on = it.id === active;
      return /*#__PURE__*/React.createElement("button", {
        key: it.id,
        onClick: () => onNav(it.id),
        style: {
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          height: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: on ? 'var(--red-500)' : 'var(--text-muted)',
          whiteSpace: 'nowrap',
          flex: 'none',
          transition: 'color var(--dur-fast)'
        },
        onMouseEnter: e => {
          if (!on) e.currentTarget.style.color = 'var(--text-primary)';
        },
        onMouseLeave: e => {
          if (!on) e.currentTarget.style.color = 'var(--text-muted)';
        }
      }, it.label, on && /*#__PURE__*/React.createElement("span", {
        style: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -1,
          height: 2,
          background: 'var(--red-500)'
        }
      }));
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 1,
        height: 26,
        background: 'var(--border-hairline)',
        flex: 'none'
      }
    }), /*#__PURE__*/React.createElement(UserChip, null));
  }
  function Ticker() {
    return /*#__PURE__*/React.createElement(TickerStrip, {
      status: "All Systems Operational",
      items: window.TR.ticker,
      right: /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'inline-flex',
          color: 'var(--text-muted)'
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "settings",
        size: 14
      }))
    });
  }
  Object.assign(window, {
    TRIcon: Icon,
    TRSidebar: Sidebar,
    TRTopBar: TopBar,
    TRTicker: Ticker,
    TRLogo: Logo,
    TRUserChip: UserChip,
    TRHeaderTicks: HeaderTicks
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trading_room/tr-shell.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Donut = __ds_scope.Donut;

__ds_ns.LineChart = __ds_scope.LineChart;

__ds_ns.OrderBook = __ds_scope.OrderBook;

__ds_ns.PayoffChart = __ds_scope.PayoffChart;

__ds_ns.Sparkline = __ds_scope.Sparkline;

__ds_ns.VolHeatmap = __ds_scope.VolHeatmap;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.SegmentedToggle = __ds_scope.SegmentedToggle;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.AgentNode = __ds_scope.AgentNode;

__ds_ns.IdeaCard = __ds_scope.IdeaCard;

__ds_ns.LearningTip = __ds_scope.LearningTip;

__ds_ns.MetricRow = __ds_scope.MetricRow;

__ds_ns.RfqHeader = __ds_scope.RfqHeader;

__ds_ns.TickerStrip = __ds_scope.TickerStrip;

})();
