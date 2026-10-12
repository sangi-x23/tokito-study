/** Las subsecciones de Escritura, en el orden de la barra. `slug` es el de la URL y el de la API. */
export const WRITING_SCRIPTS = [
  {
    slug: 'hiragana',
    label: 'Hiragana',
    japanese: 'ひらがな',
    description: 'El silabario base: partículas, terminaciones y palabras que no llevan kanji.',
  },
  {
    slug: 'katakana',
    label: 'Katakana',
    japanese: 'カタカナ',
    description: 'Palabras extranjeras, nombres de otros idiomas y onomatopeyas.',
  },
] as const;

export type WritingScript = (typeof WRITING_SCRIPTS)[number];

export function findScript(slug: string): WritingScript | null {
  return WRITING_SCRIPTS.find((script) => script.slug === slug) ?? null;
}
