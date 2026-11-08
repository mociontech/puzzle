// Cola local de interacciones -> /.netlify/functions/evius (la funcion es la que habla con Evius).
// El navegador NUNCA espera a Evius ni conoce el token: guarda la interaccion en localStorage y la
// envia en segundo plano con reintentos crecientes (1, 2, 4, 8, 16, 30 min). Un registro se borra de
// la cola solo cuando la funcion lo devuelve en `sent` (o en `rejected`, si era invalido).
const ENDPOINT = '/.netlify/functions/evius';
const QUEUE_KEY = 'renault.evius.queue';
const STATUS_KEY = 'renault.evius.status';
const BACKOFF = [1, 2, 4, 8, 16, 30].map((m) => m * 60000);
const BATCH = 100;

// ?prueba en la URL marca los registros como PRUEBA (correo prueba-...@, nombre "PRUEBA borrar") para borrarlos luego en Evius.
export const IS_TEST = typeof location !== 'undefined' && new URLSearchParams(location.search).has('prueba');

export const uuid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));

const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ } };

let queue = load(QUEUE_KEY, []);
let timer = null;
let sending = false;

function setStatus(status) {
  save(STATUS_KEY, { ...status, at: new Date().toISOString(), pending: queue.length });
  if (status.state === 'unauthorized' || status.state === 'retrying' || status.state === 'offline') console.warn('Evius:', status.state, status.error);
  if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('evius:status', { detail: status }));
}

function backoff(attempts) { return BACKOFF[Math.min(attempts - 1, BACKOFF.length - 1)]; }

function schedule() {
  clearTimeout(timer);
  if (!queue.length) return;
  const next = Math.min(...queue.map((q) => q.nextAt));
  timer = setTimeout(flush, Math.max(1000, next - Date.now()));
}

export async function flush() {
  if (sending) return;
  const now = Date.now();
  const due = queue.filter((q) => q.nextAt <= now).slice(0, BATCH);
  if (!due.length) { schedule(); return; }
  sending = true;
  try {
    const response = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ records: due.map((q) => q.record) }) });
    const body = await response.json().catch(() => ({}));
    const sent = new Set(body.sent || []), rejected = new Set(body.rejected || []);
    if (response.status === 401 || body.unauthorized) {
      // Token invalidado: no insistir en bucle; reintentar con el tope maximo por si lo renuevan.
      due.forEach((q) => { q.attempts++; q.nextAt = now + BACKOFF[BACKOFF.length - 1]; });
      setStatus({ state: 'unauthorized', error: body.error });
    } else {
      queue = queue.filter((q) => !sent.has(q.record.id) && !rejected.has(q.record.id));
      due.forEach((q) => { if (!sent.has(q.record.id) && !rejected.has(q.record.id)) { q.attempts++; q.nextAt = now + backoff(q.attempts); } });
      setStatus(body.ok ? { state: body.skipped ? 'skipped' : 'synced' } : { state: 'retrying', error: body.error });
    }
  } catch (error) {
    due.forEach((q) => { q.attempts++; q.nextAt = now + backoff(q.attempts); });
    setStatus({ state: 'offline', error: error.message });
  }
  save(QUEUE_KEY, queue);
  sending = false;
  schedule();
}

function enqueue(record) {
  queue.push({ record, attempts: 0, nextAt: 0 });
  save(QUEUE_KEY, queue);
  flush();
}

/** Una sesion = una persona usando el puzzle (desde que toca PUZZLE hasta que vuelve al inicio). */
export function newSession() {
  return { id: uuid(), startedAt: new Date().toISOString() };
}

/** Registra una partida de puzzle terminada. Se envia como score (100 por defecto) con el modelo, el modo y los movimientos. */
export function trackPuzzleCompleted({ sessionId, model, mode, moves, startedAt }) {
  const at = new Date().toISOString();
  const record = { id: uuid(), sessionId, at, startedAt: startedAt || null, model, mode, moves,
    durationMs: startedAt ? Math.max(0, Date.parse(at) - Date.parse(startedAt)) : null, test: IS_TEST };
  enqueue(record);
  return record;
}

export const pendingCount = () => queue.length;
export const lastStatus = () => load(STATUS_KEY, null);

if (typeof window !== 'undefined') {
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) flush(); });
  // Reintenta lo que quedo pendiente de sesiones anteriores.
  if (queue.length) setTimeout(flush, 2000);
}
