import type { PersonalNames } from '../types/parser';

// Enlaces de videollamada: Meet, Zoom y Teams.
const VIDEO_CALL_LINK = /(?:https?:\/\/)?(?:meet\.google\.com|[\w.-]*\bzoom\.us|teams\.microsoft\.com)\/\S*/i;

// En el documento el enlace va como hipervínculo sobre este texto, así que la
// URL no llega al texto pero la línea sí.
const VIDEO_CALL_LABEL = /^\s*link\s+de\s+videollamada\b/i;

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;

// Etiquetas típicas de un encabezado de clase: lo que viene después suele ser
// una lista de nombres. Acepta los dos puntos ASCII y los de ancho completo.
const PERSONAL_LABEL =
  /^\s*(?:participantes|asistentes|presentes|integrantes|estudiantes|alumn[oa]s?|compañer[oa]s?|profesor[ae]?s?|docente|invitad[oa]s?|出席者|欠席者|参加者)\s*[:：]/i;

// Asistencia y ausencias de cada clase: `出席者：全員 Ana, Luis`.
const ATTENDANCE = /^\s*(?:出席者|欠席者|参加者)\s*[:：](.*)$/;

// Una entrada de la lista de nombres: `ルイス・カルロス：Luis Carlos`.
const ROSTER_ENTRY = /^\s*([\p{Script=Katakana}ー・]+)\s*[:：]\s*([\p{Script=Latin} ]+?)\s*$/u;

// Alguien tratado de profesor: `ケンジせんせい`, `たなか先生`. El `〜せんせい`
// del vocabulario no cuenta, porque delante lleva `〜` y no un nombre.
const TEACHER = /[\p{Script=Hiragana}\p{Script=Katakana}ー]{2,}(?:せんせい|先生)/u;
const TEACHER_KATAKANA_NAME = /([\p{Script=Katakana}ー]{2,})(?:せんせい|先生)/gu;

// Un compañero tratado con confianza: `ペドロくん`, `ルナちゃん`. Atrapa a
// quien no salió en la lista en katakana. `さん` queda fuera a propósito: es
// el que usan los personajes del libro (`アランさん`), que sí son material.
const CLASSMATE = /[\p{Script=Katakana}ー]{2,}(?:くん|ちゃん)/u;

// Alguien dice cómo se llama: `わたし の みょうじ は ゴメス です`. La
// pregunta suele nombrar a otro compañero y cae por la lista, pero la
// respuesta trae un nombre que no está en ninguna parte.
const NAME_DECLARATION = /(?:なまえ|みょうじ)\s*は\s*([^\s。．、]+?)\s*です/;

// Lo que va en el hueco de una plantilla, que no es un nombre: `〇〇`, `〜`,
// `___`, `nombre`, y el `なん` de la pregunta.
const NAME_PLACEHOLDER = /^(?:[〇○O〜~＿_]+|nombre|apellido|なん|なに)$/i;

// Alguien dice dónde vive: `わたしは 〈barrio〉に すんでいます` y su traducción,
// `Yo vivo en 〈barrio〉`. Solo en primera persona (también `わたしの はは`):
// `アランさんは ロンドンに すんでいます` es del libro y sí es material.
const RESIDENCE_JA = /(?:わたし|わたくし|ぼく|私|僕)\s*(?:の\s*\S+?\s*)?は\s*(.+?)\s*に\s*すんで/u;
const RESIDENCE_ES = /\bvivo\s+en\s+(.+?)\s*(?:[.。,，]|$)/iu;

// Lo que va en el hueco de lugar de una plantilla: `（ Lugar ）`, `［　］`, `〜`.
const PLACE_PLACEHOLDER = /^(?:[〇○O〜~＿_]+|lugar|ciudad|pa[ií]s|barrio|どこ|〈[^〉]*〉)?$/i;

// El nombre de un profesor escrito en los dos alfabetos:
// `山田ケンジ ／ Yamada Kenji`.
const BILINGUAL_NAME = /^\s*([^／/]+?)\s*[／/]\s*([\p{Script=Latin} ]+?)\s*$/u;

const LATIN_NAME = /^\p{Script=Latin}{3,}$/u;
const LATIN_TERM = /^\p{Script=Latin}+$/u;

export const NO_PERSONAL_NAMES: PersonalNames = { latin: [], katakana: [] };

/**
 * Junta los nombres de compañeros y profesores que aparecen en el documento,
 * para poder descartar después las líneas que los mencionan.
 *
 * Las fuentes son tres: las líneas de asistencia (nombres en alfabeto latino),
 * la lista `カタカナ：Nombre` (solo cuando el lado latino ya salió en la
 * asistencia, para no confundirla con vocabulario como `パン：Pan`) y los
 * nombres en katakana delante de `せんせい`.
 *
 * Los nombres viven solo en memoria durante el parseo; nunca se guardan.
 */
export function collectPersonalNames(text: string): PersonalNames {
  const lines = text.split('\n');
  const latin = new Set<string>();
  const katakana = new Set<string>();

  for (const line of lines) {
    const attendees = ATTENDANCE.exec(line)?.[1];
    if (attendees === undefined) {
      continue;
    }

    for (const word of attendees.split(/[\s,、，]+/)) {
      if (LATIN_NAME.test(word)) {
        latin.add(word.toLowerCase());
      }
    }
  }

  for (const line of lines) {
    const entry = ROSTER_ENTRY.exec(line);
    if (entry?.[1] && entry[2]) {
      const words = entry[2].split(/\s+/);
      if (words.every((word) => latin.has(word.toLowerCase()))) {
        katakana.add(entry[1]);
        entry[1].split('・').forEach((part) => part.length >= 2 && katakana.add(part));
      }
    }

    for (const match of line.matchAll(TEACHER_KATAKANA_NAME)) {
      if (match[1]) {
        katakana.add(match[1]);
      }
    }
  }

  // Con los katakana ya reunidos, el lado latino de `山田ケンジ ／ Yamada
  // Kenji` también es un nombre.
  for (const line of lines) {
    const pair = BILINGUAL_NAME.exec(line);
    if (pair?.[1] && pair[2] && [...katakana].some((name) => pair[1]?.includes(name))) {
      pair[2]
        .split(/\s+/)
        .filter((word) => LATIN_NAME.test(word))
        .forEach((word) => latin.add(word.toLowerCase()));
    }
  }

  return { latin: [...latin], katakana: [...katakana] };
}

/**
 * Suma a los nombres del documento los términos configurados a mano: los
 * latinos se buscan como palabra completa, igual que los nombres de la
 * asistencia; el resto, como texto literal.
 */
export function withPersonalTerms(names: PersonalNames, terms: readonly string[]): PersonalNames {
  const latin = terms.filter((term) => LATIN_TERM.test(term)).map((term) => term.toLowerCase());
  const literal = terms.filter((term) => !LATIN_TERM.test(term));

  return {
    latin: [...names.latin, ...latin],
    katakana: names.katakana,
    literal: [...(names.literal ?? []), ...literal],
  };
}

function declaresName(line: string): boolean {
  const name = NAME_DECLARATION.exec(line)?.[1];
  return name !== undefined && !NAME_PLACEHOLDER.test(name);
}

function declaresResidence(line: string): boolean {
  const place = (RESIDENCE_JA.exec(line) ?? RESIDENCE_ES.exec(line))?.[1];
  return place !== undefined && !PLACE_PLACEHOLDER.test(place.replace(/[\s　()（）［］[\]]/gu, ''));
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Un nombre cuenta solo como palabra completa: `Lisa` no tumba `LISAIKURU` y
 * `リサ` no tumba `リサイクル`, pero `ルナちゃん` sí cae por `ルナ`.
 */
function namePatterns(names: PersonalNames): RegExp[] {
  const latin = names.latin.map(
    (name) => new RegExp(`(?<!\\p{L})${escapeRegExp(name)}(?!\\p{L})`, 'iu'),
  );
  const katakana = names.katakana.map(
    (name) =>
      new RegExp(
        `(?<![\\p{Script=Katakana}ー・])${escapeRegExp(name)}(?![\\p{Script=Katakana}ー・])`,
        'u',
      ),
  );

  const literal = (names.literal ?? []).map((term) => new RegExp(escapeRegExp(term), 'iu'));

  return [...latin, ...katakana, ...literal];
}

/**
 * Quita del texto los datos personales: enlaces de videollamada, correos,
 * listas de nombres con etiqueta, menciones a profesores, compañeros con
 * `くん`/`ちゃん`, quien dice su nombre o apellido (`みょうじ は 〈nombre〉 です`)
 * o dónde vive (`わたしは 〈lugar〉に すんでいます`, `Yo vivo en 〈lugar〉`) y
 * cualquier línea que nombre a alguien de `names`.
 *
 * Trabaja por líneas y descarta la línea completa. Se pierde alguna frase de
 * ejemplo que menciona a un compañero, a cambio de no dejar pasar su nombre.
 *
 * Un nombre que no aparece en la asistencia, en la lista ni en los términos
 * configurados no se detecta: para esos casos el prompt de extracción es la
 * segunda barrera.
 */
export function stripPersonalData(text: string, names: PersonalNames = NO_PERSONAL_NAMES): string {
  const patterns = namePatterns(names);

  return text
    .split('\n')
    .filter(
      (line) =>
        !VIDEO_CALL_LINK.test(line) &&
        !VIDEO_CALL_LABEL.test(line) &&
        !EMAIL.test(line) &&
        !PERSONAL_LABEL.test(line) &&
        !TEACHER.test(line) &&
        !CLASSMATE.test(line) &&
        !declaresName(line) &&
        !declaresResidence(line) &&
        !patterns.some((pattern) => pattern.test(line)),
    )
    .join('\n');
}
