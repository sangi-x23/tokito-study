import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Throttle } from '../helpers/throttle.js';
import { fakeClock } from './fake-clock.js';

describe('Throttle', () => {
  it('no espera en la primera llamada', async () => {
    const { clock, sleeps } = fakeClock();
    await new Throttle(5000, clock).schedule(async () => 'ok');

    assert.deepEqual(sleeps, []);
  });

  it('espacia las llamadas seguidas por el intervalo mínimo', async () => {
    const { clock, sleeps } = fakeClock();
    const throttle = new Throttle(5000, clock);

    await Promise.all([1, 2, 3].map((n) => throttle.schedule(async () => n)));

    assert.deepEqual(sleeps, [5000, 5000]);
  });

  it('descuenta el tiempo que ya pasó desde la llamada anterior', async () => {
    const { clock, sleeps, advance } = fakeClock();
    const throttle = new Throttle(5000, clock);

    await throttle.schedule(async () => advance(3000));
    await throttle.schedule(async () => undefined);

    assert.deepEqual(sleeps, [2000]);
  });

  it('ejecuta las tareas en orden y de una en una', async () => {
    const { clock } = fakeClock();
    const throttle = new Throttle(0, clock);
    const log: string[] = [];

    await Promise.all(
      ['a', 'b', 'c'].map((name) =>
        throttle.schedule(async () => {
          log.push(`${name}:inicio`);
          await Promise.resolve();
          log.push(`${name}:fin`);
        }),
      ),
    );

    assert.deepEqual(log, ['a:inicio', 'a:fin', 'b:inicio', 'b:fin', 'c:inicio', 'c:fin']);
  });

  it('un fallo no atasca la cola', async () => {
    const { clock } = fakeClock();
    const throttle = new Throttle(0, clock);

    await assert.rejects(throttle.schedule(async () => Promise.reject(new Error('falla'))));
    assert.equal(await throttle.schedule(async () => 'sigue'), 'sigue');
  });
});
