import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadGoogleEnv } from '../config/google-docs.env';

const KEY_JSON = {
  client_email: 'tokito@ejemplo.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
};

const encoded = Buffer.from(JSON.stringify(KEY_JSON)).toString('base64');
const DOC_ID = '1aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789';

const envWith = (overrides: Record<string, string>): NodeJS.ProcessEnv => ({
  GOOGLE_SERVICE_ACCOUNT_KEY: encoded,
  GOOGLE_DOC_ID: DOC_ID,
  ...overrides,
});

describe('loadGoogleEnv', () => {
  it('decodifica la clave de la cuenta de servicio', () => {
    const env = loadGoogleEnv(envWith({}));

    assert.equal(env.GOOGLE_SERVICE_ACCOUNT_KEY.client_email, KEY_JSON.client_email);
    assert.equal(env.GOOGLE_SERVICE_ACCOUNT_KEY.private_key, KEY_JSON.private_key);
  });

  it('extrae el ID del documento de una URL completa', () => {
    const env = loadGoogleEnv(
      envWith({ GOOGLE_DOC_ID: `https://docs.google.com/document/d/${DOC_ID}/edit?tab=t.0` }),
    );

    assert.equal(env.GOOGLE_DOC_ID, DOC_ID);
  });

  it('acepta el ID pelado', () => {
    assert.equal(loadGoogleEnv(envWith({})).GOOGLE_DOC_ID, DOC_ID);
  });

  it('rechaza una clave que no es base64 de un JSON', () => {
    assert.throws(
      () => loadGoogleEnv(envWith({ GOOGLE_SERVICE_ACCOUNT_KEY: 'esto-no-es-base64-json' })),
      /codificado en base64/,
    );
  });

  it('rechaza un JSON sin los campos de la cuenta de servicio', () => {
    const incompleto = Buffer.from(JSON.stringify({ foo: 1 })).toString('base64');

    assert.throws(
      () => loadGoogleEnv(envWith({ GOOGLE_SERVICE_ACCOUNT_KEY: incompleto })),
      /client_email/,
    );
  });

  it('rechaza algo que no parece un ID de documento', () => {
    assert.throws(
      () => loadGoogleEnv(envWith({ GOOGLE_DOC_ID: 'corto' })),
      /no parece un ID de Google Doc/,
    );
  });
});
