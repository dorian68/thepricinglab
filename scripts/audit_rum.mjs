import fs from 'node:fs';

const source = fs.readFileSync('src/observability/rum.ts', 'utf8');
const main = fs.readFileSync('src/main.tsx', 'utf8');
const failures = [];
const requireText = (value, message) => { if (!source.includes(value)) failures.push(message); };

for (const metric of ["'FCP'", "'LCP'", "'CLS'", "'TTFB'", "'INTERACTION'"]) {
  requireText(metric, `RUM metric contract missing ${metric}`);
}
requireText("VITE_TPL_RUM_ENABLED === 'true'", 'RUM must be explicitly enabled');
requireText("import.meta.env.PROD", 'RUM must be production-only');
requireText('new URL(', 'RUM API validation must parse the configured URL');
requireText("url.protocol !== 'https:'", 'RUM API validation must require HTTPS');
requireText('url.username', 'RUM API validation must reject embedded credentials');
requireText("['localhost', '127.0.0.1', '::1']", 'RUM API validation must reject local hosts');
requireText("/telemetry/rum", 'RUM endpoint missing');
requireText("return '/courses/:slug'", 'RUM must normalize course paths before transmission');
requireText("return '/other'", 'RUM must collapse unknown paths before transmission');
requireText("credentials: 'omit'", 'RUM must not send browser credentials');
requireText("referrerPolicy: 'no-referrer'", 'RUM must suppress referrer data');
requireText('keepalive: true', 'RUM unload delivery must use keepalive');
if (!main.includes("startRumMonitoring();")) failures.push('RUM startup is not wired in main.tsx');

for (const forbidden of ['localStorage', 'sessionStorage', 'document.cookie', 'user_id', 'email:', 'Authorization', 'access_token']) {
  if (source.includes(forbidden)) failures.push(`privacy-forbidden RUM source term: ${forbidden}`);
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log('PASS production-only, opt-in and privacy-bounded browser RUM contract');
