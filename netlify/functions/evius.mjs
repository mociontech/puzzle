/* eslint-env node */
/* eslint-disable no-control-regex */
// Netlify Function: el UNICO codigo que habla con Evius Datahub para la experiencia Renault.
// El navegador envia { records: [partida de puzzle terminada...] } y recibe
// { ok, mode, skipped?, sent: [ids], rejected: [ids], errors: [], unauthorized? }.
//
// El puzzle es anonimo (no hay registro de persona): cada sesion de uso se identifica con un
// correo sintetico estable anon-<sessionId>@puzzle-renault.local. Evius deduplica asistentes por
// correo, asi que /attendees cuenta PERSONAS (sesiones) y /experiences cuenta PARTIDAS terminadas.
// Este esquema de correos sinteticos debe aprobarlo quien administra Evius antes de produccion.
import { createHash } from 'node:crypto';

const EXPERIENCE_NAME = 'Puzzle Renault';
const EMAIL_DOMAIN = 'puzzle-renault.local';
const MAX_RECORDS = 300;
const ID = /^[0-9a-f-]{8,64}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/;
const MODES = new Set(['grid', 'jigsaw']);

const json = (status, body) => new Response(JSON.stringify(body),
  { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clean = (value, max) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';
const num = (value, max) => { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n))) : null; };

function validate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = clean(raw.id, 64), sessionId = clean(raw.sessionId, 64), at = clean(raw.at, 32), startedAt = clean(raw.startedAt, 32);
  if (!ID.test(id) || !ID.test(sessionId)) return null;
  if (!ISO.test(at) || Number.isNaN(Date.parse(at))) return null;
  const model = clean(raw.model, 80), mode = clean(raw.mode, 10);
  if (model.length < 3 || !MODES.has(mode)) return null;
  const moves = num(raw.moves, 100000);
  if (moves === null) return null;
  return { id, sessionId, at, startedAt: ISO.test(startedAt) ? startedAt : null, model, mode, moves,
    durationMs: num(raw.durationMs, 6 * 3_600_000), test: raw.test === true };
}

const email = r => `${r.test ? 'prueba' : 'anon'}-${r.sessionId.toLowerCase()}@${EMAIL_DOMAIN}`;
const fullName = r => r.test ? 'PRUEBA borrar - Participante anónimo' : 'Participante anónimo';
const attendee = r => ({ email: email(r), fullName: fullName(r), participantId: r.sessionId, company: EXPERIENCE_NAME });
const experience = (r, score) => ({ email: email(r), fullName: fullName(r), participantId: r.sessionId, participationId: r.id,
  experience: EXPERIENCE_NAME, play_timestamp: r.at, score, completed: true,
  model: r.model, mode: r.mode === 'grid' ? 'Modo A: Cuadrícula' : 'Modo B: Piezas', moves: r.moves, durationMs: r.durationMs, startedAt: r.startedAt });

const idempotencyKey = (path, ids) => `puzzle-renault:${path}:${createHash('sha256').update([...ids].sort().join('\n')).digest('hex').slice(0, 32)}`;

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
    experienceId: env.EVIUS_EXPERIENCE_ID || '', source: env.EVIUS_SOURCE || '', mode: (env.EVIUS_MODE || 'off').toLowerCase(),
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
  if (!cfg.url || !cfg.token || !cfg.eventId || !cfg.experienceId || !cfg.source)
    return json(500, { ok: false, error: 'Faltan EVIUS_URL, EVIUS_TOKEN, EVIUS_EVENT_ID, EVIUS_EXPERIENCE_ID o EVIUS_SOURCE en el servidor' });

  const base = { eventId: cfg.eventId, source: cfg.source, sentAt: new Date().toISOString() };
  // 1. Un asistente por sesion (Evius identifica a la persona por email).
  const people = new Map();
  for (const r of valid) { const e = email(r); if (!people.has(e)) people.set(e, attendee(r)); }
  const attendees = await post(cfg, 'attendees', { ...base, records: [...people.values()] }, idempotencyKey('attendees', people.keys()));
  if (attendees.unauthorized) return json(401, { ok: false, unauthorized: true, error: attendees.error, sent: [], rejected });
  if (!attendees.ok) return json(502, { ok: false, error: attendees.error, sent: [], rejected, errors: [attendees.error] });
  // 2. Todas las partidas del lote en una sola llamada a /experiences.
  const result = await post(cfg, 'experiences', { ...base, experienceId: cfg.experienceId, records: valid.map(r => experience(r, cfg.score)) },
    idempotencyKey('experiences', valid.map(r => r.id)));
  if (result.unauthorized) return json(401, { ok: false, unauthorized: true, error: result.error, sent: [], rejected });
  if (!result.ok) return json(502, { ok: false, error: result.error, sent: [], rejected, errors: [result.error] });
  return json(200, { ok: true, mode: 'live', sent: valid.map(r => r.id), rejected, errors: [] });
};
