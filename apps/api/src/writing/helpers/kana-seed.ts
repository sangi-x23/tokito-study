import type { Prisma } from '../../generated/prisma/client.js';
import type { KanaDefinition, KanaSeed, KanaSeedPlan, StoredKana } from '../types/kana.js';

/**
 * Une la tabla con los trazos descargados. Un kana de varios caracteres no
 * lleva trazos propios: se dibuja con los de cada carácter.
 */
export function withStrokes(table: readonly KanaDefinition[], strokes: ReadonlyMap<string, readonly string[]>): KanaSeed[] {
  return table.map((kana) => {
    if ([...kana.character].length > 1) {
      return { ...kana, strokes: [] };
    }
    const own = strokes.get(kana.character);
    if (!own) {
      throw new Error(`No hay trazos para ${kana.character}`);
    }
    return { ...kana, strokes: own };
  });
}

const FIELDS = ['script', 'kind', 'romaji', 'row', 'column', 'strokes'] as const;

const sameKana = (a: KanaSeed, b: KanaSeed): boolean =>
  FIELDS.every((field) => JSON.stringify(a[field]) === JSON.stringify(b[field]));

/** Compara lo que define el seed con lo que hay en la base, por `character`. */
export function planKanaSeed(seeds: readonly KanaSeed[], stored: readonly StoredKana[]): KanaSeedPlan {
  const byCharacter = new Map(stored.map((kana) => [kana.character, kana]));
  const create: KanaSeed[] = [];
  const update: { id: string; kana: KanaSeed }[] = [];
  let unchanged = 0;

  for (const kana of seeds) {
    const existing = byCharacter.get(kana.character);
    if (!existing) {
      create.push(kana);
    } else if (sameKana(kana, existing)) {
      unchanged++;
    } else {
      update.push({ id: existing.id, kana });
    }
  }

  const defined = new Set(seeds.map((kana) => kana.character));
  const orphaned = stored.filter((kana) => !defined.has(kana.character)).map((kana) => kana.character);

  return { create, update, unchanged, orphaned };
}

/**
 * Aplica el plan dentro de una transacción: crea lo nuevo de una vez y
 * actualiza solo lo que cambió, sin recrear filas, para que los IDs sean
 * estables entre corridas.
 *
 * Las actualizaciones van primero a una celda negativa y después a la suya:
 * si dos kana intercambian celda, la unicidad de `[script, kind, row, column]`
 * fallaría a mitad del cambio.
 */
export async function writeKanaSeed(tx: Prisma.TransactionClient, plan: KanaSeedPlan): Promise<void> {
  for (const [index, { id }] of plan.update.entries()) {
    await tx.kana.update({ where: { id }, data: { row: -1 - index } });
  }
  for (const { id, kana } of plan.update) {
    await tx.kana.update({ where: { id }, data: toData(kana) });
  }
  if (plan.create.length > 0) {
    await tx.kana.createMany({ data: plan.create.map(toData) });
  }
}

const toData = (kana: KanaSeed): Prisma.KanaCreateManyInput => ({
  character: kana.character,
  script: kana.script,
  kind: kana.kind,
  romaji: kana.romaji,
  row: kana.row,
  column: kana.column,
  strokes: [...kana.strokes],
});
