import { setTimeout as delay } from 'node:timers/promises';

/** El tiempo, inyectable para probar esperas sin esperar de verdad. */
export interface Clock {
  now(): number;
  sleep(ms: number): Promise<void>;
}

export const systemClock: Clock = {
  now: () => Date.now(),
  sleep: async (ms) => {
    await delay(ms);
  },
};
