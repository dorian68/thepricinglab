// Descriptive local parsing never substitutes for the server's priced ticket.
export function parseDeskRequest(text) {
  const t=String(text||'').toLowerCase();
  let underlying='Crude Oil (WTI)',factor='oil';
  if(/\bbtc\b|bitcoin|\beth\b|ether|crypto|deribit/.test(t)){underlying=/\beth\b|ether/.test(t)?'Ethereum (ETH)':'Bitcoin (BTC)';factor='crypto';}
  else if(/p[ée]trole|oil|wti|brent|crude|baril/.test(t)){underlying='Crude Oil (WTI)';factor='oil';}
  else if(/inflation|cpi/.test(t)){underlying='Inflation (CPI)';factor='inflation';}
  else if(/credit|spread|cds|d[ée]faut|default/.test(t)){underlying='Credit Spreads';factor='credit';}
  else if(/taux|rate|rates|bond|obligation|swap|coupon|callable/.test(t)){underlying='US Rates (10Y)';factor='rates';}
  else if(/\bgold\b|\bor\b|once/.test(t)){underlying='Gold';factor='gold';}
  else if(/eur|usd|fx|change|devise|dollar/.test(t)){underlying='EUR/USD';factor='fx';}
  else{underlying='S&P 500';factor='equity';}
  // A unit must be a complete word: the index name "50 and Nikkei" is not
  // fifty "an" (years). Keep unsupported durations explicit, never clamp them.
  const mM=t.match(/(?<![\w.])([+-]?\d+(?:\.\d+)?)\s*(?:mois|months?)\b/);
  const mY=t.match(/(?<![\w.])([+-]?\d+(?:\.\d+)?)\s*(?:ans?|years?)\b/);
  const months=mM?Number(mM[1]):mY?Number(mY[1])*12:5;
  const horizon=mM?`${mM[1]} Months`:mY?`${mY[1]} Years`:'5 Months';
  const durationError=!Number.isFinite(months)||months<=0||months>360?'This workspace supports a positive horizon up to 30 years. Edit the duration and submit again; no price has been produced.':'';
  let view='Price increase';
  if(/baiss|fall|down|drop|decreas|chut|recul/.test(t))view='Price decrease';
  else if(/stable|sideways|range|flat|inchang|stagn/.test(t))view='Range / stable';
  let intention='Hedge / Express a view';
  if(/explain|comprendre|understand|what is|c'est quoi|apprendre|fonctionne/.test(t))intention='Learn a concept';
  else if(/price|pricer|quote|cote|combien|valoris/.test(t))intention='Price a product';
  return {underlying,factor,horizon,months,view,intention,objective:'Protection / Opportunity',durationError};
}

export function safeDeskIllustrations(build,input){
  try{
    if(!Number.isFinite(input.T)||input.T<=0||input.T>30)throw new Error('Unsupported duration');
    const items=build(input);
    if(!Array.isArray(items)||!items.length)throw new Error('No illustration');
    for(const item of items){
      if(typeof item.pay!=='function')throw new Error('Missing payoff');
      for(const ratio of [.6,1,1.4])if(!Number.isFinite(item.pay(input.spot*ratio)))throw new Error('Non-finite payoff');
    }
    return {items,error:''};
  }catch{return {items:[],error:'The local illustration is outside its supported model domain. Edit the request or use a supported case; no alternative price is displayed.'};}
}
