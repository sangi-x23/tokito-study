import { setTimeout as delay } from 'node:timers/promises';
import type { Clock } from '../types/retry.js';

export const systemClock: Clock = {
  now: () => Date.now(),
  sleep: async (ms) => {
    await delay(ms);
  },
};
