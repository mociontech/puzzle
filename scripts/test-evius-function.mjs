/* eslint-env node */
// Ejecuta la funcion de Netlify localmente con las variables del .env de esta carpeta.
// Uso:
//   node scripts/test-evius-function.mjs            -> modo "off": valida registros sin enviar nada a Evius
//   node scripts/test-evius-function.mjs --ping     -> POST /experiences con records: [] (confirma token, URL y eventId sin escribir)
//   node scripts/test-evius-function.mjs --live     -> envia UNA partida marcada "PRUEBA borrar" a Evius
//   node scripts/test-evius-function.mjs --live --id <uuid>  -> repite el mismo registro (prueba de idempotencia)
//   agrega --trivia a cualquiera de los anteriores para probar un registro de TRIVIA en vez de puzzle
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const match = /^\s*([A-Z_]+)\s*=\s*(.*)$/.exec(line);
  if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
}
const live = process.argv.includes('--live');
const ping = process.argv.includes('--ping');
const base = (process.env.EVIUS_URL || '').replace(/\/+$/, '');
console.log(`URL: ${base}\nevento: ${process.env.EVIUS_EVENT_ID}   experiencia: ${process.env.EVIUS_EXPERIENCE_ID}\nsource: ${process.env.EVIUS_SOURCE}`);

try {
  const payload = JSON.parse(Buffer.from(process.env.EVIUS_TOKEN.split('.')[1], 'base64url').toString());
  const exp = new Date(payload.exp * 1000);
  console.log(`token: rol ${payload.rol}, vence ${exp.toISOString()} (${exp > new Date() ? 'vigente' : 'VENCIDO'})`);
} catch { console.log('token: no se pudo decodificar'); }

if (ping) {
  // Sin escribir datos: Evius debe responder 200 con "records must be a non-empty array".
  const response = await fetch(`${base}/experiences`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.EVIUS_TOKEN}`, 'Idempotency-Key': `puzzle-renault:ping:${randomUUID()}` },
    body: JSON.stringify({ eventId: process.env.EVIUS_EVENT_ID, source: process.env.EVIUS_SOURCE, sentAt: new Date().toISOString(),
      experienceId: process.env.EVIUS_EXPERIENCE_ID, records: [] }) });
  const text = await response.text();
  console.log(`HTTP ${response.status}\n${text.slice(0, 600)}`);
  const ok = response.status === 200 && /non-empty/i.test(text);
  console.log(ok ? '\nOK: token, URL y eventId aceptados (no se escribio nada).' : '\nFALLO: revisa token/URL/eventId.');
  process.exit(ok ? 0 : 1);
}

process.env.EVIUS_MODE = live ? 'live' : 'off';
const idIndex = process.argv.indexOf('--id');
const id = idIndex > -1 ? process.argv[idIndex + 1] : randomUUID();
const sessionId = process.env.TEST_SESSION_ID || '00000000-0000-4000-8000-0000000000ad';

const { default: handler } = await import(pathToFileURL(join(root, 'netlify', 'functions', 'evius.mjs')).href);
const startedAt = new Date(Date.now() - 83000).toISOString();
const trivia = process.argv.includes('--trivia');
const record = trivia
  ? { kind: 'trivia', id, sessionId, at: new Date().toISOString(), startedAt, result: 'kardian', resultName: 'RENAULT KARDIAN',
      answers: ['B', 'A', 'A', 'A', 'A'], points: { kwid: 2, kardian: 3, duster: 0, arkana: 0, koleos: 0, filante: 0 }, durationMs: 83000, test: true }
  : { kind: 'puzzle', id, sessionId, at: new Date().toISOString(), startedAt, model: 'RENAULT ARKANA HYBRID E-TECH', mode: 'grid', moves: 37, durationMs: 83000, test: true };
const invalid = { id: 'no-es-un-id', sessionId, at: 'ayer', model: 'X', mode: 'otro', moves: 'nada' };

console.log(`\nModo: ${process.env.EVIUS_MODE}   tipo: ${trivia ? 'trivia' : 'puzzle'}   registro de prueba id=${id} sesion=${sessionId}`);
const response = await handler(new Request('http://localhost/.netlify/functions/evius', { method: 'POST',
  headers: { 'content-type': 'application/json' }, body: JSON.stringify({ records: [record, invalid] }) }));
const body = await response.json();
console.log(`HTTP ${response.status}`);
console.log(JSON.stringify(body, null, 2));
const success = response.ok && body.ok && body.sent?.includes(id) && body.rejected?.includes('no-es-un-id');
console.log(success ? '\nOK: el registro valido fue aceptado y el invalido descartado.' : '\nFALLO: revisa la respuesta.');
if (success && live) console.log(`Registro PRUEBA en Evius: correo prueba-${sessionId}@${trivia ? 'trivia' : 'puzzle'}-renault.local (borrarlo despues).`);
process.exit(success ? 0 : 1);
