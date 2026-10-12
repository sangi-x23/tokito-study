import { z } from 'zod';

// Release fijado para que el seed sea reproducible. Cambiarlo cambia los
// trazos de la base en la siguiente corrida.
export const KANJIVG_TAG = 'r20260714';

/** URL del SVG de un carácter: KanjiVG nombra cada archivo por su code point. */
export function kanjiVgUrl(character: string, tag: string = KANJIVG_TAG): string {
  const codePoint = character.codePointAt(0)!.toString(16).padStart(5, '0');
  return `https://raw.githubusercontent.com/KanjiVG/kanjivg/${tag}/kanji/${codePoint}.svg`;
}

// <path id="kvg:03042-s1" d="M31.01,33c0.88…"/>; los atributos pueden venir en
// cualquier orden.
const PATH_TAG = /<path\b[^>]*>/gu;
const STROKE_ID = /\bid="kvg:[0-9a-f]+-s(\d+)"/u;
const PATH_DATA = /\bd="([^"]+)"/u;

// Solo comandos y números de un path: nada que pueda inyectar marcado al
// pintarlo en la web.
const strokesSchema = z.array(z.string().regex(/^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/u)).min(1);

/** Extrae los trazos de un SVG de KanjiVG, ordenados por su número. */
export function parseStrokes(svg: string): string[] {
  const strokes = [...svg.matchAll(PATH_TAG)].flatMap(([tag]) => {
    const number = STROKE_ID.exec(tag)?.[1];
    const data = PATH_DATA.exec(tag)?.[1];
    return number && data ? [{ number: Number(number), data }] : [];
  });

  strokes.sort((a, b) => a.number - b.number);
  strokes.forEach((stroke, index) => {
    if (stroke.number !== index + 1) {
      throw new Error(`Falta el trazo ${index + 1} en el SVG de KanjiVG`);
    }
  });

  return strokesSchema.parse(strokes.map((stroke) => stroke.data));
}
