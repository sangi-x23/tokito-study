import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { LlmValidationError, type LlmPart } from '../../llm';
import { LlmPendingError, ManualProvider } from '../bootstrap/manual-provider';

const parts: LlmPart[] = [
  { kind: 'text', text: 'ねこ = gato' },
  { kind: 'image', imageId: 'img1', mimeType: 'image/jpeg', data: Buffer.from('jpeg') },
];

const validResponse = {
  items: [
    {
      type: 'WORD',
      japanese: 'ねこ',
      reading: null,
      meaning: 'gato',
      example: null,
      topicLabel: 'Animales',
      kanji: null,
    },
  ],
  imageTexts: [{ imageId: 'img1', text: 'ねこ' }],
};

describe('ManualProvider', async () => {
  const root = await mkdtemp(join(tmpdir(), 'manual-provider-'));
  after(() => rm(root, { recursive: true, force: true }));

  // Cada caso con su carpeta, para que las solicitudes no se pisen.
  const freshProvider = async () => {
    const dir = await mkdtemp(join(root, 'case-'));
    return { dir, provider: new ManualProvider(dir) };
  };

  const pendingDir = async (provider: ManualProvider): Promise<string> => {
    const error = await provider.extractStudyItems(parts).then(
      () => assert.fail('debía quedar pendiente'),
      (caught: unknown) => caught,
    );
    assert.ok(error instanceof LlmPendingError);
    return error.requestDir;
  };

  it('sin respuesta deja la solicitud con sus imágenes y queda pendiente', async () => {
    const { provider } = await freshProvider();
    const requestDir = await pendingDir(provider);

    assert.deepEqual((await readdir(requestDir)).sort(), ['img1.jpg', 'request.md']);
    const request = await readFile(join(requestDir, 'request.md'), 'utf8');
    assert.match(request, /ねこ = gato/);
    assert.match(request, /\[imagen img1\]/);
  });

  it('con respuesta válida la devuelve', async () => {
    const { provider } = await freshProvider();
    const requestDir = await pendingDir(provider);
    await writeFile(join(requestDir, 'response.json'), JSON.stringify(validResponse));

    const result = await provider.extractStudyItems(parts);
    assert.equal(result.items[0]?.japanese, 'ねこ');
  });

  it('valida la respuesta con las mismas reglas que la de Gemini', async () => {
    const { provider } = await freshProvider();
    const requestDir = await pendingDir(provider);
    // Falta el texto de la imagen enviada.
    await writeFile(join(requestDir, 'response.json'), JSON.stringify({ ...validResponse, imageTexts: [] }));

    await assert.rejects(provider.extractStudyItems(parts), LlmValidationError);
  });

  it('un contenido distinto pide una solicitud nueva', async () => {
    const { provider } = await freshProvider();
    const first = await pendingDir(provider);
    await writeFile(join(first, 'response.json'), JSON.stringify(validResponse));

    const changed: LlmPart[] = [{ kind: 'text', text: 'いぬ = perro' }];
    await assert.rejects(provider.extractStudyItems(changed), LlmPendingError);
  });
});
