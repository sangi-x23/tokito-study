import type { ReactNode } from 'react';

/**
 * Una lectura kun con la notación de KANJIDIC2: lo que va después del punto
 * es okurigana (`まな.ぶ` → 学ぶ) y se pinta más tenue; el guion de un prefijo
 * o sufijo (`-び`) se deja.
 */
function KunReading({ reading }: { reading: string }): ReactNode {
  const [stem, okurigana] = reading.split('.');
  return (
    <>
      {stem}
      {okurigana && <span className="text-slate-400 dark:text-slate-500">{okurigana}</span>}
    </>
  );
}

function ReadingList({
  label,
  readings,
  kun = false,
}: {
  label: string;
  readings: readonly string[];
  kun?: boolean;
}): ReactNode {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd lang="ja" className="text-lg">
        {readings.length === 0
          ? '—'
          : readings.map((reading, index) => (
              <span key={reading}>
                {index > 0 && '・'}
                {kun ? <KunReading reading={reading} /> : reading}
              </span>
            ))}
      </dd>
    </div>
  );
}

/** Las lecturas on y kun de un kanji, con el okurigana de las kun marcado. */
export function KanjiReadings({
  onyomi,
  kunyomi,
}: {
  onyomi: readonly string[];
  kunyomi: readonly string[];
}): ReactNode {
  return (
    <div className="flex flex-col gap-2">
      <dl className="grid gap-2 sm:grid-cols-2">
        <ReadingList label="On'yomi" readings={onyomi} />
        <ReadingList label="Kun'yomi" readings={kunyomi} kun />
      </dl>
      {kunyomi.some((reading) => reading.includes('.')) && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          En gris, el okurigana: la parte que se escribe en hiragana después del kanji.
        </p>
      )}
    </div>
  );
}
