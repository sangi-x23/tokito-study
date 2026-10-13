# Tokito — contexto para Claude Code

Web app gratuita para estudiar japonés a partir de los diarios de clase del curso, que viven en un Google Doc con una pestaña por clase. La API lee el documento, extrae el material (texto e imágenes) con un LLM y lo organiza en una **taxonomía de temas** (no por clase). La web lo muestra como material de estudio. Usuarios: el autor y sus compañeros de curso.

## Reglas no negociables

- **Costo $0.** Solo Vercel Hobby, Neon Free, Google Docs API y Gemini API en su nivel gratuito. No agregar servicios ni dependencias que requieran pago o tarjeta.
- **Sin login y sin persistencia en el cliente.** Prohibido localStorage, sessionStorage, IndexedDB o cookies para guardar estado. El progreso de estudio vive solo en memoria mientras la pestaña está abierta.
- **Sin datos personales.** Del documento solo se guarda contenido de estudio: nada de nombres de compañeros o profesores, enlaces de Meet, correos, asistencia, profesiones, negocios ni dónde vive alguien. Esto también vale para lo que escribimos nosotros: los ejemplos en código, tests, este archivo, commits y PRs usan **nombres ficticios** (ケンジ, たなか, Pedro, ゴメス), nunca los del documento, aunque sean el caso real que motivó una regla.
- **API pública de solo lectura.** El único endpoint que escribe (`GET /ingestion/run`) está protegido con `CRON_SECRET` (`Authorization: Bearer <CRON_SECRET>`).
- **El ID del Google Doc va en variable de entorno** (`GOOGLE_DOC_ID`), nunca en el código ni en el repo.

## Cómo trabajar

- **Proponer el plan antes de implementar** y avisar antes de cualquier refactor grande o dependencia nueva. Cambios pequeños y revisables.
- **Ramas:** `main` ← `test` ← rama de trabajo (`feat/…`, `fix/…`, `refactor/…`). Se crea la rama desde `test` y se abre el PR **contra `test`**. Nunca commitear directo a `main`.
- **Descripción de los PR:** solo qué incluye el cambio, más una tabla de verificación. El porqué de las decisiones va en este archivo y en los commits.
- **Commits** en español con prefijo convencional y ámbito: `feat(web): …`, `fix(ingestion): …`, `refactor(api): …`.
- **Mantener este archivo al día:** cuando se tome una decisión que no se deduce del código, agregarla en la sección del área que toca.
- **Verificar antes de dar algo por hecho:** `pnpm typecheck`, `pnpm --filter @tokito/api test` y, si se tocó la web, probar las rutas contra la API local (previa consulta, ver abajo).
- **Siempre consultar antes de:**
  - **Iniciar la app** (`pnpm dev`, `next dev`, `next start`, la API con `node dist/main.js` o cualquier servidor local).
  - **Usar la extensión de Chrome** (navegar, tomar capturas o interactuar con páginas).
  - **Crear un PR.** Subir la rama no basta como permiso: se pregunta antes de `gh pr create`.
- **Las versiones del stack son más nuevas que lo que sabe un modelo** (Next 16, NestJS 12, Prisma 7, TypeScript 6, Tailwind 4): sus APIs, convenciones y estructura pueden haber cambiado. Antes de escribir código con ellas, leer la documentación de la versión instalada en vez de fiarse de la memoria, y hacer caso a los avisos de deprecación.
  - **Web:** Next trae su documentación en `apps/web/node_modules/next/dist/docs/` (desde la raíz del monorepo, `next` no se ve).
  - **API:** NestJS y Prisma no la incluyen; los tipos (`.d.ts`) del paquete instalado y su documentación oficial mandan.
  - **`next dev` crea `apps/web/AGENTS.md` y `apps/web/CLAUDE.md`** cuando lo lanza un agente de IA y no los encuentra. Su único aviso es el de arriba, así que no van al repo: están en `.gitignore`.

## Estado actual

- **Desplegado en Vercel.** La API vive en `https://tokito-study.vercel.app` y la web es un segundo proyecto que la consume por `API_URL`.
- **Contenido:** importado el 2026-10-03 con un bootstrap revisado a mano. Hoy hay 15 temas raíz, unos 42 subtemas y alrededor de 470 ítems. Las clases nuevas entran por la ingesta incremental.
- **Web:** dos secciones. «Diario de clase» navega por temas; «Escritura» tiene las tablas de hiragana y katakana y los 2136 kanji jōyō por grado. La interfaz es mínima a propósito y se irá mejorando.
- **Lo próximo:** las features de estudio (ver [Features futuras](#features-futuras)).

## Comandos

```bash
pnpm dev                                   # shared en watch + API (3001) + web (3000)
pnpm typecheck                             # todo el monorepo
pnpm build                                 # en orden topológico: shared primero
pnpm --filter @tokito/api test             # tests de la API (node:test)
pnpm --filter @tokito/api db:migrate       # nueva migración (usa DIRECT_URL)
pnpm --filter @tokito/api ingest:run       # ingesta incremental en local; --check solo lista los cambios
pnpm --filter @tokito/api ingest:bootstrap <extract|taxonomy|import>   # lectura inicial (ya hecha)
pnpm --filter @tokito/api docs:print       # imprime las secciones parseadas del documento
pnpm --filter @tokito/api llm:try          # prueba la extracción contra una pestaña real
pnpm --filter @tokito/api kana:seed        # carga los kana con sus trazos de KanjiVG; --dry-run solo compara
pnpm --filter @tokito/api kanji:seed       # carga los kanji jōyō de KANJIDIC2 y KanjiVG; --dry-run solo compara
```

Los scripts de la API corren desde `dist/`, así que necesitan un `build` previo.

## Stack

- Monorepo con **pnpm workspaces**: `apps/api`, `apps/web` y `packages/shared`.
- **API:** NestJS (TypeScript estricto), modular. Pensada para Vercel como función (zero-config NestJS, Fluid compute).
- **Base de datos:** PostgreSQL en **Neon**, con **Prisma 7** y el adaptador `@prisma/adapter-neon`.
- **Web:** Next.js (App Router) + Tailwind 4.
- **LLM:** Gemini (`@google/genai`), modelo Flash del nivel gratuito, configurable por `GEMINI_MODEL`.
- **Fuente:** Google Docs API (`googleapis`), scope `documents.readonly`, con una **cuenta de servicio**.
- **Validación:** `zod` para toda respuesta del LLM y todo input externo.
- **Tests:** runner nativo de Node (`node:test`), sin dependencias. Las funciones puras se prueban con datos de mentira y sin red.

### Versiones fijadas (no actualizar sin revisar)

- **TypeScript `~6.0.3`, no la 7.** `@nestjs/cli@12` depende de `typescript ~6.0.2`.
- **`module: node20`** en `api` y `shared`: TypeScript 6 deprecó `moduleResolution: node10`. Con `node20`, el formato de salida lo decide el `"type"` del `package.json`.
- **La API es ESM (`"type": "module"`)** porque NestJS 12 solo se publica como ESM. En CommonJS funcionaba en local (Node 24 permite `require()` de ESM), pero en Vercel la función moría al arrancar con `ERR_REQUIRE_ESM`: su cargador no lo soporta. Consecuencias:
  - Los imports relativos llevan `.js` (`'./helpers/images.js'`, `'../llm/index.js'`). Sin la extensión, `tsc` no compila.
  - En vez de `__dirname`, se usa `import.meta.dirname`.
  - Para probar en local lo que pasaría en Vercel: `node --no-experimental-require-module dist/main.js`.
- **Prisma `~7.10.0`.** El tag `latest` de `prisma` apuntaba a un release candidate de la 8.
- **`@google/genai` en 2.24.0**, por el `minimumReleaseAge` de pnpm.
- **`animejs` en la 4.** La 5 está en beta.
- **`allowBuilds` en `pnpm-workspace.yaml` decide cada script de instalación.** pnpm 11 rompe el `pnpm install` en CI (Vercel) si una dependencia con scripts queda sin decidir. Todas van en `false`, incluido Prisma: sus scripts solo descargan el motor de migraciones, que no usan ni `prisma generate` ni la API, y en Windows el preinstall de `prisma` revienta dentro de pnpm. El `prisma generate` lo corren el `postinstall` y el `build` de la API.
- **`@tokito/shared` compila a `dist/`** (CommonJS + `.d.ts`) para que la API y Next lo consuman igual. La API solo importa sus tipos.

## Estructura

```
apps/
  api/                NestJS + Prisma
    prisma/           schema.prisma, migrations
    prisma.config.ts
    vercel.json       cron diario de la ingesta
    src/
      app.module.ts   registra todo lo que exporta modules.ts, sin nombrar cada módulo
      modules.ts      barril de los módulos de Nest: un módulo nuevo solo se agrega aquí
      config/         validación del entorno (env.ts) y carga del .env
      health/         GET /health
      prisma/         PrismaService (adaptador Neon)
      google-docs/    lectura del documento, parseo a secciones y descarte de datos personales
      llm/            interfaz LlmProvider + implementación Gemini (schemas, prompts, reintentos)
      ingestion/      ingesta incremental (endpoint cron) y bootstrap local
      content/        API pública de lectura de temas e ítems
      writing/        API pública de los kana (sección Escritura)
      kanji/          API pública del catálogo de kanji jōyō (sección Escritura)
      scripts/        scripts sueltos compilados con el resto
  web/                Next.js (vercel.json compila shared antes del build)
    app/              solo rutas
    sections/         una carpeta por sección del sidebar
    modules/          datos y componentes que comparten las secciones
    components/       layout (sidebar, PageContainer), breadcrumb e íconos
    lib/              cliente HTTP de la API y rutas de la app
packages/
  shared/             contratos compartidos (@tokito/shared)
```

**Un módulo por recurso, con un solo controller y un solo service.** Si algo nuevo tiene su propio recurso (como los kanji junto a los kana), va en un módulo nuevo, aunque lo muestre la misma sección de la web. Cada módulo de la API sigue la misma forma: `config/`, `types/`, `schemas/`, `helpers/` (funciones puras), `providers/` y `tests/` con los `*.spec.ts`, según lo que necesite.

**Las interfaces y tipos exportados van en `types/<tema>.ts`,** no en servicios, helpers ni providers. Hay dos excepciones:
- Un tipo privado de un archivo (sin `export`) se queda junto a la función que lo usa.
- Un tipo derivado de un valor en una línea (`z.infer<typeof schema>` en `config/`, `Prisma.*GetPayload<typeof include>` en `content/helpers/to-dto.ts`) se queda al lado de su esquema.

Vercel: dos proyectos desde este repo, con Root Directory `apps/api` y `apps/web`.

- **`apps/web/vercel.json` compila `@tokito/shared` antes de `next build`.** La web solo importa tipos del paquete, pero el chequeo de tipos de Next necesita su `dist/`, que no está en el repo. Sin ese paso el build en Vercel falla con `Cannot find module '@tokito/shared'`.
- **Las previews de la web usan la API de producción** (la de `main`). Un endpoint nuevo tiene que llegar a `main` antes de probar en una preview la web que lo usa: si no, la API responde 404 y la página también (`get()` lo toma como «no encontrado»). Por eso, cuando una feature toca API y web, primero se hace el release de la API.

## Modelo de datos (ver `apps/api/prisma/schema.prisma`)

- `SourceDocument`: el Google Doc, con la última revisión vista.
- `Section`: una pestaña del documento = una clase. Clave natural `[documentId, tabId]` (el `tabId` es estable aunque se renombre la pestaña). Guarda `rawText` (ya sin datos personales), `contentHash` para detectar cambios y `classDate`, que sale del título (`7/10 …`).
- `Topic`: taxonomía de **dos niveles** (tema → subtema) mediante `parentId`, con `slug` único y `category`. **La navegación de la app es por temas, no por clases.**
- `StudyItem`: el átomo del sistema (`WORD`, `KANJI`, `GRAMMAR_POINT` o `PHRASE`). Existe **una sola vez** aunque aparezca en varias clases: clave `[type, japanese]`.
- `ItemTopic`: N:N entre ítem y tema. `isPrimary` marca el tema canónico (breadcrumbs) y `position` ordena dentro del tema. Un kanji vive en su tema temático y además en uno de categoría `KANJI`.
- `KanjiDetail`: 1:1 con un ítem `KANJI`. `onyomi` y `kunyomi` son **las lecturas que enseñó el curso**, no las del diccionario. `strokeCount` y `jlptLevel` son opcionales: mejor `null` que un dato inventado por el LLM.
- `ItemOccurrence`: en qué clases apareció cada ítem.
- `ImageAsset`: caché del texto extraído de cada imagen, por hash SHA-256 del contenido. Las imágenes **no se almacenan**.
- `Kana`: hiragana y katakana para la sección Escritura (básicos, dakuten, handakuten, pequeños, combinaciones y katakana extendida). No sale del documento: es un conjunto cerrado que se carga con un seed y que la ingesta no toca. Va aparte de `StudyItem` para no chocar con partículas como `は` o `を` ni aparecer en el árbol de temas. `row`/`column` ubican cada kana en la cuadrícula de su `script` y `kind`. `strokes` guarda los trazos en orden, como `d` de un `<path>` sobre un lienzo de 109×109, sacados de **KanjiVG (CC BY-SA 3.0, hay que citarlo en la web)**. Los kana de varios caracteres no tienen trazos propios: se dibujan con los de cada carácter (`きゃ` = `き` + `ゃ`). La tabla vive en `writing/helpers/kana-table.ts`; `kana:seed` descarga los SVG de un release fijado de KanjiVG (`KANJIVG_TAG`), crea lo que falta y actualiza lo que cambió, sin borrar ni recrear filas. Rōmaji Hepburn, salvo `を` = `wo`, y los pequeños llevan el de su versión grande.
- `Kanji`: los 2136 kanji jōyō para la sección Escritura. Como `Kana`, es un conjunto cerrado que carga un seed y que la ingesta no toca, y **no se relaciona con `StudyItem`**: el catálogo no sabe nada del Diario. Si el Diario necesita algo del catálogo, lo busca por el carácter (hoy, `inKanjiCatalog` en `GET /items/:id`). Guarda `grade` (1–6 primaria, 8 secundaria, como KANJIDIC2), `frequency` (puesto entre los 2500 más usados en prensa; null en unos 100 de secundaria), `meanings` en español, `onyomi`/`kunyomi` **de diccionario** (las del curso siguen en `KanjiDetail`) y `strokes` de KanjiVG.
  - **Datos de KANJIDIC2 (EDRDG, CC BY-SA 4.0, hay que citarlo en la web).** No tiene versiones fijas: el seed baja la última y actualiza lo que cambió. Las lecturas kun conservan su notación: el punto separa el okurigana (`まな.ぶ`) y el guion marca prefijo o sufijo (`-び`).
  - **73 jōyō de secundaria no traen español en KANJIDIC2** (casi todos de la revisión de 2010). Están traducidos a mano en `kanji/helpers/kanji-meanings-es.ts`. El seed falla si a un kanji le falta significado o trazos, y avisa de las traducciones que sobran porque KANJIDIC2 ya las tiene.
  - **El número de trazos es `strokes.length`, no el de KANJIDIC2:** en 9 kanji (餌, 謎…) difieren en uno porque KanjiVG dibuja la forma jōyō. Se cuenta lo que se dibuja.
  - **`kanji:seed` baja dos archivos** (`kanjidic2.xml.gz` y el `kanjivg-<fecha>.xml.gz` del mismo `KANJIVG_TAG` que los kana), no un SVG por kanji.
- `IngestionRun`: registro de cada corrida. Una en `RUNNING` es el candado, garantizado por un **índice único parcial** (`IngestionRun_one_running`) escrito a mano en la migración inicial, porque Prisma no sabe expresarlo. `prisma migrate dev` no intenta borrarlo.

### Invariantes

- **IDs estables:** la ingesta hace upsert por clave natural. Ítems y temas **nunca se borran ni se recrean**. Lo único que se borra son enlaces `ItemTopic` obsoletos y las `ItemOccurrence` de una pestaña que se reprocesa.
- **Todo ítem tiene al menos un tema** y **`KanjiDetail` solo cuelga de ítems `KANJI`.** El schema no lo exige: lo garantiza la ingesta. Lo contrario es un bug.
- **Qué palabras usan un kanji no se guarda:** se deriva con `japanese LIKE '%<kanji>%'` sobre los ítems `WORD`.
- **Las features nuevas agregan tablas o módulos propios que leen `StudyItem`;** no modifican las tablas de contenido.

### Convenciones del campo `japanese`

Para que un ítem se fusione entre clases, `japanese` va sin espacios internos ni `。`/`？` al final y con paréntesis de ancho completo (`normalizeJapanese` en `ingestion/helpers/item-key.ts`). Además, por prompt: los huecos de un `GRAMMAR_POINT` van con `〜`; las preguntas completas son `PHRASE`; `はい`/`いいえ` son `WORD`; meses y días en kanji con su lectura (`九月`, `4日`).

## Ingesta

### Flujo

1. **Lectura:** `documents.get` con `includeTabsContent: true` (sin él solo llega la primera pestaña). Cada pestaña se convierte en una secuencia ordenada de texto e imágenes. Las tablas se aplanan a filas con `|` entre columnas. `GOOGLE_DOC_SKIP_TABS` excluye pestañas que no son clases (hoy `t.0`: temario, lista de la clase y notas).
2. **Descarte de datos personales** (`google-docs/helpers/`), antes de guardar o enviar nada al LLM. Ver abajo.
3. **Huella:** `contentHash` = SHA-256 del texto y de los hashes de las imágenes, en orden. Se hashea el contenido descargado, no la `contentUri`, que cambia en cada lectura. Solo se procesan las pestañas nuevas o con huella distinta.
4. **Imágenes:** si su hash ya está en `ImageAsset`, se usa el texto guardado. Si es nueva, se reduce con `sharp` a 1024 px (JPEG 85) y se manda marcada con `[imagen <hash>]`.
5. **Extracción:** **una llamada al LLM por pestaña**, con texto e imágenes intercalados.
6. **Asignación:** solo los ítems **nuevos** pasan por `assignToTopics` con el catálogo actual. Los que ya existen solo ganan la aparición: su significado, lecturas y temas no se tocan, porque el contenido inicial se corrigió a mano.
7. **Escritura:** una transacción por pestaña, por lotes (`writePlan`), nunca fila por fila: Neon tarda unos 70 ms por consulta.

### Descarte de datos personales

Trabaja por líneas y quita la línea completa. Está calibrado contra el documento real:

- Enlaces, correos, etiqueta de videollamada y asistencia (`出席者：`/`欠席者：`, con `：` de ancho completo).
- Profesores (`〈kana〉せんせい`) y compañeros con `くん`/`ちゃん`. `さん` se permite a propósito: lo usan los personajes del libro (`アランさん`).
- Nombres sacados del propio documento en una primera pasada (asistencia, `カタカナ：Nombre`, lo que va antes de `せんせい`, el lado latino de `山田ケンジ ／ Yamada Kenji`), buscados como palabra completa. Solo viven en memoria.
- Quien dice su nombre (`みょうじ は ゴメス です`) o dónde vive en primera persona (`わたしは 〈lugar〉に すんでいます`), salvo que el hueco sea de plantilla (`〇〇`, `〜`, `（ Lugar ）`). La tercera persona se permite porque es del libro.
- Lo que ninguna regla puede saber (diminutivos, negocios) va en `GOOGLE_DOC_PERSONAL_TERMS`, que vive en el entorno porque son datos personales.

La segunda barrera es el prompt de extracción: prohíbe nombres, edades, profesiones y lugares de personas reales, y generaliza las autopresentaciones a plantilla (`わたしは〈profesión〉です`). Si aparece un dato personal nuevo, se refuerza la regla y se reprocesa solo la pestaña afectada.

### LLM (`llm/`)

- `LlmProvider` es la interfaz; quien la consume inyecta `LLM_PROVIDER`, no `GeminiProvider`. Métodos: `extractStudyItems`, `buildTaxonomy` y `assignToTopics`.
- **zod es la única fuente de verdad del formato:** `z.toJSONSchema()` genera el `responseJsonSchema` y la respuesta se valida con el mismo esquema, más las reglas `check*` que no caben en la estructura. Si la validación falla, la corrida se marca `FAILED` y no se escribe nada.
- **Los reintentos son nuestros, no del SDK.** Un 429 por cuota por minuto se reintenta respetando el `RetryInfo`. Un 429 por cuota diaria (`quotaId` con `PerDay`) lanza `LlmQuotaExhaustedError` de inmediato. Los 5xx, los fallos de red y los timeouts (120 s) se reintentan con backoff exponencial y jitter.
- **Throttle en memoria** (`GEMINI_MIN_INTERVAL_MS`, 7 s por defecto). Basta porque el candado impide corridas en paralelo.
- **El proveedor es perezoso:** la clave se valida en la primera llamada, así que la API pública arranca sin credenciales de Gemini ni de Google.
- **La cuota diaria gratuita es pequeña** (unas 20 llamadas) y **cada reintento la gasta, aunque responda 503.** Si el modelo está saturado, conviene parar y retomar otro día en vez de subir `GEMINI_MAX_RETRIES`.
- **La taxonomía que genera el LLM no es determinista** (dos corridas dieron 17 y 34 temas). Por eso el bootstrap tuvo revisión manual.
- **Latencia:** una pestaña sin imágenes tarda unos 30 s y una con 4 imágenes, hasta 115 s.

### Ingesta incremental

- `GET /ingestion/run`, porque Vercel Cron solo hace GET. Cron diario a las 00:00 de Colombia (`0 5 * * *` UTC) en `apps/api/vercel.json`. Es diario y no semanal porque la ingesta decide por la huella: un día sin cambios no llama a Gemini.
- El guard compara el secreto en tiempo constante. Responde 401 sin secreto, 409 con el candado tomado, 503 con la cuota diaria agotada y 200 con el resumen.
- **Presupuesto de 100 s por corrida:** pasado ese tiempo no empieza otra pestaña; lo pendiente se detecta en la siguiente por su huella.
- **Una corrida en `RUNNING` hace más de 30 minutos se marca `FAILED`** antes de tomar el candado, para que un proceso muerto no bloquee el cron.
- Debe ser **idempotente**: el cron de Hobby es *best effort* y puede duplicarse o perderse.

### Bootstrap (ya hecho)

`ingest:bootstrap` corrió en local en tres fases: `extract` → `taxonomy` → revisión manual de `taxonomy.json` → `import` (con `--dry-run`). Los archivos intermedios viven en `apps/api/.bootstrap/`, fuera del repo. Con `--manual`, `ManualProvider` reemplaza a Gemini con archivos de solicitud y respuesta que se resuelven a mano, validados con los mismos esquemas. Solo hace falta volver a correrlo si se reconstruye la base desde cero.

## API pública (`content/`)

- `GET /topics`: árbol de dos niveles con `itemCount`.
- `GET /topics/:slug`: tema con su padre, sus subtemas y sus **ítems directos** (no mezcla los de sus subtemas).
- `GET /items/:id`: ítem con todos sus temas, sus clases y, si es kanji, las palabras que lo usan.
- Los contratos son interfaces en `@tokito/shared` (`content.ts`), sin zod. zod valida solo los parámetros de la URL: 400 si no tienen forma de slug o cuid, 404 si no existen.
- **No se exponen** `rawText`, `ImageAsset` ni `IngestionRun`. De las clases solo sale el título y la fecha.
- `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` **solo en respuestas exitosas** (`PublicCacheInterceptor`), para que el CDN no recuerde un 404 de un tema que la ingesta crea después.
- Una consulta por endpoint, con `include`/`select` junto a sus mappers en `content/helpers/to-dto.ts`.

### Escritura (`writing/`)

- `GET /kana/:script` (`hiragana` o `katakana`, en minúsculas): la tabla del script agrupada por tipo (básicos → dakuten → handakuten → pequeños → combinaciones → extendidos, sin grupos vacíos), cada grupo ordenado por fila y columna. Los contratos están en `@tokito/shared` (`writing.ts`).
- **Va con los trazos.** Son unos 35 KB por script sin comprimir, y así una sola petición sirve para la cuadrícula, el orden de trazos y la práctica de dibujo. Los kana de varios caracteres no traen trazos: la web los arma con los de cada carácter, que están en la misma tabla.
- Usa el mismo `PublicCacheInterceptor` y `parseParam` de `content/`: 400 si el script no es válido.
### Kanji (`kanji/`)

- **Es un módulo aparte de `writing/`**, aunque los dos alimentan la sección Escritura: cada recurso tiene su propio módulo, con un solo controller y un solo service. Del de kana solo reutiliza los helpers de KanjiVG (`KANJIVG_TAG`, `parseStrokes`); el XML del release lo lee `kanji/helpers/kanjivg-bundle.ts`.
- `GET /kanji/grades/:grade` (`1`–`6` u `8`): los kanji del grado, del más al menos frecuente y, sin frecuencia, por carácter. **Sin trazos**, porque secundaria tiene 1110 kanji: solo el carácter y su primer significado.
- `GET /kanji/:character`: un kanji con lecturas, significados y trazos. 400 si no es un solo carácter Han (`\p{Script=Han}`, que admite `𠮟`, fuera del BMP), 404 si no es jōyō.
- Los contratos están en `@tokito/shared` (`kanji.ts`). Usa el mismo `PublicCacheInterceptor` y `parseParam` de `content/`.

## Web (`apps/web`)

### Tres capas

- **`app/`: solo rutas.** Lee los parámetros, pide los datos, llama a `notFound()`, declara metadata y `dynamic`, y termina en una vista. Sin marcado propio.
- **`sections/<sección>/`:** una carpeta por sección del sidebar, con `section.ts` (nombre, ruta e ícono), `icon.tsx`, `components/` y `views/`. `sections/index.ts` fija el orden del sidebar.
- **`modules/<módulo>/`:** lo que pueden usar varias secciones. Sigue a los módulos de la API (`content` = temas e ítems): `api/` con un archivo de endpoints por recurso, `components/` y etiquetas.
- **Regla para decidir:** si otra sección podría usarlo, va en `modules/`; si es cómo una sección arma su pantalla, va en `sections/`.
- **Agregar una sección:** crear su carpeta en `sections/`, sumarla a `sections/index.ts` y crear sus rutas en `app/`.
- **La barra interna de una sección** (temas del Diario, sistemas de Escritura) es `SectionNav` con un `SectionNavLink` por entrada, en `components/layout/`. El `Breadcrumb` empieza por la sección: cada vista pasa su primer crumb.
- **Escritura:** los silabarios son fijos (`sections/writing/scripts.ts`), así que su barra y su portada no piden nada a la API. `/escritura/[script]` pide `GET /kana/:script` y pinta cada grupo como cuadrícula, con cada kana en su `row`/`column` y los huecos vacíos. Los kana básicos son tarjetas que abren un modal (sin URL propia) con su orden de trazos y los kana que salen de él. El modal cita a KanjiVG (CC BY-SA 3.0), como exige la licencia.
  - **Las relaciones (tenten, maru, combinaciones, extendidos) no se guardan:** `modules/writing/kana-relations.ts` las deriva de los caracteres. Con NFD, `が` es `か` + U+3099 y `ぱ` es `は` + U+309A; una combinación o un extendido cuelga del primer carácter sin su marca (`ぎゃ` → `き`, `ディ` → `テ`). Se calculan en el servidor para mandar al navegador solo los básicos.
  - **`StrokeOrder`** (`modules/writing/components/`) dibuja los trazos con `svg.createDrawable` de Anime.js, uno tras otro, con el número junto al primer punto de cada path y la secuencia paso a paso debajo. Lo reutilizará la práctica de dibujo.

### Reglas

- **Server Components que llaman a la API desde el servidor de Next** (`lib/api-client.ts`, con `API_URL` solo del lado del servidor). El navegador nunca llama a la API: no hace falta CORS.
- **Componentes de cliente solo cuando hacen falta** y con estado en memoria. Hoy: `error.tsx`, `sidebar-link`, `sidebar-frame`, `section-nav-link`, `sliding-highlight`, `modal`, `kanji-dialog` y `kanji-dialog-button` y, en Escritura, `basic-kana-grid`, `kana-dialog`, `kanji-grid` y `stroke-order`.
- **Los modales usan `components/modal.tsx`:** un `<dialog>` nativo con `showModal()`, que ya cierra con Esc y retiene el foco, más el botón de cerrar y el clic fuera del cuadro. Todo cierre pasa por su evento `close`.
- **`dynamic = 'force-dynamic'` en las páginas y `revalidate: 3600` en cada `fetch`:** el build no necesita la API y los datos se cachean una hora.
- **Un 400 de la API cuenta como «no encontrado».**
- **Sin `loading.tsx`:** con él, un tema inexistente respondía 200 en vez de 404.
- **URLs en español** (`/diario/temas/[slug]`, `/diario/items/[id]`, `/escritura/[script]`), armadas siempre con `lib/routes.ts`.
- **El ancho del contenido lo pone cada sección** con `PageContainer`, no el layout raíz. Así una sección puede tener columnas a todo el alto, como la barra de temas del Diario.
- **Kanji en Escritura** (`/escritura/kanji`): la portada lista los grados, que son fijos (`modules/kanji/grades.ts`) y no piden nada a la API. `/escritura/kanji/grado/[grade]` (`1`–`6` o `secundaria`) es la cuadrícula. La ruta estática `kanji` le gana a `[script]`.
  - **La cuadrícula va en bloques de 50, sin índice para saltar entre ellos, y con un buscador** (`sections/writing/kanji-blocks.ts`). Los bloques son por posición dentro del grado y no por frecuencia, porque `GET /kanji/grades/:grade` no la trae: al final de secundaria quedan los que no tienen, ordenados por carácter. El buscador filtra en memoria por carácter (pegar `学校` encuentra `学` y `校`) o por el primer significado, sin distinguir mayúsculas ni tildes, y mientras tiene texto reemplaza los bloques por los resultados.
  - **El detalle de un kanji es solo un modal, sin URL ni página propia**, igual en Escritura (cada celda de la cuadrícula) y en el Diario (`KanjiDialogButton` en un ítem `KANJI` que está en el catálogo). Vive en `modules/kanji/components/`. Hubo una página `/escritura/kanji/[character]` con una ruta interceptada que la abría como modal, y se quitó: a veces abría la página en vez del modal, y desde el Diario siempre la abría.
  - **El modal pide el detalle a un Route Handler de la web** (`app/datos/kanji/[character]/route.ts`, `routes.kanjiData`), porque la cuadrícula no trae trazos (secundaria tiene 1110 kanji) y el navegador nunca llama a la API: el handler se la pide desde el servidor de Next. Es un `GET` y no una Server Action porque solo lee: se cachea en el CDN con el mismo `Cache-Control` que la API, y Next dice que las Server Functions son para mutaciones y se ejecutan de a una.
  - **El kanji va en la URL del handler codificado** (`encodeURIComponent`). El handler lo decodifica con `characterFromParam` (`modules/kanji/`), con `try` y sin asumir si Next ya lo hizo, porque su documentación no lo dice.
  - `SectionNavLink` con `activePrefix` queda activo en todas las páginas que cuelgan de su `href`: así «Kanji» sigue marcado en cada grado.
  - El modal cita KanjiVG y KANJIDIC2 (`kanji-credits.tsx`).
- **Barra de scroll propia** en `app/globals.css`: delgada, slate y sin flechas. Chrome, Edge y Safari usan solo `::-webkit-scrollbar`, porque con `scrollbar-width`/`scrollbar-color` Chrome pinta la barra nativa con flechas que no se pueden quitar; esas propiedades van solo para Firefox, con `@supports not selector(::-webkit-scrollbar)`. En `Modal` el scroll va en un contenedor interno y no en el `<dialog>`, para que la barra no pise las esquinas redondeadas.
- **Sin librería de íconos:** SVG en línea sobre `components/icon.tsx`.
- **Animaciones con Anime.js** (`animejs` 4), en `modules/motion/`. Cada componente crea un `createScope({ root })` en un `useEffect` y lo revierte al desmontarse. Con `prefers-reduced-motion` (la `mediaQuery` del scope) todo salta sin animarse.
  - **Lo instantáneo va con `utils.set`, no con `animate` y `duration: 0`:** `animate` espera al siguiente frame, y Anime.js pausa su motor con la pestaña oculta.
  - **`SlidingHighlight`** desliza un fondo hasta el enlace con `aria-current="page"`: lo usan el sidebar de la app (`AppSidebar`) y la barra interna de cada sección (`SectionNav`). Hasta hidratar, el enlace activo pinta su propio fondo; después el contenedor lleva `data-highlight` y el enlace lo apaga con `in-data-highlight:bg-transparent!`, para que no haya un instante sin selección.
  - Con el App Router la página anterior se desmonta al llegar la nueva: entre páginas solo se puede animar la entrada.
- Noto Sans JP con `next/font` y modo oscuro según el sistema.
- **Se evaluó migrar a una SPA de React y se descartó:** se perderían los 404 reales, la caché del servidor y el ocultar la API al navegador.

## Límites de plataforma

- **Vercel Hobby:** funciones de máximo 300 s. Cron como máximo una vez al día, en UTC y en cualquier minuto de la hora indicada.
- **Neon Free:** 0.5 GB. El cómputo se suspende tras 5 min de inactividad y cobra por horas de cómputo. Por eso `PrismaService` **no llama a `$connect()` al arrancar**: conecta en la primera consulta y `/health` no despierta la base.
- **Gemini free tier:** límites por minuto y por día. Nunca asumir límites fijos.
- **Prisma 7:**
  - La URL va en `prisma.config.ts` y no en el schema.
  - El generador es `prisma-client` con `moduleFormat = "esm"` e `importFileExtension = "js"`, porque lo compila nuestro `tsc` como el resto de la API. El output va en `src/generated/prisma`.
  - El adaptador es `PrismaNeon` por WebSocket, porque el HTTP no soporta transacciones interactivas.
  - `prisma.config.ts` lee `DIRECT_URL` sin zod, porque `prisma generate` corre en `postinstall` antes de que exista el `.env`.

## Variables de entorno

### API (`apps/api/.env`, nunca en el repo)

```
PORT=                        # opcional, por defecto 3001
DATABASE_URL=                # Neon pooled (host con -pooler)
DIRECT_URL=                  # Neon directa, para migraciones
GOOGLE_SERVICE_ACCOUNT_KEY=  # JSON de la cuenta de servicio, en base64
GOOGLE_DOC_ID=               # ID o URL del documento
GOOGLE_DOC_SKIP_TABS=        # opcional, tabId separados por coma (hoy t.0)
GOOGLE_DOC_PERSONAL_TERMS=   # opcional, términos personales a descartar, separados por coma
GEMINI_API_KEY=
GEMINI_MODEL=                # hoy gemini-3.5-flash
GEMINI_MIN_INTERVAL_MS=      # opcional, por defecto 7000
GEMINI_MAX_RETRIES=          # opcional, por defecto 4
CRON_SECRET=                 # al menos 16 caracteres
```

- `config/env.ts` valida con zod **al importarse** solo lo que necesita la API para arrancar: `PORT`, `DATABASE_URL` y `DIRECT_URL`. Comprueba cuál es cuál por el `-pooler`, porque intercambiarlas rompe las migraciones con un error opaco.
- **Cada componente valida sus propias variables** con `parseEnvWith(schema)`, cuando las usa por primera vez (Google, Gemini, `CRON_SECRET`). Así la API pública arranca sin credenciales de la ingesta.
- El `.env` se carga con `process.loadEnvFile`, que **nunca pisa una variable ya presente**: en Vercel mandan los valores de la plataforma.
- **Cuenta de servicio, no OAuth:** un refresh token de una app en «Testing» caduca a los 7 días. La clave va en una sola variable y en base64, porque sus saltos de línea se rompen al copiarla. Si el documento deja de ser accesible por enlace, hay que compartírselo al correo de la cuenta de servicio.

### Web (`apps/web/.env.local`, nunca en el repo)

```
API_URL=                     # en local http://localhost:3001
```

## Features futuras

Tarjetas de estudio, vocabulario, quizzes, práctica de dictado y práctica de kanji (esta lee `KanjiDetail` y no necesita tablas nuevas). Cada una será una sección nueva del sidebar.

- **Todas son por sesión:** se arma la sesión (por tema o por clase), se estudia y el estado vive en memoria, en un Context o store del layout raíz de Next, que no se desmonta al navegar.
- **Repetición dentro de la sesión** estilo Leitner, sin repaso entre días.
- **Aviso `beforeunload`** si hay una sesión en curso.
- **Para armar sesiones por clase** hacen falta endpoints de clases, que hoy no existen.

## Convenciones

- Código e identificadores en inglés; comentarios y documentación en español.
- TypeScript estricto, sin `any` salvo justificación.
- Funciones puras en `helpers/`, probadas sin red ni base.
