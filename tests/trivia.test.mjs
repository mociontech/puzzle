import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { CARS, QUESTIONS, getTriviaResult } from '../src/trivia/triviaData.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(QUESTIONS.length, 5, 'Deben existir cinco preguntas');
assert.equal(Object.keys(CARS).length, 6, 'Deben existir seis modelos');
for (const [i, q] of QUESTIONS.entries()) {
  assert.equal(q.options.length, 4, `Pregunta ${i + 1}: cuatro respuestas`);
  assert.ok(q.options.every((item) => CARS[item.car]), `Pregunta ${i + 1}: modelo válido`);
}
for (const car of Object.values(CARS)) {
  assert.ok(existsSync(resolve(root, 'public', car.image.replace(/^\//,''))), `Falta foto de ${car.name}`);
  assert.match(car.boxUrl, /^https:\/\/lion\.box\.com\/s\//, 'Fuente de foto del cliente');
}

const winners = new Set();
for (let n = 0; n < 4 ** 5; n++) {
  let acc = n;
  const choices = Array.from({ length:5 }, () => { const x = acc % 4; acc = Math.floor(acc / 4); return x; });
  const { car, points } = getTriviaResult(choices);
  assert.ok(car);
  assert.equal(Object.values(points).reduce((a,b)=>a+b,0), 5);
  assert.equal(points[car.id], Math.max(...Object.values(points)), 'Siempre debe ganar uno de los más puntuados');
  winners.add(car.id);
}
assert.equal(winners.size, 6, 'Los seis modelos deben poder salir como resultado');
assert.throws(() => getTriviaResult([0,1]), /cinco respuestas/);
assert.throws(() => getTriviaResult([0,0,0,0,4]), /cinco respuestas/);
// Empate entre Kwid y Kardian: P4 corresponde a Kwid, por tanto gana Kwid.
assert.equal(getTriviaResult([2,0,0,0,0]).car.id, 'kwid');
// P4 no está empatada; desempata la respuesta de P5 = Kardian.
assert.equal(getTriviaResult([2,1,0,0,0]).car.id, 'kardian');
// Sólo un punto por modelo, P4 define el resultado.
assert.equal(getTriviaResult([0,1,1,2,3]).car.id, 'koleos');
console.log('OK: 5 preguntas, 6 fotos, 1024 combinaciones, puntajes y desempates.');
