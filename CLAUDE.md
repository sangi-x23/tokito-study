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
- **Lista de nombres sacada del propio documento, en dos pasadas.** El parser lee primero todas las pestañas y junta los nombres: los latinos salen de la asistencia; los katakana, de las líneas `カタカナ：Nombre` cuyo lado latino ya está en la asistencia (así `パン：Pan` no cuenta) y de lo que va delante de `せんせい`. Después descarta las líneas que nombran a alguien, con el nombre como palabra completa: `リサ` no tumba `リサイクル`. Los nombres solo viven en memoria. Un nombre que no aparece en ninguna de esas fuentes no se detecta; la segunda barrera es el prompt de extracción de la Fase 3.
- **Tres refuerzos tras revisar el bootstrap (2026-10-02).** En el `rawText` de las pestañas 6 a 8 se habían colado un apellido, un diminutivo y el negocio y el trabajo de compañeros:
  - Se descarta quien dice su nombre o apellido (`みょうじ は ゴメス です`), salvo que el hueco sea de plantilla (`〇〇`, `〜`, `nombre`, `なん`).
  - El lado latino de `山田ケンジ ／ Yamada Kenji` también cuenta como nombre.
  - Lo que ninguna regla puede saber (un diminutivo como `Pepe`, el nombre de un negocio, un personaje que no es del libro) va en `GOOGLE_DOC_PERSONAL_TERMS`: los términos latinos se buscan como palabra completa y el resto como texto literal.
  
  Los términos son datos personales, así que viven en el entorno y no en el repo. Se descartó detectar diminutivos por prefijo (`Caro` ⊂ `Carolina`): una `Carolina` en la clase tumbaría `たかい：caro`.
- **`GOOGLE_DOC_SKIP_TABS` excluye pestañas que no son clases.** La `t.0` trae el temario, la lista de la clase y las notas del parcial, que tienen el mismo formato que el vocabulario y no se pueden filtrar con reglas. Una pestaña excluida se lee como fuente de nombres, pero nunca se devuelve como sección. Las demás conservan su `position` original.
- **Tests con el runner de Node (`node:test`), sin dependencias.** `pnpm --filter @tokito/api test` compila a `dist-test/` y corre los `*.spec.ts`. El parser es una función pura sobre la respuesta de la API, así que se prueba con datos de mentira y sin red.

### Decisiones de la Fase 3

- **`GEMINI_MODEL=gemini-3.5-flash`.** Se eligió listando los modelos con la clave el 2026-10-01 y probando cada uno. `gemini-3.8-flash` aparece en el listado pero devolvía 503 de forma sistemática; `gemini-3.5-flash` responde y acepta `responseJsonSchema`.
- **`@google/genai` fijado en 2.24.0, no en la 2.25.0.** La 2.25.0 tenía un día de publicada y no pasaba el `minimumReleaseAge` de pnpm; se prefirió no excluirla de esa protección. `allowBuilds` queda en `false` para `@google/genai` (su script es un `echo`) y `protobufjs` (solo comprueba versiones).
- **zod es la única fuente de verdad del formato.** `z.toJSONSchema()` genera el `responseJsonSchema` que se manda a Gemini, y la respuesta se valida con el mismo esquema. Las reglas que no se ven en la estructura (`KanjiDetail` solo en ítems `KANJI`, cada imagen con su texto, cada etiqueta con su tema, árbol de dos niveles sin ciclos, todo ítem con tema) van en funciones `check*` aparte. Los textos no vacíos van como `refine` y no como `.min(1)`, para que el JSON Schema se quede en lo básico.
- **Los reintentos son nuestros, no del SDK.** Sin `retryOptions` el SDK no reintenta. Un 429 puede ser por la cuota por minuto, que se reintenta respetando el `RetryInfo`, o por la diaria (`quotaId` con `PerDay`), que lanza `LlmQuotaExhaustedError` de inmediato, porque no se recupera hasta medianoche, hora del Pacífico. Los 5xx, los fallos de red y el timeout de la petición (el SDK aborta a los 120 s y lanza `AbortError`) se reintentan con backoff exponencial y jitter. Un error de validación no se reintenta.
- **Throttle en memoria del proceso** (`GEMINI_MIN_INTERVAL_MS`, por defecto 7 s). Basta porque la ingesta nunca corre en paralelo: el candado de `IngestionRun` lo garantiza.
- **El proveedor es perezoso.** La clave y el modelo se validan en la primera llamada, así que la API pública arranca sin credenciales de Gemini. Quien consume el módulo inyecta `LLM_PROVIDER`, no `GeminiProvider`.
- **El módulo `llm` recibe las imágenes ya descargadas.** Descargarlas, reducirlas con `sharp` y consultar `ImageAsset` es trabajo de la ingesta. Cada imagen va precedida de una marca `[imagen <id>]` para que el modelo devuelva su texto en `imageTexts`.
- **Latencia observada:** una pestaña sin imágenes tarda unos 30 s; con 4 imágenes, entre 70 y 115 s. `buildTaxonomy` tarda entre 20 y 110 s. Cabe en los 300 s de Vercel para una pestaña por corrida, pero no da para varias pestañas con reintentos en la misma función. A tenerlo en cuenta en la Fase 5.
- **La taxonomía no es determinista.** Dos corridas con las mismas etiquetas dieron 17 y 34 temas. Es una razón más para la revisión manual del bootstrap (Fase 4).

### Decisiones de la Fase 4

- **`contentHash` = SHA-256 del texto y de los hashes de las imágenes, en orden.** Cambiar una imagen cuenta como cambio aunque el texto siga igual. Se hashea el contenido descargado, no la `contentUri`, que es temporal y cambia en cada lectura. Por eso calcular la huella obliga a descargar las imágenes, incluso de las pestañas que no cambiaron.
- **`imageId` = hash de la imagen.** Así el texto que devuelve el LLM se casa directo con la entrada de `ImageAsset`. Una imagen repetida en la misma pestaña se manda una sola vez. Las que ya están en caché se sustituyen por su texto. Las nuevas se reducen a 1024 px de ancho y se mandan en JPEG de calidad 85.
- **`extract` solo lee la base.** Consulta `ImageAsset` para reutilizar textos, pero toda escritura espera a `import`, después de la revisión. Las imágenes nuevas se guardan en caché recién al importar.
- **Fusión de ítems entre pestañas por `[type, japanese]`**, con `japanese` normalizado (NFC y sin espacios en los extremos). Significado, ejemplo y lecturas salen de la primera clase donde apareció. Los temas son la unión de los de todas sus etiquetas, y el primario es el de la primera.
- **Todo kanji va también a un tema de categoría `KANJI`.** Se usa el primero de la taxonomía y, si no hay ninguno, se crea `kanji`.
- **Escritura por lotes, no fila por fila.** Neon responde en unos 70 ms por consulta, y un upsert por fila serían miles de consultas y varios minutos. `writePlan` lee lo que existe, crea lo nuevo con `createMany`/`createManyAndReturn` y actualiza solo lo que cambió. Es la misma función que usará la ingesta semanal.
- **Lo único que se borra son enlaces `ItemTopic` obsoletos** de los ítems importados. Si la taxonomía revisada mueve un ítem de tema, deja de aparecer en el anterior. Ítems y temas nunca se borran.
- **El candado libera corridas abandonadas.** Una corrida que lleva más de 30 minutos en `RUNNING` se marca `FAILED` antes de tomar el candado. Sin eso, un proceso que muere sin cerrar bloquearía para siempre el cron.
- **`classDate` sale del título** (`7/10 …`). El año es el de la corrida, o el anterior si la fecha quedaría en el futuro.
- **La cuota diaria del nivel gratuito es pequeña.** El 2026-10-01 se agotó la de `gemini-3.5-flash` tras unas 20 llamadas, contando las pruebas y los reintentos ante 503. El bootstrap completo necesita unas 12 llamadas si ninguna falla, así que conviene correrlo con la cuota del día intacta. Como es reanudable, si se corta se sigue al día siguiente. Con mucha demanda, `GEMINI_MAX_RETRIES=8` aguanta picos de 503 de unos 3 minutos.
- **Cada reintento gasta cuota diaria, aunque la respuesta sea 503.** El 2026-10-02 la cuota se agotó tras unas 22 peticiones que solo dieron 4 extracciones buenas; el resto fueron 503 y timeouts. Con el modelo saturado, subir `GEMINI_MAX_RETRIES` cambia cortes por cuota quemada: si los 503 no ceden, conviene parar y retomar más tarde.
- **Proveedor manual para el bootstrap (`--manual`).** Con la cuota de Gemini agotada, las pestañas 5–11 y la taxonomía se hicieron a mano desde Claude Code, sin API de pago. `ManualProvider` (`ingestion/bootstrap/manual-provider.ts`) implementa `LlmProvider` sobre archivos: cada llamada deja en `.bootstrap/manual/<operación>-<clave>/` un `request.md` (instrucciones, esquema y contenido) y las imágenes ya reducidas, y lanza `LlmPendingError`; `extract` la cuenta como pendiente y sigue. Al volver a correr, el `response.json` se valida con el mismo esquema y las mismas reglas `check*` que una respuesta de Gemini, y la huella sale del flujo normal. La clave es el hash del contenido, así que una pestaña que cambió pide una solicitud nueva. `assignToTopics` no se implementa: la ingesta semanal sigue con Gemini.
- **Las extracciones se corrigieron a mano antes de importar (2026-10-02).** Una revisión encontró ítems que no se fusionaban por `[type, japanese]`, y se aplicaron estas convenciones a todas las pestañas:
  - `japanese` va sin espacios internos ni `。`/`？` al final, y con paréntesis de ancho completo.
  - Los huecos de un `GRAMMAR_POINT` se marcan con `〜`, no con `〈…〉`.
  - Las preguntas completas son `PHRASE`; `はい` y `いいえ` son `WORD`.
  - Un mes o un día se escribe en kanji con su lectura (`九月`, `4日`), aunque la clase lo escribiera en kana.
  
  Después de cambiar el filtro de datos personales se recalcularon `rawText` y `contentHash` con el parser nuevo, sin volver a extraer, para que la ingesta no tome esas pestañas por modificadas.

### Decisiones de la Fase 5

- **Cron diario a las 00:00 de Colombia (`0 5 * * *` en UTC), no semanal.** La clase es los viernes, pero la ingesta decide por la huella del contenido y no por el calendario. Revisar cada día recoge las ediciones tardías y las pestañas que no alcanzaron en una corrida, y sigue funcionando sin cambios si la clase se mueve de día. Un día sin cambios no llama a Gemini: solo lee el documento, descarga las imágenes para la huella y despierta Neon unos segundos. En Hobby el cron se dispara en cualquier minuto de esa hora.
- **`GET /ingestion/run`**, porque Vercel Cron solo hace GET. Un guard compara `Authorization: Bearer <CRON_SECRET>` en tiempo constante (hashes SHA-256 con `timingSafeEqual`). `CRON_SECRET` se valida al recibir la petición y exige al menos 16 caracteres. Responde 401 sin secreto, 409 con el candado tomado, 503 con la cuota diaria agotada y 200 con el resumen.
- **Presupuesto de 100 s por corrida.** Pasado ese tiempo no se empieza otra pestaña, porque una pestaña con imágenes más la asignación puede superar los 200 s. Lo que queda se detecta en la siguiente corrida por su huella.
- **Una transacción por pestaña, no una por corrida.** Si la cuota se agota en la tercera pestaña, las dos primeras quedan escritas y no se vuelven a pagar.
- **Los ítems que ya existen solo ganan la aparición.** Su significado, sus lecturas y sus temas no se tocan, porque los del bootstrap se corrigieron a mano. Solo los ítems nuevos pasan por `assignToTopics` y se ponen al final de cada tema; los temas nuevos van detrás de sus hermanos.
- **Las apariciones de una pestaña modificada se rehacen.** Si una clase editada deja de mencionar un ítem, pierde esa `ItemOccurrence`. El ítem y sus temas no se borran.
- **Las convenciones de `japanese` de la Fase 4 viven en código y en el prompt.** `normalizeJapanese` (`ingestion/helpers/item-key.ts`), compartida con el bootstrap, quita los espacios y el `。`/`？` final y pasa los paréntesis a ancho completo. Comprobado que no cambia la clave de ninguno de los 466 ítems importados. Lo que no se puede normalizar a mano (`〜` en los huecos, preguntas como `PHRASE`, meses en kanji) va en el prompt de extracción.
- **El descarte de datos personales también quita dónde vive alguien (2026-10-04).** La primera corrida real guardó en el `rawText` el barrio de alguien (`わたしは 〈barrio〉に すんでいます` y su traducción `Yo vivo en 〈barrio〉`). Se descarta la línea en primera persona (también `わたしの はは は …`) salvo que el lugar sea un hueco de plantilla (`（ Lugar ）`, `［　］`, `〜`). La tercera persona queda fuera a propósito: `アランさんは ロンドンに すんでいます` es del libro. No cambió la huella de ninguna pestaña del bootstrap; solo se reprocesó la que tenía el dato.
- **Correcciones a mano tras la primera corrida (2026-10-04).** `〜にすんでいます` y `〜は〜にすんでいます` salieron de clases distintas y se fusionaron en el segundo, con tema primario `estructura-de-la-frase` y también en `casa`. Se borró el tema `gramatica/vivienda`, que había creado `assignToTopics` para ese único ítem. El `example` del ítem traía el barrio de alguien y se reemplazó por la plantilla. Por eso el prompt de extracción ahora también prohíbe los lugares donde vive la gente. Si la pestaña del 10/2 se reprocesa, Gemini puede volver a crear `〜にすんでいます`.
- **`ingest:run` corre la misma ingesta en local.** `--check` lista las pestañas cambiadas sin llamar al LLM ni escribir; sin flag procesa todas, sin presupuesto de tiempo.

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
        types/      plan de importación (SectionExtraction, ImportPlan…)
        helpers/    huella de contenido, imágenes, plan, escritura por lotes, candado
        bootstrap/  las tres fases del bootstrap y sus archivos locales en .bootstrap/
        tests/      *.spec.ts del módulo
      content/    lectura de temas e ítems (API pública)
      scripts/    scripts sueltos (print-sections, bootstrap, ingest) compilados con el resto
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
`pnpm --filter @tokito/api ingest:bootstrap <fase>`, corre en la máquina local contra Neon (sin el límite de 300 s de Vercel). Tres fases, cada una un subcomando:
Con `--manual`, `extract` y `taxonomy` usan `ManualProvider` en lugar de Gemini.
1. **`extract`:** ítems con etiqueta sugerida → `apps/api/.bootstrap/extractions/<tabId>.json`. Es reanudable: salta las pestañas cuya huella no cambió (`--force` las rehace) y borra los archivos de pestañas que ya no están.
2. **`taxonomy`:** una llamada solo texto con las etiquetas y hasta 5 ejemplos de cada una → `.bootstrap/taxonomy.json`, más el árbol impreso para revisarlo. No pisa una taxonomía existente sin `--force`.
3. **Revisión e `import`:** el autor edita `taxonomy.json` a mano. `import` lo revalida con las mismas reglas que la respuesta del LLM, arma el plan y lo escribe en una transacción con el candado tomado. `--dry-run` solo cuenta lo que escribiría.

### Ingesta incremental (Vercel Cron)
- `GET /ingestion/run`, protegido por `CRON_SECRET`. El cron está en `apps/api/vercel.json` y corre todos los días a las 00:00 de Colombia (`0 5 * * *`, UTC).
- Toma el candado (`IngestionRun`) y detecta las pestañas nuevas o con `contentHash` distinto. Por cada una: extrae, asigna los ítems nuevos con el catálogo de temas actual y escribe la pestaña en su propia transacción. Al final cierra la corrida.
- Para correrla a mano: `pnpm --filter @tokito/api ingest:run [--check]`, o el endpoint con el header.

## Features futuras (no implementar aún)
Tarjetas de estudio, vocabulario, quizzes, práctica de dictado y práctica de kanji (lee `KanjiDetail`, no necesita tablas nuevas). Todas son **por sesión**: se arma la sesión (por tema o por clase), se estudia y el estado vive en memoria (Context o store en el layout raíz de Next.js). Repetición dentro de la sesión estilo Leitner, sin repaso entre días. Aviso `beforeunload` si hay una sesión en curso.

## Roadmap

- [x] **Fase 0:** esqueleto del monorepo (pnpm workspaces, `apps/api` Nest, `apps/web` Next, `packages/shared`).
- [x] **Fase 1:** Prisma + Neon: schema, `prisma.config.ts`, migración inicial, `PrismaService` con adaptador Neon, `GET /topics` de prueba.
- [x] **Fase 2:** módulo `google-docs`: autenticación, lectura de pestañas, parseo a partes ordenadas (texto + imágenes), descarte de datos personales calibrado contra el documento real y exclusión de pestañas que no son clases. Script de prueba que imprime las secciones.
- [x] **Fase 3:** módulo `llm`: interfaz `LlmProvider` con sus tres métodos, implementación Gemini multimodal, throttle, reintentos y validación zod. Script `llm:try` para calibrar la extracción contra una pestaña real.
- [x] **Fase 4:** bootstrap local en tres fases: `ingest:bootstrap extract`, `taxonomy` e `import` (con `--dry-run`). Importado en Neon el 2026-10-03: 11 pestañas, 57 temas, 466 ítems (7 kanji) y 19 imágenes en caché. Pestañas 1–4 extraídas con Gemini y 5–11 con `--manual`, revisadas y corregidas a mano antes de importar. Una segunda corrida de `import` no escribe nada.
- [x] **Fase 5:** ingesta incremental: `GET /ingestion/run` con `CRON_SECRET`, candado, una transacción por pestaña, presupuesto de tiempo y cron diario en `vercel.json`. Probada en local el 2026-10-04 con las dos clases nuevas (10/2 y 10/3). El cron se activa cuando la API se despliegue en Vercel; hasta entonces la ingesta se corre a mano con `ingest:run`.
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
GOOGLE_DOC_PERSONAL_TERMS=   # opcional, términos personales a descartar, separados por coma
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
