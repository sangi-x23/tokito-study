import type { Clock } from '../types/retry.js';
import { systemClock } from './clock.js';

/**
 * Serializa las llamadas y deja al menos `minIntervalMs` entre el inicio de
 * una y el de la siguiente.
 *
 * Es una cola en memoria del proceso: basta porque la ingesta corre en un solo
 * proceso (el bootstrap local o una función de Vercel), nunca en paralelo, y el
 * candado de `IngestionRun` impide dos corridas a la vez.
 */
export class Throttle {
  private queue: Promise<unknown> = Promise.resolve();
  private lastStart: number | null = null;

  constructor(
    private readonly minIntervalMs: number,
    private readonly clock: Clock = systemClock,
  ) {}

  schedule<T>(task: () => Promise<T>): Promise<T> {
    const run = async (): Promise<T> => {
      if (this.lastStart !== null) {
        const wait = this.lastStart + this.minIntervalMs - this.clock.now();
        if (wait > 0) {
          await this.clock.sleep(wait);
        }
      }

      this.lastStart = this.clock.now();
      return task();
    };

    const result = this.queue.then(run, run);
    // Un fallo no debe atascar la cola: la siguiente tarea espera a que esta
    // termine, salga bien o mal.
    this.queue = result.catch(() => undefined);
    return result;
  }
}
