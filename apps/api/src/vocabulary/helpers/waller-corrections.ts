// Filas de las listas que apuntan a un homónimo equivocado de JMdict (コップ a
// «cop» en vez de «vaso») o que traen una grafía rara. Se encontraron
// comparando la definición inglesa de Waller con las glosas de la entrada.
// La clave es `grafía|lectura` tal como viene en la lista. Al corregir una
// fila cambian sus acepciones, así que su traducción queda vieja y
// `vocab:translate requests` la vuelve a pedir.
export const WALLER_CORRECTIONS: Readonly<Record<string, { readonly seq?: number; readonly kanji?: string }>> = {
  'あれ|あれ': { seq: 1000580 }, // no la interjección «¿eh?»
  'コップ|コップ': { seq: 1050390 }, // vaso, no «cop»
  'これ|これ': { seq: 1628530 }, // «esto», no la interjección
  'それ|それ': { seq: 1006970 }, // «eso», no la interjección
  'だんだん|だんだん': { seq: 1597350 }, // «poco a poco», no el «gracias» de Izumo
  'ボタン|ボタン': { seq: 1123880 }, // botón, no 牡丹
  'こと|こと': { seq: 1313580 }, // «cosa», no la partícula final
  // Padres, no la interjección. Es 親, que ya está en un nivel más fácil:
  // con su grafía la fila se funde con esa.
  'おや|おや': { seq: 1365040, kanji: '親' },
  'しばしば|しばしば': { seq: 1005580 }, // «a menudo», no «parpadear»
  'やや|やや': { seq: 1570120 }, // «un poco», no la interjección
  'ソース|ソース': { seq: 2843727 }, // fuente (de información), no salsa
  'ポーズ|ポーズ': { seq: 2858735 }, // pausa, no pose
  '悪い|にくい': { kanji: '憎い' }, // la grafía usual de にくい
};
