import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadLlmEnv } from '../config/llm.env';

const base = { GEMINI_API_KEY: 'clave', GEMINI_MODEL: 'gemini-3.5-flash' };

describe('loadLlmEnv', () => {
  it('aplica valores por defecto conservadores al ritmo y los reintentos', () => {
    const env = loadLlmEnv(base);

    assert.equal(env.GEMINI_MIN_INTERVAL_MS, 7000);
    assert.equal(env.GEMINI_MAX_RETRIES, 4);
  });

  it('acepta el modelo con el prefijo models/ del listado', () => {
    assert.equal(loadLlmEnv({ ...base, GEMINI_MODEL: 'models/gemini-3.5-flash' }).GEMINI_MODEL, 'gemini-3.5-flash');
  });

  it('rechaza algo que no parece un modelo de Gemini', () => {
    assert.throws(() => loadLlmEnv({ ...base, GEMINI_MODEL: 'gpt-4' }), /no parece un modelo de Gemini/);
  });

  it('exige la clave', () => {
    assert.throws(() => loadLlmEnv({ GEMINI_MODEL: 'gemini-3.5-flash' }), /GEMINI_API_KEY/);
  });

  it('lee el ritmo y los reintentos del entorno', () => {
    const env = loadLlmEnv({ ...base, GEMINI_MIN_INTERVAL_MS: '12000', GEMINI_MAX_RETRIES: '0' });

    assert.equal(env.GEMINI_MIN_INTERVAL_MS, 12000);
    assert.equal(env.GEMINI_MAX_RETRIES, 0);
  });
});
