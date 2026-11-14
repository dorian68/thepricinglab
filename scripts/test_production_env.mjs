import assert from 'node:assert/strict';
import { parseEnvironment, validateProductionEnvironment } from './check_production_env.mjs';

const valid = {
  VITE_TPL_RAG_API_URL: 'https://api.thepricinglibrary.test',
  VITE_TPL_RUM_ENABLED: 'true',
  VITE_TPL_STARTER_KIT_SALES_ENABLED: 'true',
  VITE_TPL_SOURCE_RIGHTS_CLEARED: 'true',
  VITE_TPL_STARTER_KIT_PRICE_EUR: '49.00',
  VITE_TPL_LEGAL_NAME: 'The Pricing Library SAS',
  VITE_TPL_LEGAL_FORM_CAPITAL: 'SAS au capital de 1000 EUR',
  VITE_TPL_LEGAL_ADDRESS: '1 rue des Marches, 75001 Paris',
  VITE_TPL_LEGAL_REGISTRATION: 'RCS Paris 123 456 789',
  VITE_TPL_LEGAL_VAT: 'FR00123456789',
  VITE_TPL_LEGAL_PHONE: '+33 1 23 45 67 89',
  VITE_TPL_PUBLICATION_DIRECTOR: 'Direction de la publication',
  VITE_TPL_HOST_NOTICE: 'Hebergeur SAS, France',
  VITE_TPL_CONSUMER_MEDIATOR: 'Mediateur de la consommation agree',
  VITE_TPL_SUPPORT_EMAIL: 'support@thepricinglibrary.test',
};

assert.deepEqual(validateProductionEnvironment(valid), []);

for (const [key, value, expected] of [
  ['VITE_TPL_RAG_API_URL', 'http://localhost:8000', 'public HTTPS origin'],
  ['VITE_TPL_RUM_ENABLED', 'false', 'production observability'],
  ['VITE_TPL_STARTER_KIT_SALES_ENABLED', 'false', 'live-sale gate'],
  ['VITE_TPL_SOURCE_RIGHTS_CLEARED', 'false', 'rights-clearance evidence'],
  ['VITE_TPL_STARTER_KIT_PRICE_EUR', '0', 'between 1 and 10000 EUR'],
  ['VITE_TPL_LEGAL_NAME', '<legal name>', 'placeholder'],
]) {
  const errors = validateProductionEnvironment({ ...valid, [key]: value });
  assert(errors.some((error) => error.includes(expected)), `${key} mutation was accepted: ${errors}`);
}

assert(validateProductionEnvironment({ ...valid, VITE_STRIPE_SECRET_KEY: 'sk_live_private' })
  .some((error) => error.includes('server secret keys are forbidden')));
assert(validateProductionEnvironment({ ...valid, VITE_TPL_API_KEY: 'member-key-must-stay-server-side' })
  .some((error) => error.includes('server secret keys are forbidden')));

const parsed = parseEnvironment('VITE_TPL_RUM_ENABLED=true\nVITE_TPL_RUM_ENABLED=false\n');
assert(parsed.errors.some((error) => error.includes('duplicate environment key')));

console.log('PASS production environment validator rejects disabled sales/RUM, placeholders, localhost and frontend secrets');
