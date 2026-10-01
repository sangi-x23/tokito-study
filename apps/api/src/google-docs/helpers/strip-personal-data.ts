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

// Una entrada de la lista de nombres: `フアン・パブロ：Juan Pablo`.
const ROSTER_ENTRY = /^\s*([\p{Script=Katakana}ー・]+)\s*[:：]\s*([\p{Script=Latin} ]+?)\s*$/u;

// Alguien tratado de profesor: `メリッサせんせい`, `むらかわ先生`. El `〜せんせい`
// del vocabulario no cuenta, porque delante lleva `〜` y no un nombre.
const TEACHER = /[\p{Script=Hiragana}\p{Script=Katakana}ー]{2,}(?:せんせい|先生)/u;
const TEACHER_KATAKANA_NAME = /([\p{Script=Katakana}ー]{2,})(?:せんせい|先生)/gu;

// Un compañero tratado con confianza: `サムエルくん`, `アンジーちゃん`. Atrapa a
// quien no salió en la lista en katakana. `さん` queda fuera a propósito: es
// el que usan los personajes del libro (`アランさん`), que sí son material.
const CLASSMATE = /[\p{Script=Katakana}ー]{2,}(?:くん|ちゃん)/u;

const LATIN_NAME = /^\p{Script=Latin}{3,}$/u;

/** Nombres de personas reales sacados del propio documento. */
export interface PersonalNames {
  readonly latin: readonly string[];
  readonly katakana: readonly string[];
}

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

  return { latin: [...latin], katakana: [...katakana] };
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Un nombre cuenta solo como palabra completa: `Sara` no tumba `SARADA` y
 * `サラ` no tumba `サラダ`, pero `アンジーちゃん` sí cae por `アンジー`.
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

  return [...latin, ...katakana];
}

/**
 * Quita del texto los datos personales: enlaces de videollamada, correos,
 * listas de nombres con etiqueta, menciones a profesores, compañeros con
 * `くん`/`ちゃん` y cualquier línea que
 * nombre a alguien de `names`.
 *
 * Trabaja por líneas y descarta la línea completa. Se pierde alguna frase de
 * ejemplo que menciona a un compañero, a cambio de no dejar pasar su nombre.
 *
 * Un nombre que no aparece en la asistencia ni en la lista no se detecta: para
 * esos casos el prompt de extracción es la segunda barrera.
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
        !patterns.some((pattern) => pattern.test(line)),
    )
    .join('\n');
}
