# App de estudio de japonés — contexto para Claude Code

Web app gratuita para estudiar japonés a partir de los diarios de clase del curso, que viven en un Google Doc con una pestaña por clase. La app lee el documento, extrae el material (texto e imágenes) con un LLM, lo organiza en una **taxonomía de temas** (no por clase) y lo muestra como material de estudio. Usuarios: el autor y sus compañeros de curso.

## Reglas no negociables

- **Costo $0.** Solo Vercel Hobby, Neon Free, Google Docs API y Gemini API en su nivel gratuito. No agregar servicios ni dependencias que requieran pago o tarjeta.
- **Sin login y sin persistencia en el cliente.** Prohibido localStorage, sessionStorage, IndexedDB o cookies para guardar estado. El progreso de estudio vive solo en memoria mientras la pestaña está abierta.
- **Sin datos personales.** Al procesar el documento, descartar nombres de compañeros, enlaces de Meet y cualquier dato personal del encabezado. Solo se guarda contenido de estudio.
- **API pública de solo lectura.** Los únicos endpoints que escriben están protegidos con `CRON_SECRET` (header `Authorization: Bearer <CRON_SECRET>`).
- **El ID del Google Doc va en variable de entorno** (`GOOGLE_DOC_ID`), nunca en el código ni en el repo.
- **Trabajo incremental.** Una fase del roadmap a la vez, cambios pequeños y revisables. Proponer el plan antes de implementar y avisar antes de cualquier refactor grande o dependencia nueva.

## Stack

- Monorepo con **pnpm workspaces**.
- **Backend:** NestJS (TypeScript estricto), modular. Desplegado en Vercel como función (zero-config NestJS, Fluid compute).
- **Base de datos:** PostgreSQL en **Neon**, con **Prisma 7**.
- **Frontend:** Next.js (App Router) + Tailwind, desplegado en Vercel.
- **LLM:** Gemini (SDK `@google/genai`), modelo Flash del nivel gratuito, configurable por `GEMINI_MODEL`.
- **Fuente:** Google Docs API (`googleapis`), scope `documents.readonly`, autenticada con una **cuenta de servicio**.
- **Validación:** `zod` para toda respuesta del LLM y todo input externo.

### Versiones fijadas (decisiones de la Fase 0)

- **TypeScript `~6.0.3`, no la 7.** El tag `latest` de npm ya es TypeScript 7 (el compilador nativo), pero `@nestjs/cli@12` depende de `typescript ~6.0.2`.
- **`module: node20`** en `api` y `shared`. TypeScript 6 deprecó `moduleResolution: node10` y rompe la compilación; `node20` es la forma vigente de emitir CommonJS para Node.
- **Prisma `~7.10.0`** cuando llegue la Fase 1. El tag `latest` del paquete `prisma` apunta hoy a un release candidate de la 8; el estable de `@prisma/client` sigue en 7.10.
- **`@tokito/shared` compila a `dist/`** con `tsc` (CommonJS + `.d.ts`) en vez de exponer el código fuente, para que Nest y Next lo consuman igual. `pnpm -r build` respeta el orden topológico, así que `shared` se construye primero.

### Decisiones de la Fase 1

- **`moduleFormat = "cjs"` en el generador.** Por defecto `prisma-client` emite ESM (usa `import.meta`) y Node revienta al cargarlo desde nuestro build CommonJS: *exports is not defined in ES module scope*.
- **`prisma.config.ts` lee `process.env.DIRECT_URL` directo, sin zod.** Usa `loadEnvFile()` pero no el módulo validado, porque `prisma generate` corre en `postinstall` y tiene que funcionar en un clon recién hecho, antes de que exista el `.env`. Por eso la carga del archivo vive en `config/load-env-file.ts`, separada de la validación.
- **`PrismaService` no llama a `$connect()` al arrancar.** Prisma conecta en la primera consulta. Conectar al inicializar despertaría la base en cada arranque en frío, incluso para peticiones que no la tocan como `/health`, y el free tier de Neon cobra por horas de cómputo.
- **Adaptador por WebSocket (`PrismaNeon`), no HTTP.** La variante HTTP es más ligera pero no soporta transacciones interactivas, y la ingesta las necesita.
- **`onlyBuiltDependencies` en `pnpm-workspace.yaml`.** pnpm 10+ bloquea los scripts de postinstall y Prisma los necesita.

### Decisiones de la Fase 2

- **Cada componente valida sus propias variables.** `parseEnvWith(schema)` en `config/env.ts` es el helper; `google-docs` declara las suyas en `google-docs.env.ts` y las valida al construir el cliente, no al importar el módulo. Así la API pública arranca sin credenciales de Google, que solo necesita la ingesta.
- **Cuenta de servicio, no OAuth de usuario.** El documento del curso es accesible por enlace, así que la app no necesita actuar en nombre de nadie. Decisivo: un refresh token de una app en estado "Testing" **caduca a los 7 días** y dejaría el cron semanal sin credencial; la clave de una cuenta de servicio no caduca. Si el documento deja de ser accesible por enlace, hay que compartírselo al correo de la cuenta de servicio.
- **La clave va en una sola variable y en base64.** La clave privada trae saltos de línea reales; repartida en varias variables con `
` escapados se rompe al copiarla entre el `.env` y el panel de Vercel.
- **`includeTabsContent: true` es obligatorio.** Sin él `documents.get` devuelve solo la primera pestaña y el resto de las clases se pierde en silencio.
- **Las tablas se aplanan a filas con `|` entre columnas.** Un diario de japonés mete el vocabulario en tablas y perder esa estructura confundiría al LLM.
- **El descarte de datos personales está calibrado contra el documento real** y trabaja por líneas: quita la línea completa. Caen los enlaces y la etiqueta de videollamada, los correos, la asistencia (`出席者：` / `欠席者：`, con `：` de ancho completo), las menciones a profesores (`〈kana〉せんせい`) y los compañeros con `くん` o `ちゃん`. Se pierde alguna frase de ejemplo a cambio de no dejar pasar nombres. `さん` queda fuera a propósito, porque lo usan los personajes del libro (`アランさん`), que sí son material.
- **Lista de nombres sacada del propio documento, en dos pasadas.** El parser lee primero todas las pestañas y junta los nombres: los latinos salen de la asistencia; los katakana, de las líneas `カタカナ：Nombre` cuyo lado latino ya está en la asistencia (así `パン：Pan` no cuenta) y de lo que va delante de `せんせい`. Después descarta las líneas que nombran a alguien, con el nombre como palabra completa: `サラ` no tumba `サラダ`. Los nombres solo viven en memoria. Un nombre que no aparece en ninguna de esas fuentes no se detecta; la segunda barrera es el prompt de extracción de la Fase 3.
- **`GOOGLE_DOC_SKIP_TABS` excluye pestañas que no son clases.** La `t.0` trae el temario, la lista de la clase y las notas del parcial, que tienen el mismo formato que el vocabulario y no se pueden filtrar con reglas. Una pestaña excluida se lee como fuente de nombres, pero nunca se devuelve como sección. Las demás conservan su `position` original.
- **Tests con el runner de Node (`node:test`), sin dependencias.** `pnpm --filter @tokito/api test` compila a `dist-test/` y corre los `*.spec.ts`. El parser es una función pura sobre la respuesta de la API, así que se prueba con datos de mentira y sin red.

### Decisiones de la Fase 3

- **`GEMINI_MODEL=gemini-3.5-flash`.** Se eligió listando los modelos con la clave el 2026-10-01 y probando cada uno. `gemini-3.8-flash` aparece en el listado pero devolvía 503 de forma sistemática; `gemini-3.5-flash` responde y acepta `responseJsonSchema`.
- **`@google/genai` fijado en 2.24.0, no en la 2.25.0.** La 2.25.0 tenía un día de publicada y no pasaba el `minimumReleaseAge` de pnpm; se prefirió no excluirla de esa protección. `allowBuilds` queda en `false` para `@google/genai` (su script es un `echo`) y `protobufjs` (solo comprueba versiones).
- **zod es la única fuente de verdad del formato.** `z.toJSONSchema()` genera el `responseJsonSchema` que se manda a Gemini, y la respuesta se valida con el mismo esquema. Las reglas que no se ven en la estructura (`KanjiDetail` solo en ítems `KANJI`, cada imagen con su texto, cada etiqueta con su tema, árbol de dos niveles sin ciclos, todo ítem con tema) van en funciones `check*` aparte. Los textos no vacíos van como `refine` y no como `.min(1)`, para que el JSON Schema se quede en lo básico.
- **Los reintentos son nuestros, no del SDK.** Sin `retryOptions` el SDK no reintenta. Un 429 puede ser por la cuota por minuto, que se reintenta respetando el `RetryInfo`, o por la diaria (`quotaId` con `PerDay`), que lanza `LlmQuotaExhaustedError` de inmediato, porque no se recupera hasta medianoche, hora del Pacífico. Los 5xx y los fallos de red se reintentan con backoff exponencial y jitter. Un error de validación no se reintenta.
- **Throttle en memoria del proceso** (`GEMINI_MIN_INTERVAL_MS`, por defecto 7 s). Basta porque la ingesta nunca corre en paralelo: el candado de `IngestionRun` lo garantiza.
- **El proveedor es perezoso.** La clave y el modelo se validan en la primera llamada, así que la API pública arranca sin credenciales de Gemini. Quien consume el módulo inyecta `LLM_PROVIDER`, no `GeminiProvider`.
- **El módulo `llm` recibe las imágenes ya descargadas.** Descargarlas, reducirlas con `sharp` y consultar `ImageAsset` es trabajo de la ingesta. Cada imagen va precedida de una marca `[imagen <id>]` para que el modelo devuelva su texto en `imageTexts`.
- **Latencia observada:** una pestaña sin imágenes tarda unos 30 s; con 4 imágenes, entre 70 y 115 s. `buildTaxonomy` tarda entre 20 y 110 s. Cabe en los 300 s de Vercel para una pestaña por corrida, pero no da para varias pestañas con reintentos en la misma función. A tenerlo en cuenta en la Fase 5.
- **La taxonomía no es determinista.** Dos corridas con las mismas etiquetas dieron 17 y 34 temas. Es una razón más para la revisión manual del bootstrap (Fase 4).

## Estructura

```
apps/
  api/            NestJS + Prisma
    prisma/       schema.prisma, migrations
    prisma.config.ts
    src/
      health/     GET /health, prueba de humo del despliegue
      prisma/     PrismaService (adaptador Neon)
      google-docs/  lectura del documento y parseo a secciones
        config/     variables de entorno y cliente autenticado de googleapis
        types/      tipos públicos del módulo (DocumentPart, ParsedSection…)
        helpers/    funciones puras (parser, descarte de datos personales)
        tests/      *.spec.ts del módulo
      llm/        interfaz LlmProvider + implementación Gemini
        config/     variables de entorno de Gemini
        types/      contratos de la interfaz (LlmPart, Extraction, Taxonomy…)
        schemas/    esquemas zod de cada respuesta y sus reglas check*
        prompts/    instrucciones de cada método
        helpers/    throttle, reintentos, parseo de la salida estructurada
        providers/  GeminiProvider
        tests/      *.spec.ts del módulo
      ingestion/  ingesta semanal (endpoint cron) y lógica compartida con el bootstrap
      content/    lectura de temas e ítems (API pública)
      scripts/    scripts sueltos (print-sections, bootstrap) compilados con el resto
  web/            Next.js
packages/
  shared/         tipos y DTOs compartidos (@tokito/shared)
```

Vercel: dos proyectos desde este repo, con Root Directory `apps/api` y `apps/web`.

## Límites de plataforma que el código debe respetar

- **Vercel Hobby:** duración máxima de función 300 s. Cron como máximo una vez al día, horario en UTC, y puede dispararse en cualquier minuto de la hora indicada. La entrega es *best effort*: la ingesta debe ser **idempotente** y tolerar ejecuciones duplicadas o perdidas.
- **Neon Free:** 0.5 GB de almacenamiento; el cómputo se suspende tras 5 min de inactividad (arranque en frío de unos segundos). Runtime usa la URL *pooled* (`DATABASE_URL`, host con `-pooler`) mediante `@prisma/adapter-neon`; migraciones usan la URL directa (`DIRECT_URL`) desde `prisma.config.ts`.
- **Gemini free tier:** límites por minuto y por día, por proyecto. El cliente debe espaciar las llamadas y reintentar con backoff exponencial ante 429. Nunca asumir límites fijos.
- **Prisma 7:** configuración en `prisma.config.ts` (la URL no va en el schema), generador `prisma-client` con output en `src/generated/prisma`, y `prisma generate` se ejecuta explícitamente.

## Modelo de datos (ver `apps/api/prisma/schema.prisma`)

- `SourceDocument`: el Google Doc, con la última revisión vista.
- `Section`: una pestaña del documento = una clase. Clave natural `[documentId, tabId]` (el `tabId` es estable aunque se renombre la pestaña). Guarda `contentHash` para detectar cambios y `processedAt` para reanudar procesos.
- `Topic`: taxonomía jerárquica (tema → subtema) mediante `parentId`. Ejemplo: "Fechas y calendario" contiene "Días de la semana", "Días del mes" y "Meses". **La navegación de la app es por temas, no por clases.**
- `StudyItem`: el átomo del sistema (palabra, kanji, punto gramatical o frase). Existe **una sola vez** aunque aparezca en varias clases: clave `[type, japanese]`.
- `ItemTopic`: relación N:N entre ítem y tema. Un ítem puede vivir en varios temas a la vez: 日 pertenece tanto a "Fechas y calendario" como a un tema de categoría `KANJI` para practicarlo. `isPrimary` marca el tema canónico (breadcrumbs y listados planos) y `position` ordena dentro del tema.
- `KanjiDetail`: datos de práctica de un kanji (1:1 con el `StudyItem` de tipo `KANJI`). Lecturas `onyomi` y `kunyomi` como arreglos, más `strokeCount` y `jlptLevel` opcionales. Tabla aparte y no columnas nulables en `StudyItem`, para que la tabla del átomo no se llene de campos que solo aplican a un tipo.
- `ItemOccurrence`: en qué clases apareció cada ítem.
- `ImageAsset`: caché de imágenes ya procesadas, por hash SHA-256 del contenido, con el texto extraído. Las imágenes **no se almacenan**.
- `IngestionRun`: registro de cada corrida; una corrida en `RUNNING` funciona como candado.
  El candado lo garantiza la base, no el código: un **índice único parcial** (`IngestionRun_one_running`) escrito a mano en la migración inicial, porque Prisma no sabe expresarlos en el schema. Un segundo `INSERT` en `RUNNING` falla con `23505`. Comprobado que `prisma migrate dev` no intenta borrarlo: genera una migración vacía.

Invariantes:
- **IDs estables:** la ingesta siempre hace *upsert* por clave natural. Nunca borrar y recrear ítems o temas.
- **Todo ítem tiene al menos un tema.** El schema no lo exige (la relación es N:N); lo garantiza la ingesta. Un ítem sin temas es un bug, no un estado válido.
- **`KanjiDetail` solo cuelga de ítems `KANJI`.** Tampoco lo exige el schema; es responsabilidad de la ingesta.
- **Qué palabras usan un kanji no se guarda:** se deriva con `japanese LIKE '%<kanji>%'` sobre los ítems de tipo `WORD`. A la escala de un curso eso es trivial para Postgres, y una tabla de enlace habría que mantenerla sincronizada cada vez que entra una palabra nueva.
- Las features futuras agregan tablas o módulos propios que **leen** `StudyItem`; no modifican las tablas de contenido.

## Ingesta

### Lectura del documento
- `documents.get` con `includeTabsContent: true`. Cada pestaña se convierte en una `Section`.
- Recorrer el contenido en orden y construir una secuencia de partes: texto e imágenes intercaladas en su posición original (las imágenes vienen en `inlineObjects`, con una `contentUri` temporal para descargarlas).
- Descartar el encabezado con datos personales antes de guardar o enviar al LLM.

### Imágenes
- Descargar, calcular hash; si existe en `ImageAsset`, reutilizar el texto extraído sin llamar al LLM.
- Si es nueva, reducir con `sharp` (ancho ~1024 px) antes de enviar.
- **Una llamada al LLM por pestaña**, con texto e imágenes intercalados, no una llamada por imagen.

### LlmProvider
Interfaz independiente del proveedor, con implementación inicial en Gemini. Métodos previstos:
- `extractStudyItems(parts)` → ítems con una etiqueta libre de tema sugerido. Para los ítems de tipo `KANJI` devuelve además `onyomi`, `kunyomi`, `strokeCount` y `jlptLevel`.
- `buildTaxonomy(labelsWithExamples)` → árbol de temas y mapeo etiqueta → slug de tema.
- `assignToTopics(items, catalog)` → reutiliza temas existentes del catálogo o propone nuevos con su tema padre.
Siempre con salida JSON estructurada y validada con zod. Si la validación falla, la corrida se marca `FAILED` y no se escribe nada.

El prompt de `extractStudyItems` debe pedir explícitamente que **no se extraigan nombres, edades ni profesiones de personas reales**. Es la segunda barrera tras `strip-personal-data.ts`: las autopresentaciones de los compañeros (`えいごきょうしです。`) quedan sin nombre, pero siguen siendo datos ajenos y deben generalizarse a la plantilla (`わたしは〈profesión〉です`).

Las lecturas de un kanji son **las que enseñó el curso**, no el juego completo del diccionario: la app estudia el material de clase. `strokeCount` y `jlptLevel`, en cambio, son datos de referencia que el modelo puede alucinar; por eso son opcionales y es válido dejarlos en `null` antes que escribir un dato inventado.

### Bootstrap (lectura inicial, script local)
`pnpm ingest:bootstrap`, corre en la máquina local contra Neon (sin el límite de 300 s de Vercel). Tres fases:
1. **Extracción por pestaña:** ítems con etiqueta sugerida → archivos JSON locales. Reanudable.
2. **Taxonomía:** una llamada solo texto con las etiquetas y ejemplos → árbol de temas + mapeo etiqueta → tema.
3. **Revisión e importación:** el autor revisa el JSON de la taxonomía y luego se importa a la base de datos.

### Ingesta semanal (Vercel Cron)
- Endpoint protegido por `CRON_SECRET`, un día después de la clase (horario en UTC; Colombia = UTC-5).
- Toma el candado (`IngestionRun`), detecta pestañas nuevas o con `contentHash` distinto, extrae, asigna con el catálogo de temas actual, hace upsert y cierra la corrida.

## Features futuras (no implementar aún)
Tarjetas de estudio, vocabulario, quizzes, práctica de dictado y práctica de kanji (lee `KanjiDetail`, no necesita tablas nuevas). Todas son **por sesión**: se arma la sesión (por tema o por clase), se estudia y el estado vive en memoria (Context o store en el layout raíz de Next.js). Repetición dentro de la sesión estilo Leitner, sin repaso entre días. Aviso `beforeunload` si hay una sesión en curso.

## Roadmap

- [x] **Fase 0:** esqueleto del monorepo (pnpm workspaces, `apps/api` Nest, `apps/web` Next, `packages/shared`).
- [x] **Fase 1:** Prisma + Neon: schema, `prisma.config.ts`, migración inicial, `PrismaService` con adaptador Neon, `GET /topics` de prueba.
- [x] **Fase 2:** módulo `google-docs`: autenticación, lectura de pestañas, parseo a partes ordenadas (texto + imágenes), descarte de datos personales calibrado contra el documento real y exclusión de pestañas que no son clases. Script de prueba que imprime las secciones.
- [x] **Fase 3:** módulo `llm`: interfaz `LlmProvider` con sus tres métodos, implementación Gemini multimodal, throttle, reintentos y validación zod. Script `llm:try` para calibrar la extracción contra una pestaña real.
- [ ] **Fase 4:** bootstrap local en tres fases.
- [ ] **Fase 5:** ingesta semanal: endpoint, candado, Vercel Cron, `CRON_SECRET`.
- [ ] **Fase 6:** API de lectura: árbol de temas, detalle de tema con ítems y clases donde aparecieron.
- [ ] **Fase 7:** frontend: navegación por temas y vista de ítems.

## Variables de entorno (`apps/api/.env`, nunca en el repo)

```
PORT=                  # opcional, por defecto 3001
DATABASE_URL=          # Neon pooled (-pooler)
DIRECT_URL=            # Neon directa, para migraciones
GOOGLE_SERVICE_ACCOUNT_KEY=  # JSON de la cuenta de servicio, en base64
GOOGLE_DOC_ID=               # ID o URL del documento
GOOGLE_DOC_SKIP_TABS=        # opcional, tabId separados por coma (hoy t.0)
GEMINI_API_KEY=
GEMINI_MODEL=          # modelo Flash disponible en el free tier (hoy gemini-3.5-flash)
GEMINI_MIN_INTERVAL_MS=  # opcional, por defecto 7000
GEMINI_MAX_RETRIES=      # opcional, por defecto 4
CRON_SECRET=
```

### Validación

`apps/api/src/config/env.ts` valida el entorno con zod **al importarse**: un valor ausente o mal formado mata el proceso al arrancar, no a mitad de una petición. Sin librería extra (`envalid`, `@t3-oss/env-*`): zod ya es dependencia del proyecto y Node 24 carga el `.env` de forma nativa con `process.loadEnvFile`, que además **nunca pisa una variable ya presente en el entorno**, así que en Vercel mandan siempre los valores de la plataforma. El mismo módulo sirve para el bootstrap de la Fase 4, que corre fuera de Nest.

**Cada variable entra al esquema en la fase que empieza a leerla.** Exigir una que todavía nadie usa solo consigue que la app no arranque. Hoy el esquema cubre `PORT`, `DATABASE_URL` y `DIRECT_URL`.

`DATABASE_URL` y `DIRECT_URL` se diferencian solo en el `-pooler` del host, así que el esquema comprueba cuál es cuál. Intercambiarlas es fácil y rompería las migraciones con un error opaco de PgBouncer.

## Convenciones
- Código e identificadores en inglés; comentarios y documentación en español.
- TypeScript estricto, sin `any` salvo justificación.
- Mantener este archivo actualizado: marcar fases completadas y registrar decisiones nuevas.
