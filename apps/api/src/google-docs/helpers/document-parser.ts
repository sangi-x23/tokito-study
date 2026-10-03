import type { docs_v1 } from 'googleapis';
import type { DocumentPart, ParsedDocument, ParsedSection } from '../types/document-part';
import {
  collectPersonalNames,
  stripPersonalData,
  withPersonalTerms,
  type PersonalNames,
} from './strip-personal-data';

type InlineObjects = Record<string, docs_v1.Schema$InlineObject>;

/**
 * Acumula texto e imágenes conservando el orden en que aparecen.
 *
 * El texto se va juntando en un buffer y se vuelca como una parte cuando
 * aparece una imagen, de modo que las partes de texto quedan partidas justo por
 * donde iban las imágenes.
 */
class PartsBuilder {
  private readonly parts: DocumentPart[] = [];
  private buffer = '';
  private inline = false;

  /** Dentro de una celda de tabla los saltos de línea romperían las columnas. */
  setInline(value: boolean): void {
    this.inline = value;
  }

  text(value: string): void {
    // Dentro de una celda los saltos y las tandas de espacios se colapsan:
    // si no, romperían el alineado de las columnas.
    this.buffer += this.inline ? value.replace(/\s+/g, ' ') : value;
  }

  /** Quita el espacio sobrante al cerrar una celda, antes del separador. */
  trimTrailingSpaces(): void {
    this.buffer = this.buffer.replace(/[ \t]+$/, '');
  }

  image(objectId: string, contentUri: string): void {
    this.flush();
    this.parts.push({ kind: 'image', objectId, contentUri });
  }

  build(): DocumentPart[] {
    this.flush();
    return this.parts;
  }

  // El texto se guarda crudo: el descarte de datos personales necesita haber
  // visto el documento entero, así que se aplica después en `cleanParts`.
  private flush(): void {
    if (this.buffer.trim().length > 0) {
      this.parts.push({ kind: 'text', text: this.buffer });
    }

    this.buffer = '';
  }
}

type TextPart = Extract<DocumentPart, { kind: 'text' }>;

const isText = (part: DocumentPart): part is TextPart => part.kind === 'text';

function cleanParts(parts: readonly DocumentPart[], names: PersonalNames): DocumentPart[] {
  return parts.flatMap((part): DocumentPart[] => {
    if (!isText(part)) {
      return [part];
    }

    const text = stripPersonalData(part.text, names)
      // Quitar líneas deja huecos; más de un renglón en blanco no aporta nada.
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();

    return text.length > 0 ? [{ kind: 'text', text }] : [];
  });
}

function walkParagraph(
  paragraph: docs_v1.Schema$Paragraph,
  inlineObjects: InlineObjects,
  builder: PartsBuilder,
): void {
  for (const element of paragraph.elements ?? []) {
    const content = element.textRun?.content;
    if (content) {
      builder.text(content);
      continue;
    }

    const objectId = element.inlineObjectElement?.inlineObjectId;
    if (!objectId) {
      continue;
    }

    // La contentUri es temporal: sirve para descargar la imagen durante la
    // corrida, no para guardarla.
    const contentUri =
      inlineObjects[objectId]?.inlineObjectProperties?.embeddedObject?.imageProperties
        ?.contentUri;

    if (contentUri) {
      builder.image(objectId, contentUri);
    }
  }
}

function walkTable(
  table: docs_v1.Schema$Table,
  inlineObjects: InlineObjects,
  builder: PartsBuilder,
): void {
  for (const row of table.tableRows ?? []) {
    const cells = row.tableCells ?? [];

    cells.forEach((cell, index) => {
      if (index > 0) {
        builder.text(' | ');
      }

      builder.setInline(true);
      walkContent(cell.content ?? [], inlineObjects, builder);
      builder.trimTrailingSpaces();
      builder.setInline(false);
    });

    builder.text('\n');
  }
}

function walkContent(
  content: docs_v1.Schema$StructuralElement[],
  inlineObjects: InlineObjects,
  builder: PartsBuilder,
): void {
  for (const element of content) {
    if (element.paragraph) {
      walkParagraph(element.paragraph, inlineObjects, builder);
    } else if (element.table) {
      walkTable(element.table, inlineObjects, builder);
    }
    // sectionBreak y tableOfContents no aportan material de estudio.
  }
}

/**
 * Aplana el árbol de pestañas en profundidad, respetando el orden del
 * documento. Una pestaña anidada es una clase igual que una de primer nivel.
 */
function flattenTabs(tabs: docs_v1.Schema$Tab[]): docs_v1.Schema$Tab[] {
  const flat: docs_v1.Schema$Tab[] = [];

  const visit = (list: docs_v1.Schema$Tab[]): void => {
    const ordered = [...list].sort(
      (a, b) => (a.tabProperties?.index ?? 0) - (b.tabProperties?.index ?? 0),
    );

    for (const tab of ordered) {
      flat.push(tab);

      if (tab.childTabs && tab.childTabs.length > 0) {
        visit(tab.childTabs);
      }
    }
  };

  visit(tabs);
  return flat;
}

export interface ParseOptions {
  /** Pestañas que no son clases (temario, notas…) y no se devuelven. */
  readonly skipTabIds?: readonly string[];
  /** Términos a descartar que ninguna regla detecta (ver `withPersonalTerms`). */
  readonly personalTerms?: readonly string[];
}

/**
 * Convierte la respuesta de `documents.get` en secciones listas para procesar.
 *
 * Va en dos pasadas: primero lee todas las pestañas, incluidas las que se
 * saltan, para juntar los nombres de compañeros y profesores; después descarta
 * de cada sección las líneas con datos personales. Una pestaña saltada sirve
 * así de fuente de nombres (la lista de la clase) sin llegar nunca a la salida.
 *
 * Función pura: no toca la red ni la base, así que se puede probar con datos
 * de mentira.
 */
export function parseDocument(
  document: docs_v1.Schema$Document,
  options: ParseOptions = {},
): ParsedDocument {
  const skip = new Set(options.skipTabIds ?? []);

  const tabs = flattenTabs(document.tabs ?? []).flatMap((tab, position) => {
    const tabId = tab.tabProperties?.tabId;
    const documentTab = tab.documentTab;

    // Sin tabId no hay clave natural estable con la que hacer upsert.
    if (!tabId || !documentTab) {
      return [];
    }

    const builder = new PartsBuilder();
    walkContent(documentTab.body?.content ?? [], documentTab.inlineObjects ?? {}, builder);

    return [{ tabId, title: tab.tabProperties?.title?.trim() ?? '', position, parts: builder.build() }];
  });

  const names = withPersonalTerms(
    collectPersonalNames(tabs.flatMap((tab) => tab.parts.filter(isText).map((part) => part.text)).join('\n')),
    options.personalTerms ?? [],
  );

  const sections = tabs
    .filter((tab) => !skip.has(tab.tabId))
    .map((tab): ParsedSection => {
      const parts = cleanParts(tab.parts, names);

      return {
        tabId: tab.tabId,
        title: tab.title,
        position: tab.position,
        parts,
        rawText: parts
          .filter(isText)
          .map((part) => part.text)
          .join('\n\n'),
      };
    });

  return {
    documentId: document.documentId ?? '',
    title: document.title ?? '',
    revisionId: document.revisionId ?? null,
    sections,
  };
}
