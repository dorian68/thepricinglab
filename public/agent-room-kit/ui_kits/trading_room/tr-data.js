/* Trading Room — shared mock data (window.TR) */
/* Backend base URL for the live desk agents + stateful room. Local dev default;
   set window.TR_API before this script loads to point at a deployed backend. */
window.TR_API = window.TR_API || 'http://127.0.0.1:8000';
window.TR = (function () {
  const wtiSeries = [70,71,69.5,72,71.4,73.5,72.2,75,74.6,73.8,76.5,75.4,77.2,76.4,78,77.4,78.42];
  const spxSeries = [5610,5640,5625,5680,5660,5720,5705,5760,5740,5790,5775,5810,5800,5840,5825,5860,5872.34];
  const spxTheo  = spxSeries.map(v => v - 60 + Math.sin(v) * 5);
  const pnlSpark = [10,12,11,14,13,16,15,18,17,20,19,22,21,24.58];

  return {
    user: { name: 'Alexandre D.', plan: 'Student Plan', initials: 'AD' },
    rfqId: 'RFQ-2026-0617-001',
    savedAt: '15:42:18',

    topNav: ['DASHBOARD','MARKETS','PRODUCTS','LEARNING','TOOLS','AGENT ROOM'],
    sidebar: [
      { id:'rfq',     label:'RFQ Cockpit',       icon:'message-square-text' },
      { id:'agent',   label:'Agent Room',        icon:'workflow' },
      { id:'builder', label:'Product Builder',   icon:'blocks' },
      { id:'pricing', label:'Pricing & Risk',    icon:'crosshair' },
      { id:'payoff',  label:'Payoff / Scenarios',icon:'git-branch' },
      { id:'trader',  label:'Trader View',       icon:'candlestick-chart' },
      { id:'pnl',     label:'PnL & Greeks',      icon:'sigma' },
      { id:'cryptovol', label:'Crypto Vol',     icon:'bitcoin' },
      { id:'strategylab', label:'Strategy Lab', icon:'flask-conical' },
      { id:'report',  label:'Report Center',     icon:'file-text' },
    ],
    sidebarSecondary: [
      { id:'data',     label:'Market Data', icon:'bar-chart-2' },
      { id:'watch',    label:'Watchlist',   icon:'star' },
      { id:'tools',    label:'Tools',       icon:'settings-2' },
      { id:'learn',    label:'Learning Hub',icon:'graduation-cap' },
    ],

    ticker: [
      { sym:'SPX',     value:'5,872.34', delta:'+0.31%' },
      { sym:'WTI',     value:'78.42',    delta:'+1.32%' },
      { sym:'BRENT',   value:'82.15',    delta:'+1.08%' },
      { sym:'GOLD',    value:'2,337.25', delta:'+0.45%' },
      { sym:'EUR/USD', value:'1.0712',   delta:'-0.12%' },
      { sym:'10Y US',  value:'4.28%',    delta:'-0.02bp' },
    ],
    headerTicks: [
      { sym:'SPX', value:'5,872.34', delta:'+0.31%' },
      { sym:'WTI', value:'78.42',    delta:'+1.32%' },
    ],

    wtiSeries, spxSeries, spxTheo, pnlSpark,

    agents: [
      { i:1,  name:'Sales Agent',     icon:'user-round', hue:'red',    status:'Understanding', desc:'Interpreting your market concern and objective.', rows:[{label:'Notes',value:'oil ↑ ~5M'}], elapsed:'00:08', progress:1 },
      { i:2,  name:'Structurer',      icon:'boxes',      hue:'amber',  status:'Proposing',     desc:'Identifying suitable instruments and strategies.', rows:[{label:'Ideas',value:'4'}], elapsed:'00:15', progress:1 },
      { i:3,  name:'Market Data',     icon:'database',   hue:'blue',   status:'Loading',       desc:'Fetching and validating market data.', rows:[{label:'Datasets',value:'4'}], elapsed:'00:07', progress:1 },
      { i:4,  name:'Quant Agent',     icon:'sigma',      hue:'purple', status:'Modeling',      desc:'Selecting model and calibrating parameters.', rows:[{label:'Vol',value:'42.6%'}], elapsed:'00:12', progress:0.8 },
      { i:5,  name:'Pricing Agent',   icon:'line-chart', hue:'green',  status:'Pricing',       desc:'Computing theoretical price and Greeks.', rows:[{label:'Theo',value:'3.45'}], elapsed:'00:09', progress:0.7 },
      { i:6,  name:'Trader Agent',    icon:'target',     hue:'amber',  status:'Quoting',       desc:'Applying desk adjustments and generating quote.', rows:[{label:'Bid/Ask',value:'3.30/3.60'}], elapsed:'00:06', progress:0.5 },
      { i:7,  name:'Risk Manager',    icon:'shield-check',hue:'blue',  status:'Validating',    desc:'Checking limits and running risk scenarios.', rows:[{label:'Limit',value:'42%'}], elapsed:'00:10', progress:0.4 },
      { i:8,  name:'Execution Agent', icon:'zap',        hue:'red',    status:'Simulating',    desc:'Simulating hedging trades and costs.', rows:[{label:'Est. Cost',value:'3.42'}], elapsed:'00:06', progress:0.3 },
      { i:9,  name:'PnL & Greeks',    icon:'sigma',      hue:'green',  status:'Analyzing',     desc:'Computing PnL and key risk metrics.', rows:[{label:'Exp. PnL',value:'+8.7K'}], elapsed:'00:08', progress:0.2 },
      { i:10, name:'Report Agent',    icon:'file-text',  hue:'purple', status:'Preparing',     desc:'Preparing summary and educational report.', rows:[{label:'Deliverables',value:'3'}], elapsed:'00:05', progress:0.15 },
    ],

    ideas: [
      { title:'Call Option (WTI)', tagKind:'directional', tagLabel:'Directional', rationale:'Buy a call option to benefit from rising oil prices.', estCost:'$3.45 /bbl', confidence:'high', payoff:{strike:85, spot:78.42} },
      { title:'Call Spread',       tagKind:'balanced',    tagLabel:'Balanced',    rationale:'Bull call spread to reduce cost while capping upside.', estCost:'$1.85 /bbl', confidence:'high', payoff:{strike:82, spot:78.42, points:callSpread()} },
      { title:'Collar Strategy',   tagKind:'hedge',       tagLabel:'Hedge',       rationale:'Call spread + protective put for downside protection.', estCost:'$0.95 /bbl', confidence:'medium', payoff:{strike:80, spot:78.42, points:collar()} },
      { title:'Future (Long)',     tagKind:'high-exposure',tagLabel:'High Exposure',rationale:'Long futures to gain direct exposure to oil price.', estCost:'$0.00 /bbl', confidence:'medium', payoff:{points:linear()} },
      { title:'Commodity Linked Note', tagKind:'structured', tagLabel:'Structured', rationale:'Structured note linked to oil with capital protection.', estCost:'$2.10 /bbl', confidence:'high', payoff:{points:note()} },
    ],

    bids: [{price:78.41,size:512},{price:78.40,size:638},{price:78.39,size:715},{price:78.38,size:934},{price:78.37,size:687}],
    asks: [{price:78.42,size:487},{price:78.43,size:621},{price:78.44,size:712},{price:78.45,size:998},{price:78.46,size:783}],
    volHeat: [
      [0.18,0.30,0.45,0.58,0.66],
      [0.28,0.46,0.66,0.82,0.74],
      [0.40,0.66,0.95,0.78,0.55],
      [0.30,0.50,0.70,0.60,0.42],
      [0.22,0.36,0.50,0.44,0.30],
    ],

    greeks: [
      { g:'Delta',  v:'0.62',    d:'+0.02',   dt:'positive', desc:'Directional sensitivity' },
      { g:'Gamma',  v:'0.0187',  d:'+0.0012', dt:'positive', desc:'Delta sensitivity' },
      { g:'Vega',   v:'0.182',   d:'+0.004',  dt:'positive', desc:'Volatility sensitivity' },
      { g:'Theta',  v:'-0.0062', d:'-0.0003', dt:'negative', desc:'Time decay' },
      { g:'Rho',    v:'0.0021',  d:'+0.0001', dt:'positive', desc:'Rate sensitivity' },
      { g:'Vanna',  v:'0.0124',  d:'+0.0007', dt:'positive', desc:'Delta-vol correlation' },
      { g:'Charm',  v:'-0.0048', d:'-0.0002', dt:'negative', desc:'Delta time decay' },
    ],
  };

  function callSpread(){ const o=[]; for(let x=50;x<=120;x+=2){ o.push({x, y: Math.min(Math.max(0,x-82), 8) - 1.85}); } return o; }
  function collar(){ const o=[]; for(let x=50;x<=120;x+=2){ let y; if(x<74)y=-2; else if(x<86)y=(x-80)*0.3; else y=Math.min((x-86)*1+1.8,10); o.push({x,y}); } return o; }
  function linear(){ const o=[]; for(let x=50;x<=120;x+=2){ o.push({x, y:(x-78.42)*0.4}); } return o; }
  function note(){ const o=[]; for(let x=50;x<=120;x+=2){ o.push({x, y: x<78?0.5:(x-78)*0.35+0.5}); } return o; }
})();
