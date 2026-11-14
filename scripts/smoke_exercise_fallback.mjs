import assert from 'node:assert/strict';
import { buildOfflineReference } from '../src/claude/exerciseFallback.mjs';

const cases = [
  {name:'European call',product:'European call option', expected:[10.450583572185565,0.6368306511756191]},
  {name:'Fixed-payer swap',product:'EUR interest rate swap',expected:[-910000,45500,455000]},
  {name:'Protection-buyer CDS',product:'Single-name CDS',expected:[21000,-600000,525000]},
  {name:'One-day VaR',product:'Portfolio VaR',expected:[657941.4507805889,57941.4507805889]},
];
let checks = 0;
for (const item of cases) {
  for (const language of ['en','fr']) {
    const request = {language,product:item.product,number_of_questions:5,
      free_prompt:'spot999 strike20 volatility90% maturity3 rate1%; custom inputs must not apply'};
    const result = buildOfflineReference(request,'Deliberate offline smoke');
    const steps = result.metadata.reference_calculation.steps;
    assert.equal(steps.length,item.expected.length);
    steps.forEach((step,index)=>assert.ok(Math.abs(step.value-item.expected[index])<2e-5,
      `${item.name} ${language}: independent reference ${index+1}`));
    assert.equal(result.metadata.language,language);
    assert.equal(result.metadata.source_grounded,false);
    assert.equal(result.metadata.progress_recorded,false);
    assert.equal(result.metadata.generation_mode,'offline_reference');
    assert.deepEqual(result.sources,[]);
    assert.deepEqual(result.metadata.original_request,request);
    assert.equal(result.metadata.assessment.grading_mode,'self_review');
    assert.equal(result.metadata.assessment.questions.length,5);
    assert.equal(result.metadata.assessment.questions.reduce((total,q)=>total+q.points,0),100);
    if (language === 'en') {
      assert.ok(result.title.startsWith('Fixed offline reference'));
      assert.ok(result.content.includes('Your custom parameters are not applied'));
      assert.ok(result.content.includes('does not record skill mastery'));
      assert.ok(result.content.includes('## Verified solution'));
      assert.equal((result.content.match(/^### Answer \d+/gm)||[]).length,5);
      assert.ok(!/Réponse|Corrige|notionnel|maturité|volatilité|acheteur|protection payée/.test(result.content));
    } else {
      assert.ok(result.title.startsWith('Exemple hors connexion'));
      assert.ok(result.content.includes('paramètres personnalisés ne sont pas appliqués'));
      assert.equal((result.content.match(/^### Réponse \d+/gm)||[]).length,5);
    }
    checks++;
  }
}
for (const count of [1,3,8,12]) {
  const result = buildOfflineReference({product:'call',language:'en',number_of_questions:count});
  assert.equal(result.metadata.assessment.questions.length,count);
  assert.equal(result.metadata.assessment.questions.reduce((total,q)=>total+q.points,0),100);
  assert.equal((result.content.match(/^### Answer \d+/gm)||[]).length,count);
  checks++;
}
console.log(JSON.stringify({verdict:'PASS',checks,scope:'four fixed EN/FR offline references, independent values, no custom pricing/source/mastery claim'}));
