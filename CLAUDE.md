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
- **Verificar antes de dar algo por hecho:** `pnpm typecheck`, `pnpm --filter @tokito/api test` y, si se tocó la web, probar las rutas contra la API local.

## Estado actual

- **Corre en local; todavía no está en Vercel.** Todo corre en la máquina del autor contra Neon. No desplegar ni configurar Vercel hasta que el autor lo pida. Mientras tanto, el cron no corre y la ingesta se lanza a mano con `ingest:run`.
- **Contenido:** importado el 2026-10-03 con un bootstrap revisado a mano. Hoy hay 15 temas raíz, unos 42 subtemas y alrededor de 470 ítems. Las clases nuevas entran por la ingesta incremental.
- **Web:** una sola sección, «Diario de clase», que navega por temas. La interfaz es mínima a propósito y se irá mejorando.
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
- **`module: node20`** en `api` y `shared`: TypeScript 6 deprecó `moduleResolution: node10`.
- **Prisma `~7.10.0`.** El tag `latest` de `prisma` apuntaba a un release candidate de la 8.
- **`@google/genai` en 2.24.0**, por el `minimumReleaseAge` de pnpm.
- **`allowBuilds` en `pnpm-workspace.yaml` decide cada script de instalación.** pnpm 11 rompe el `pnpm install` en CI (Vercel) si una dependencia con scripts queda sin decidir. Todas van en `false`, incluido Prisma: sus scripts solo descargan el motor de migraciones, que no usan ni `prisma generate` ni la API, y en Windows el preinstall de `prisma` revienta dentro de pnpm. El `prisma generate` lo corren el `postinstall` y el `build` de la API.
- **`@tokito/shared` compila a `dist/`** (CommonJS + `.d.ts`) para que Nest y Next lo consuman igual.

## Estructura

```
apps/
  api/                NestJS + Prisma
    prisma/           schema.prisma, migrations
    prisma.config.ts
    vercel.json       cron diario de la ingesta
    src/
      config/         validación del entorno (env.ts) y carga del .env
      health/         GET /health
      prisma/         PrismaService (adaptador Neon)
      google-docs/    lectura del documento, parseo a secciones y descarte de datos personales
      llm/            interfaz LlmProvider + implementación Gemini (schemas, prompts, reintentos)
      ingestion/      ingesta incremental (endpoint cron) y bootstrap local
      content/        API pública de lectura de temas e ítems
      scripts/        scripts sueltos compilados con el resto
  web/                Next.js
    app/              solo rutas
    sections/         una carpeta por sección del sidebar
    modules/          datos y componentes que comparten las secciones
    components/       layout (sidebar, PageContainer), breadcrumb e íconos
    lib/              cliente HTTP de la API y rutas de la app
packages/
  shared/             contratos compartidos (@tokito/shared)
```

Cada módulo de la API sigue la misma forma: `config/`, `types/`, `schemas/`, `helpers/` (funciones puras), `providers/` y `tests/` con los `*.spec.ts`, según lo que necesite.

**Las interfaces y tipos exportados van en `types/<tema>.ts`,** no en servicios, helpers ni providers. Hay dos excepciones:
- Un tipo privado de un archivo (sin `export`) se queda junto a la función que lo usa.
- Un tipo derivado de un valor en una línea (`z.infer<typeof schema>` en `config/`, `Prisma.*GetPayload<typeof include>` en `content/helpers/to-dto.ts`) se queda al lado de su esquema.

Vercel: dos proyectos desde este repo, con Root Directory `apps/api` y `apps/web`.

## Modelo de datos (ver `apps/api/prisma/schema.prisma`)

- `SourceDocument`: el Google Doc, con la última revisión vista.
- `Section`: una pestaña del documento = una clase. Clave natural `[documentId, tabId]` (el `tabId` es estable aunque se renombre la pestaña). Guarda `rawText` (ya sin datos personales), `contentHash` para detectar cambios y `classDate`, que sale del título (`7/10 …`).
- `Topic`: taxonomía de **dos niveles** (tema → subtema) mediante `parentId`, con `slug` único y `category`. **La navegación de la app es por temas, no por clases.**
- `StudyItem`: el átomo del sistema (`WORD`, `KANJI`, `GRAMMAR_POINT` o `PHRASE`). Existe **una sola vez** aunque aparezca en varias clases: clave `[type, japanese]`.
- `ItemTopic`: N:N entre ítem y tema. `isPrimary` marca el tema canónico (breadcrumbs) y `position` ordena dentro del tema. Un kanji vive en su tema temático y además en uno de categoría `KANJI`.
- `KanjiDetail`: 1:1 con un ítem `KANJI`. `onyomi` y `kunyomi` son **las lecturas que enseñó el curso**, no las del diccionario. `strokeCount` y `jlptLevel` son opcionales: mejor `null` que un dato inventado por el LLM.
- `ItemOccurrence`: en qué clases apareció cada ítem.
- `ImageAsset`: caché del texto extraído de cada imagen, por hash SHA-256 del contenido. Las imágenes **no se almacenan**.
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

## Web (`apps/web`)

### Tres capas

- **`app/`: solo rutas.** Lee los parámetros, pide los datos, llama a `notFound()`, declara metadata y `dynamic`, y termina en una vista. Sin marcado propio.
- **`sections/<sección>/`:** una carpeta por sección del sidebar, con `section.ts` (nombre, ruta e ícono), `icon.tsx`, `components/` y `views/`. `sections/index.ts` fija el orden del sidebar.
- **`modules/<módulo>/`:** lo que pueden usar varias secciones. Sigue a los módulos de la API (`content` = temas e ítems): `api/` con un archivo de endpoints por recurso, `components/` y etiquetas.
- **Regla para decidir:** si otra sección podría usarlo, va en `modules/`; si es cómo una sección arma su pantalla, va en `sections/`.
- **Agregar una sección:** crear su carpeta en `sections/`, sumarla a `sections/index.ts` y crear sus rutas en `app/`.

### Reglas

- **Server Components que llaman a la API desde el servidor de Next** (`lib/api-client.ts`, con `API_URL` solo del lado del servidor). El navegador nunca llama a la API: no hace falta CORS.
- **Componentes de cliente solo cuando hacen falta** y con estado en memoria. Hoy: `error.tsx`, `sidebar-link`, `sidebar-frame` y `topic-link`.
- **`dynamic = 'force-dynamic'` en las páginas y `revalidate: 3600` en cada `fetch`:** el build no necesita la API y los datos se cachean una hora.
- **Un 400 de la API cuenta como «no encontrado».**
- **Sin `loading.tsx`:** con él, un tema inexistente respondía 200 en vez de 404.
- **URLs en español** (`/diario/temas/[slug]`, `/diario/items/[id]`), armadas siempre con `lib/routes.ts`.
- **El ancho del contenido lo pone cada sección** con `PageContainer`, no el layout raíz. Así una sección puede tener columnas a todo el alto, como la barra de temas del Diario.
- **Sin librería de íconos:** SVG en línea sobre `components/icon.tsx`.
- Noto Sans JP con `next/font` y modo oscuro según el sistema.
- **Se evaluó migrar a una SPA de React y se descartó:** se perderían los 404 reales, la caché del servidor y el ocultar la API al navegador.

## Límites de plataforma

- **Vercel Hobby:** funciones de máximo 300 s. Cron como máximo una vez al día, en UTC y en cualquier minuto de la hora indicada.
- **Neon Free:** 0.5 GB. El cómputo se suspende tras 5 min de inactividad y cobra por horas de cómputo. Por eso `PrismaService` **no llama a `$connect()` al arrancar**: conecta en la primera consulta y `/health` no despierta la base.
- **Gemini free tier:** límites por minuto y por día. Nunca asumir límites fijos.
- **Prisma 7:**
  - La URL va en `prisma.config.ts` y no en el schema.
  - El generador es `prisma-client` con `moduleFormat = "cjs"`, porque el ESM por defecto revienta desde nuestro build CommonJS. El output va en `src/generated/prisma`.
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
