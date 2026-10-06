import type { ItemType, TopicCategory } from '@tokito/shared';

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  WORD: 'Palabra',
  KANJI: 'Kanji',
  GRAMMAR_POINT: 'Gramática',
  PHRASE: 'Frase',
};

export const ITEM_TYPE_STYLE: Record<ItemType, string> = {
  WORD: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  KANJI: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  GRAMMAR_POINT: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  PHRASE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

export const CATEGORY_LABEL: Record<TopicCategory, string> = {
  GRAMMAR: 'Gramática',
  VOCABULARY: 'Vocabulario',
  KANJI: 'Kanji',
  EXPRESSION: 'Expresiones',
  OTHER: 'Otros',
};

export const itemCountLabel = (count: number): string => (count === 1 ? '1 ítem' : `${count} ítems`);
