/* eslint-env node */
/* eslint-disable no-control-regex */
// Netlify Function: el UNICO codigo que habla con Evius Datahub para la experiencia Renault.
// El navegador envia { records: [interaccion...] } y recibe
// { ok, mode, skipped?, sent: [ids], rejected: [ids], errors: [], unauthorized? }.
//
// Dos tipos de interaccion (campo `kind`):
//   - "puzzle" (por defecto): un rompecabezas completado  -> experiencia EVIUS_EXPERIENCE_ID
//   - "trivia": una trivia terminada con su carro recomendado -> experiencia EVIUS_TRIVIA_EXPERIENCE_ID
//
// Las experiencias son anonimas (no hay registro de persona): cada sesion de uso se identifica con un
// correo sintetico estable anon-<sessionId>@<experiencia>-renault.local. Evius deduplica asistentes por
// correo, asi que /attendees cuenta PERSONAS (sesiones) y /experiences cuenta PARTIDAS/TRIVIAS terminadas.
// Este esquema de correos sinteticos debe aprobarlo quien administra Evius antes de produccion.
import { createHash } from 'node:crypto';

const MAX_RECORDS = 300;
const ID = /^[0-9a-f-]{8,64}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/;
const MODES = new Set(['grid', 'jigsaw']);
const CARS = new Set(['kwid', 'kardian', 'duster', 'arkana', 'koleos', 'filante']);
const KINDS = {
  puzzle: { name: 'Puzzle Renault', domain: 'puzzle-renault.local', envId: 'EVIUS_EXPERIENCE_ID' },
  trivia: { name: 'Trivia Renault', domain: 'trivia-renault.local', envId: 'EVIUS_TRIVIA_EXPERIENCE_ID' },
};

const json = (status, body) => new Response(JSON.stringify(body),
  { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clean = (value, max) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';
const num = (value, max) => { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n))) : null; };

function validate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const kind = raw.kind === undefined ? 'puzzle' : clean(raw.kind, 10);
  if (!KINDS[kind]) return null;
  const id = clean(raw.id, 64), sessionId = clean(raw.sessionId, 64), at = clean(raw.at, 32), startedAt = clean(raw.startedAt, 32);
  if (!ID.test(id) || !ID.test(sessionId)) return null;
  if (!ISO.test(at) || Number.isNaN(Date.parse(at))) return null;
  const base = { kind, id, sessionId, at, startedAt: ISO.test(startedAt) ? startedAt : null,
    durationMs: num(raw.durationMs, 6 * 3_600_000), test: raw.test === true };
  if (kind === 'puzzle') {
    const model = clean(raw.model, 80), mode = clean(raw.mode, 10), moves = num(raw.moves, 100000);
    if (model.length < 3 || !MODES.has(mode) || moves === null) return null;
    return { ...base, model, mode, moves };
  }
  // trivia
  const result = clean(raw.result, 20).toLowerCase(), resultName = clean(raw.resultName, 80);
  if (!CARS.has(result) || resultName.length < 3) return null;
  const answers = Array.isArray(raw.answers) ? raw.answers.map((a) => clean(a, 1).toUpperCase()) : [];
  if (answers.length !== 5 || !answers.every((a) => 'ABCD'.includes(a) && a)) return null;
  const points = {};
  if (raw.points && typeof raw.points === 'object') {
    for (const car of CARS) { const n = num(raw.points[car], 5); if (n !== null) points[car] = n; }
  }
  return { ...base, result, resultName, answers, points };
}

const email = r => `${r.test ? 'prueba' : 'anon'}-${r.sessionId.toLowerCase()}@${KINDS[r.kind].domain}`;
const fullName = r => r.test ? 'PRUEBA borrar - Participante anónimo' : 'Participante anónimo';
const attendee = r => ({ email: email(r), fullName: fullName(r), participantId: r.sessionId, company: KINDS[r.kind].name });
function experience(r, score) {
  const common = { email: email(r), fullName: fullName(r), participantId: r.sessionId, participationId: r.id,
    experience: KINDS[r.kind].name, play_timestamp: r.at, score, completed: true, durationMs: r.durationMs, startedAt: r.startedAt };
  if (r.kind === 'puzzle') return { ...common, model: r.model, mode: r.mode === 'grid' ? 'Modo A: Cuadrícula' : 'Modo B: Piezas', moves: r.moves };
  return { ...common, result: r.resultName, resultId: r.result, answers: r.answers.join(''),
    q1: r.answers[0], q2: r.answers[1], q3: r.answers[2], q4: r.answers[3], q5: r.answers[4], points: r.points };
}

const idempotencyKey = (path, ids) => `renault:${path}:${createHash('sha256').update([...ids].sort().join('\n')).digest('hex').slice(0, 32)}`;

async function post(cfg, path, payload, key) {
  let response;
  try {
    response = await fetch(`${cfg.url}/${path}`, { method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.token}`, 'Idempotency-Key': key },
      body: JSON.stringify(payload) });
  } catch (error) { return { ok: false, error: `${path}: sin respuesta (${error.name})` }; }
  if (response.status === 401) return { ok: false, unauthorized: true, error: 'Evius rechazo el token (401). Renueva EVIUS_TOKEN.' };
  const data = await response.json().catch(() => null);
  if (!response.ok) return { ok: false, error: `${path}: HTTP ${response.status} ${data?.message || ''}`.trim() };
  // Evius responde 200 aunque fallen registros: el exito lo decide el cuerpo.
  const count = payload.records.length;
  const ok = !!data && data.failed === 0 && Array.isArray(data.errors) && data.errors.length === 0 && data.processed >= count;
  return { ok, error: ok ? null : `${path}: received=${data?.received} processed=${data?.processed} failed=${data?.failed} ` +
    JSON.stringify(data?.errors ?? data).slice(0, 400) };
}

export default async (request) => {
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Solo POST' });
  const env = process.env;
  const perCompletion = Number(env.EVIUS_SCORE_PER_COMPLETION);
  const cfg = { url: (env.EVIUS_URL || '').replace(/\/+$/, ''), token: env.EVIUS_TOKEN || '', eventId: env.EVIUS_EVENT_ID || '',
    source: env.EVIUS_SOURCE || '', mode: (env.EVIUS_MODE || 'off').toLowerCase(),
    experienceIds: { puzzle: env.EVIUS_EXPERIENCE_ID || '', trivia: env.EVIUS_TRIVIA_EXPERIENCE_ID || '' },
    score: Number.isFinite(perCompletion) ? Math.min(100, Math.max(0, perCompletion)) : 100 };
  let body;
  try { body = await request.json(); } catch { return json(400, { ok: false, error: 'JSON invalido' }); }
  const incoming = Array.isArray(body?.records) ? body.records.slice(0, MAX_RECORDS) : [];
  const valid = [], rejected = [];
  for (const raw of incoming) {
    const record = validate(raw);
    if (record) valid.push(record); else if (typeof raw?.id === 'string') rejected.push(raw.id.slice(0, 64));
  }
  if (!valid.length) return json(400, { ok: false, error: 'Sin registros validos', sent: [], rejected });
  if (cfg.mode !== 'live') return json(200, { ok: true, mode: cfg.mode, skipped: true, sent: valid.map(r => r.id), rejected, errors: [] });
  if (!cfg.url || !cfg.token || !cfg.eventId || !cfg.source)
    return json(500, { ok: false, error: 'Faltan EVIUS_URL, EVIUS_TOKEN, EVIUS_EVENT_ID o EVIUS_SOURCE en el servidor' });
  const kinds = [...new Set(valid.map(r => r.kind))];
  const missing = kinds.filter(k => !cfg.experienceIds[k]).map(k => KINDS[k].envId);
  if (missing.length) return json(500, { ok: false, error: `Falta ${missing.join(' y ')} en el servidor`, sent: [], rejected });

  const base = { eventId: cfg.eventId, source: cfg.source, sentAt: new Date().toISOString() };
  // 1. Un asistente por sesion (Evius identifica a la persona por email).
  const people = new Map();
  for (const r of valid) { const e = email(r); if (!people.has(e)) people.set(e, attendee(r)); }
  const attendees = await post(cfg, 'attendees', { ...base, records: [...people.values()] }, idempotencyKey('attendees', people.keys()));
  if (attendees.unauthorized) return json(401, { ok: false, unauthorized: true, error: attendees.error, sent: [], rejected });
  if (!attendees.ok) return json(502, { ok: false, error: attendees.error, sent: [], rejected, errors: [attendees.error] });
  // 2. Una llamada a /experiences por tipo (puzzle y trivia tienen experiencias distintas en Evius).
  const sent = [], errors = [];
  for (const kind of kinds) {
    const group = valid.filter(r => r.kind === kind);
    const result = await post(cfg, 'experiences', { ...base, experienceId: cfg.experienceIds[kind], records: group.map(r => experience(r, cfg.score)) },
      idempotencyKey(`experiences:${kind}`, group.map(r => r.id)));
    if (result.unauthorized) return json(401, { ok: false, unauthorized: true, error: result.error, sent, rejected });
    if (result.ok) sent.push(...group.map(r => r.id)); else errors.push(result.error);
  }
  if (errors.length) return json(502, { ok: sent.length > 0 && errors.length === 0, error: errors.join(' | '), sent, rejected, errors });
  return json(200, { ok: true, mode: 'live', sent, rejected, errors: [] });
};
