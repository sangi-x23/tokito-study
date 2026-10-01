import type { Clock } from '../helpers/clock';

/** Reloj de mentira: `sleep` avanza el tiempo al instante y queda registrado. */
export function fakeClock(): { clock: Clock; sleeps: number[]; advance(ms: number): void } {
  let now = 0;
  const sleeps: number[] = [];

  return {
    clock: {
      now: () => now,
      sleep: async (ms) => {
        sleeps.push(ms);
        now += ms;
      },
    },
    sleeps,
    advance: (ms) => {
      now += ms;
    },
  };
}
