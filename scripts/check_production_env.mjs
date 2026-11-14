import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const REQUIRED_PUBLIC_VALUES = [
  'VITE_TPL_RAG_API_URL',
  'VITE_TPL_RUM_ENABLED',
  'VITE_TPL_STARTER_KIT_SALES_ENABLED',
  'VITE_TPL_SOURCE_RIGHTS_CLEARED',
  'VITE_TPL_STARTER_KIT_PRICE_EUR',
  'VITE_TPL_LEGAL_NAME',
  'VITE_TPL_LEGAL_FORM_CAPITAL',
  'VITE_TPL_LEGAL_ADDRESS',
  'VITE_TPL_LEGAL_REGISTRATION',
  'VITE_TPL_LEGAL_VAT',
  'VITE_TPL_LEGAL_PHONE',
  'VITE_TPL_PUBLICATION_DIRECTOR',
  'VITE_TPL_HOST_NOTICE',
  'VITE_TPL_CONSUMER_MEDIATOR',
  'VITE_TPL_SUPPORT_EMAIL',
];

export function parseEnvironment(text) {
  const values = {};
  const errors = [];
  String(text || '').split(/\r?\n/).forEach((rawLine, index) => {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) return;
    if (line.startsWith('export ')) line = line.slice(7).trim();
    const separator = line.indexOf('=');
    if (separator <= 0) {
      errors.push(`invalid environment entry at line ${index + 1}`);
      return;
    }
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      errors.push(`invalid environment key at line ${index + 1}`);
      return;
    }
    if (Object.hasOwn(values, key)) {
      errors.push(`duplicate environment key: ${key}`);
      return;
    }
    if (value.length >= 2 && value[0] === value.at(-1) && ['"', "'"].includes(value[0])) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  });
  return { values, errors };
}

const isHttpsOrigin = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && !['localhost', '127.0.0.1', '::1'].includes(url.hostname)
      && !url.username
      && !url.password
      && ['', '/'].includes(url.pathname)
      && !url.search
      && !url.hash;
  } catch {
    return false;
  }
};

export function validateProductionEnvironment(values, parseErrors = []) {
  const errors = [...parseErrors];
  const missing = REQUIRED_PUBLIC_VALUES.filter((key) => !String(values[key] || '').trim());
  if (missing.length) errors.push(`missing production values: ${missing.join(', ')}`);

  const forbiddenKeys = Object.keys(values).filter((key) => (
    /(SECRET|SERVICE_ROLE|PRIVATE_KEY|WEBHOOK|API_KEY)/.test(key)
  ));
  if (forbiddenKeys.length) errors.push(`server secret keys are forbidden in frontend env: ${forbiddenKeys.join(', ')}`);

  const placeholders = REQUIRED_PUBLIC_VALUES.filter((key) => (
    /(replace[-_ ]?with|change[-_ ]?me|placeholder|\btodo\b|\btbd\b|<[^>]*>|\.example(?:\b|\/)|example\.com)/i
      .test(String(values[key] || ''))
  ));
  if (placeholders.length) errors.push(`placeholder production values forbidden: ${placeholders.join(', ')}`);

  if (!isHttpsOrigin(values.VITE_TPL_RAG_API_URL)) {
    errors.push('VITE_TPL_RAG_API_URL must be a public HTTPS origin without credentials, path or query');
  }
  if (values.VITE_TPL_STARTER_KIT_SALES_ENABLED !== 'true') {
    errors.push('VITE_TPL_STARTER_KIT_SALES_ENABLED must be true for the live-sale gate');
  }
  if (values.VITE_TPL_RUM_ENABLED !== 'true') {
    errors.push('VITE_TPL_RUM_ENABLED must be true for production observability');
  }
  if (values.VITE_TPL_SOURCE_RIGHTS_CLEARED !== 'true') {
    errors.push('VITE_TPL_SOURCE_RIGHTS_CLEARED must be true only after rights-clearance evidence is approved');
  }

  const priceText = String(values.VITE_TPL_STARTER_KIT_PRICE_EUR || '').replace(',', '.');
  const price = Number(priceText);
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(String(values.VITE_TPL_STARTER_KIT_PRICE_EUR || ''))
      || !Number.isFinite(price) || price < 1 || price > 10_000) {
    errors.push('VITE_TPL_STARTER_KIT_PRICE_EUR must be a public price between 1 and 10000 EUR');
  }

  const legalKeys = [
    'VITE_TPL_LEGAL_NAME', 'VITE_TPL_LEGAL_FORM_CAPITAL', 'VITE_TPL_LEGAL_ADDRESS',
    'VITE_TPL_LEGAL_REGISTRATION', 'VITE_TPL_LEGAL_VAT', 'VITE_TPL_PUBLICATION_DIRECTOR',
    'VITE_TPL_HOST_NOTICE', 'VITE_TPL_CONSUMER_MEDIATOR',
  ];
  const tooShort = legalKeys.filter((key) => String(values[key] || '').trim().length < 3);
  if (tooShort.length) errors.push(`public legal values are too short: ${tooShort.join(', ')}`);
  const phoneDigits = String(values.VITE_TPL_LEGAL_PHONE || '').replace(/\D/g, '');
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    errors.push('VITE_TPL_LEGAL_PHONE must contain between 8 and 15 digits');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.VITE_TPL_SUPPORT_EMAIL || ''))) {
    errors.push('VITE_TPL_SUPPORT_EMAIL must be a valid monitored email address');
  }
  return [...new Set(errors)];
}

export function main() {
  const file = '.env.production';
  if (!fs.existsSync(file)) {
    console.error('NOT PRODUCTION READY: .env.production is missing');
    return 1;
  }
  const parsed = parseEnvironment(fs.readFileSync(file, 'utf8'));
  const errors = validateProductionEnvironment(parsed.values, parsed.errors);
  if (errors.length) {
    for (const error of errors) console.error(`NOT PRODUCTION READY: ${error}`);
    return 1;
  }
  console.log('PASS live public configuration: sales, legal identity, HTTPS API and RUM are explicit.');
  return 0;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  process.exit(main());
}
