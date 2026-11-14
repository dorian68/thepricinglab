import { blackScholesOption } from '../lib/blackScholes.mjs';

// Offline reference cases use their own declared inputs. They never pretend to
// price a user's custom ticket. Outputs are computed, not copied into a corrigé.
export function buildOfflineReference(request, reason = '') {
  const english = request.language === 'en';
  const text = `${request.product} ${request.concept} ${request.topic}`.toLowerCase();
  const f = value => Number(value).toLocaleString('en-US', { maximumFractionDigits: 4 });
  let title, inputs, steps, decision;
  let reference = { product:'European call option', concept:'Black-Scholes pricing and delta', category:'Black-Scholes', difficulty:'beginner' };
  if (/swap|dv01|rates|taux/.test(text)) {
    reference = {product:'EUR interest rate swap',concept:'PV payer et DV01',category:'Rates',difficulty:'intermediate'};
    title = 'Exemple hors connexion — Swap DV01';
    const notional = 100e6, fixed = .032, par = .03, annuity = 4.55, shock = 10;
    const dv01 = notional * annuity * .0001;
    inputs = [['Position', 'Payer fixe / recevoir flottant'], ['Notionnel', '100,000,000 EUR'], ['Coupon fixe', '3.20%'], ['Taux par', '3.00%'], ['Annuité', '4.55'], ['Choc parallèle', '+10 bp']];
    steps = [
      { label: 'PV payer', formula: '(taux par − coupon fixe) × annuité × notionnel', substitution: '(0.03 − 0.032) × 4.55 × 100,000,000', value: (par-fixed)*annuity*notional, unit: 'EUR' },
      { label: 'DV01 en magnitude', formula: 'annuité × notionnel × 0.0001', substitution: '4.55 × 100,000,000 × 0.0001', value: dv01, unit: 'EUR/bp' },
      { label: 'P&L du choc pour le payer', formula: 'DV01 × choc en bp', substitution: '45,500 × 10', value: dv01*shock, unit: 'EUR' },
    ];
    decision = 'Le payer gagne sous une hausse de taux. Pour neutraliser le DV01, prendre une exposition receveuse de même tenor ; les risques de pente et de basis restent à contrôler. Approximation mono-courbe, annuité constante.';
  } else if (/cds|credit|cs01/.test(text)) {
    reference = {product:'Single-name CDS',concept:'CS01 et carry acheteur de protection',category:'Credit',difficulty:'intermediate'};
    title = 'Exemple hors connexion — CDS CS01';
    const notional = 50e6, spread = 120, annuity = 4.2, shock = 25;
    const cs01 = notional*annuity*.0001;
    inputs = [['Position', 'Acheteur de protection'], ['Notionnel', '50,000,000 EUR'], ['Spread', '120 bp'], ['Annuité risquée', '4.2'], ['Élargissement', '+25 bp']];
    steps = [
      { label: 'CS01 en magnitude', formula: 'notionnel × annuité risquée × 0.0001', substitution: '50,000,000 × 4.2 × 0.0001', value: cs01, unit: 'EUR/bp' },
      { label: 'Prime annuelle payée', formula: '−notionnel × spread en décimal', substitution: '−50,000,000 × 0.012', value: -notional*spread*.0001, unit: 'EUR/an' },
      { label: 'P&L de spread acheteur de protection', formula: 'CS01 × élargissement en bp', substitution: '21,000 × 25', value: cs01*shock, unit: 'EUR' },
    ];
    decision = 'L’acheteur de protection gagne lors d’un élargissement de spread, mais paie la prime. L’approximation locale ne valorise pas un défaut ni les changements de recovery.';
  } else if (/\bvar\b|value.at.risk|portfolio/.test(text)) {
    reference = {product:'Portfolio',concept:'VaR paramétrique à un jour',category:'Risk',difficulty:'beginner'};
    title = 'Exemple hors connexion — Limite de VaR';
    const value = 20e6*.02*1.6448536269514722;
    inputs = [['Portefeuille', '20,000,000 EUR'], ['Volatilité quotidienne', '2%'], ['Confiance', '95%'], ['Limite', '600,000 EUR']];
    steps = [{ label: 'VaR paramétrique un jour', formula: 'valeur × volatilité × quantile normal 95%', substitution: '20,000,000 × 0.02 × 1.6448536269514722', value, unit: 'EUR' },
      { label: 'Dépassement de limite', formula: 'VaR − limite', substitution: `${f(value)} − 600,000`, value: value-600e3, unit: 'EUR' }];
    decision = 'La limite est dépassée : réduire, couvrir ou escalader selon la politique du desk. La VaR normale ne mesure ni la perte maximale ni correctement toutes les queues de distribution.';
  } else {
    title = 'Exemple hors connexion — Call européen';
    const input = { spot: 100, strike: 100, maturityYears: 1, riskFreeRate: .05, dividendYield: 0, volatility: .2, optionType: 'call' };
    const result = blackScholesOption(input);
    inputs = [['Spot', '100'], ['Strike', '100'], ['Maturité', '1 an'], ['Taux sans risque', '5%'], ['Dividende continu', '0%'], ['Volatilité', '20%']];
    steps = [{ label: 'Prix du call', formula: 'Black-Scholes-Merton européen, q=0', substitution: 'S=100, K=100, T=1, r=5%, q=0%, σ=20%', value: result.price, unit: 'par unité' },
      { label: 'Delta du call', formula: 'exp(−qT) × N(d1)', substitution: `d1=${f(result.d1)}, q=0`, value: result.greeks.delta, unit: 'unité de sous-jacent par option' }];
    decision = `Pour une option longue, vendre ${f(result.greeks.delta)} unité de sous-jacent neutralise le delta local. Rebalancer si le spot bouge ; ce modèle européen suppose taux, dividende et volatilité constants.`;
  }
  if (english) {
    const presented = englishReference({reference, inputs, steps, f});
    ({title, inputs, steps, decision, reference} = presented);
  }
  const count = Math.max(1, Math.min(12, Number(request.number_of_questions) || 5));
  const calculationAnswer = steps.map(s=>`**${s.label}**\n\n- ${english ? 'Formula' : 'Formule'} : ${s.formula}\n- Substitution : ${s.substitution}\n- ${english ? 'Result' : 'Résultat'} : **${f(s.value)} ${s.unit}**`).join('\n\n');
  const tasks = english ? [
    ['Identify the instrument, position direction and inputs of this fixed reference case.', inputs.map(([k,v])=>`- ${k}: ${v}`).join('\n')],
    ['Calculate the outputs using the declared inputs, formulas and units.', calculationAnswer],
    ['Interpret the signs and units without treating a model output as a live quotation.', calculationAnswer+'\n\nThese educational outputs are not executable market quotes.'],
    ['Propose a hedging or escalation decision supported by the outputs.', decision],
    ['State the assumptions and model limitations before reusing the calculation on a real ticket.', decision],
  ] : [
    ['Identifier le produit, le sens de la position et les données du cas fixe.', inputs.map(([k,v])=>`- ${k} : ${v}`).join('\n')],
    ['Calculer les résultats à partir des données indiquées, avec formules et unités.', calculationAnswer],
    ['Interpréter les signes et les unités, sans les confondre avec une cotation live.', calculationAnswer+'\n\nCes résultats sont pédagogiques et ne constituent pas une cotation exécutable.'],
    ['Proposer une décision de couverture reliée aux résultats.', decision],
    ['Présenter les hypothèses et les limites avant une utilisation sur un ticket réel.', decision],
  ];
  const questions = Array.from({length:count},(_,i)=>({number:i+1,prompt:tasks[i%tasks.length][0],answer:count===1?calculationAnswer+'\n\n'+decision:tasks[i%tasks.length][1],points:Math.floor(100/count)+(i<100%count?1:0)}));
  const content = english
    ? `# ${title}\n\n## Desk brief\nFixed offline reference. **Your custom parameters are not applied.** No library source was retrieved for this example. This is not saved to your account as an attempt and does not record skill mastery.\n\n## Given data and assumptions\n${inputs.map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\n## Problem\nUse the fixed inputs above to practise the calculation; retry the generator when the service is available to apply your original ticket.\n\n## Questions\n${questions.map(q=>`${q.number}. ${q.prompt}`).join('\n')}\n\n## Verified solution\n${questions.map(q=>`### Answer ${q.number}\n\n${q.answer}`).join('\n\n')}\n\n### Reference calculations and decision\n${calculationAnswer}\n\n${decision}\n\n## Assessment rubric\n| Question | Success criterion | Points |\n| --- | --- | ---: |\n${questions.map(q=>`| ${q.number} | Response supported by the fixed inputs; correct calculation, sign and units | ${q.points} |`).join('\n')}\n\n**Total: 100 points.** Self-review; no automatic grade or certification is claimed.\n\n## References\nFixed offline example without library sources. Return to the generator to retry your original request.`
    : `# ${title}\n\n## Brief de desk\nExemple fixe hors connexion. **Vos paramètres personnalisés ne sont pas appliqués.** Aucune référence documentaire n’est disponible pour ce cas.\n\n## Données de l’exemple\n${inputs.map(([k,v])=>`- ${k} : ${v}`).join('\n')}\n\n## Questions\n${questions.map(q=>`${q.number}. ${q.prompt}`).join('\n')}\n\n## Corrige verifie\n${questions.map(q=>`### Réponse ${q.number}\n\n${q.answer}`).join('\n\n')}\n\n### Calculs de référence et décision\n${calculationAnswer}\n\n${decision}\n\n## Grille d'évaluation\n| Question | Critère | Points |\n| --- | --- | ---: |\n${questions.map(q=>`| ${q.number} | Réponse reliée aux données du cas, calculs, signes et unités justifiés | ${q.points} |`).join('\n')}\n\n**Total : 100 points.** Auto-évaluation ; aucune notation automatique.\n\n## Références\nExemple hors connexion, sans source de la bibliothèque. Retournez au générateur pour réessayer votre demande originale.`;
  return { title, content, sources: [], metadata: { generation_mode:'offline_reference', source_grounded:false,
    persistence:'device', language:english?'en':'fr', progress_recorded:false, original_request:request, fallback_reason:reason,
    reference,
    reference_calculation:{ inputs, steps }, assessment:{questions,total_points:100,question_count:count,grading_mode:'self_review',language:english?'en':'fr'} } };
}

function englishReference({reference, inputs, steps, f}) {
  const labels = {
    'Notionnel':'Notional', 'Coupon fixe':'Fixed coupon', 'Taux par':'Par rate', 'Annuité':'Annuity',
    'Choc parallèle':'Parallel shock', 'Annuité risquée':'Risky annuity', 'Élargissement':'Spread widening',
    'Portefeuille':'Portfolio', 'Volatilité quotidienne':'Daily volatility', 'Confiance':'Confidence', 'Limite':'Limit',
    'Maturité':'Maturity', 'Taux sans risque':'Risk-free rate', 'Dividende continu':'Continuous dividend yield', 'Volatilité':'Volatility',
  };
  const values = {'Payer fixe / recevoir flottant':'Pay fixed / receive floating', 'Acheteur de protection':'Protection buyer', '1 an':'1 year'};
  inputs = inputs.map(([key,value])=>[labels[key] || key, values[value] || value]);
  const copies = {
    Rates: {
      title:'Fixed offline reference — Swap DV01', concept:'Fixed-payer PV and DV01',
      steps:[['Fixed-payer PV','(par rate − fixed coupon) × annuity × notional','EUR'],
        ['DV01 magnitude','annuity × notional × 0.0001','EUR/bp'],
        ['Fixed-payer rate-shock P&L','DV01 × shock in bp','EUR']],
      decision:'A fixed-rate payer gains under rising par rates. Offset DV01 with an opposite, matching-tenor rate exposure; curve-shape and basis risks remain. This is a single-curve approximation with constant annuity.',
    },
    Credit: {
      title:'Fixed offline reference — CDS CS01', concept:'Protection-buyer CS01 and premium carry',
      steps:[['CS01 magnitude','notional × risky annuity × 0.0001','EUR/bp'],
        ['Annual premium paid','−notional × spread as a decimal','EUR/year'],
        ['Protection-buyer spread-shock P&L','CS01 × spread widening in bp','EUR']],
      decision:'A protection buyer gains mark-to-market when the spread widens but pays premium carry. This local approximation does not value a default event or changes in recovery.',
    },
    Risk: {
      title:'Fixed offline reference — VaR limit', concept:'One-day parametric VaR',
      steps:[['One-day parametric VaR','portfolio value × volatility × normal 95% quantile','EUR'],
        ['Limit breach amount','VaR − limit','EUR']],
      decision:'The computed VaR breaches the stated limit: reduce, hedge or escalate according to the desk policy. Gaussian VaR is neither a maximum-loss estimate nor a complete measure of tail risk.',
    },
    'Black-Scholes': {
      title:'Fixed offline reference — European call', concept:'Black-Scholes pricing and delta',
      steps:[['Call price','European Black-Scholes-Merton, q=0','per underlying unit'],
        ['Call delta','exp(−qT) × N(d1)','underlying units per option']],
      decision:`For one long call, sell ${f(steps[1]?.value)} underlying units to offset local delta. Rebalance when spot moves. This European model assumes constant rates, dividend yield and volatility; it excludes early exercise, transaction costs and jumps.`,
    },
  };
  const copy = copies[reference.category];
  return {title:copy.title, inputs,
    steps:steps.map((step,index)=>({...step,label:copy.steps[index][0],formula:copy.steps[index][1],unit:copy.steps[index][2]})),
    decision:copy.decision,reference:{...reference,concept:copy.concept}};
}
