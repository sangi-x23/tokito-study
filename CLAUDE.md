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
- **Fuente:** Google Docs API (`googleapis`), scope `documents.readonly`, OAuth con refresh token del usuario.
- **Validación:** `zod` para toda respuesta del LLM y todo input externo.

### Versiones fijadas (decisiones de la Fase 0)

- **TypeScript `~6.0.3`, no la 7.** El tag `latest` de npm ya es TypeScript 7 (el compilador nativo), pero `@nestjs/cli@12` depende de `typescript ~6.0.2`.
- **`module: node20`** en `api` y `shared`. TypeScript 6 deprecó `moduleResolution: node10` y rompe la compilación; `node20` es la forma vigente de emitir CommonJS para Node.
- **Prisma `~7.10.0`** cuando llegue la Fase 1. El tag `latest` del paquete `prisma` apunta hoy a un release candidate de la 8; el estable de `@prisma/client` sigue en 7.10.
- **`@tokito/shared` compila a `dist/`** con `tsc` (CommonJS + `.d.ts`) en vez de exponer el código fuente, para que Nest y Next lo consuman igual. `pnpm -r build` respeta el orden topológico, así que `shared` se construye primero.

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
      llm/        interfaz LlmProvider + implementación Gemini
      ingestion/  ingesta semanal (endpoint cron) y lógica compartida con el bootstrap
      content/    lectura de temas e ítems (API pública)
    scripts/      bootstrap local (lectura inicial)
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
- `ItemOccurrence`: en qué clases apareció cada ítem.
- `ImageAsset`: caché de imágenes ya procesadas, por hash SHA-256 del contenido, con el texto extraído. Las imágenes **no se almacenan**.
- `IngestionRun`: registro de cada corrida; una corrida en `RUNNING` funciona como candado.

Invariantes:
- **IDs estables:** la ingesta siempre hace *upsert* por clave natural. Nunca borrar y recrear ítems o temas.
- **Todo ítem tiene al menos un tema.** El schema no lo exige (la relación es N:N); lo garantiza la ingesta. Un ítem sin temas es un bug, no un estado válido.
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
- `extractStudyItems(parts)` → ítems con una etiqueta libre de tema sugerido.
- `buildTaxonomy(labelsWithExamples)` → árbol de temas y mapeo etiqueta → slug de tema.
- `assignToTopics(items, catalog)` → reutiliza temas existentes del catálogo o propone nuevos con su tema padre.
Siempre con salida JSON estructurada y validada con zod. Si la validación falla, la corrida se marca `FAILED` y no se escribe nada.

### Bootstrap (lectura inicial, script local)
`pnpm ingest:bootstrap`, corre en la máquina local contra Neon (sin el límite de 300 s de Vercel). Tres fases:
1. **Extracción por pestaña:** ítems con etiqueta sugerida → archivos JSON locales. Reanudable.
2. **Taxonomía:** una llamada solo texto con las etiquetas y ejemplos → árbol de temas + mapeo etiqueta → tema.
3. **Revisión e importación:** el autor revisa el JSON de la taxonomía y luego se importa a la base de datos.

### Ingesta semanal (Vercel Cron)
- Endpoint protegido por `CRON_SECRET`, un día después de la clase (horario en UTC; Colombia = UTC-5).
- Toma el candado (`IngestionRun`), detecta pestañas nuevas o con `contentHash` distinto, extrae, asigna con el catálogo de temas actual, hace upsert y cierra la corrida.

## Features futuras (no implementar aún)
Tarjetas de estudio, vocabulario, quizzes, práctica de dictado. Todas son **por sesión**: se arma la sesión (por tema o por clase), se estudia y el estado vive en memoria (Context o store en el layout raíz de Next.js). Repetición dentro de la sesión estilo Leitner, sin repaso entre días. Aviso `beforeunload` si hay una sesión en curso.

## Roadmap

- [x] **Fase 0:** esqueleto del monorepo (pnpm workspaces, `apps/api` Nest, `apps/web` Next, `packages/shared`).
- [ ] **Fase 1:** Prisma + Neon: schema, `prisma.config.ts`, migración inicial, `PrismaService` con adaptador Neon, `GET /topics` de prueba.
- [ ] **Fase 2:** módulo `google-docs`: autenticación, lectura de pestañas, parseo a partes ordenadas (texto + imágenes), descarte del encabezado. Script de prueba que imprima las secciones.
- [ ] **Fase 3:** módulo `llm`: interfaz `LlmProvider`, implementación Gemini multimodal, throttle, reintentos y validación zod.
- [ ] **Fase 4:** bootstrap local en tres fases.
- [ ] **Fase 5:** ingesta semanal: endpoint, candado, Vercel Cron, `CRON_SECRET`.
- [ ] **Fase 6:** API de lectura: árbol de temas, detalle de tema con ítems y clases donde aparecieron.
- [ ] **Fase 7:** frontend: navegación por temas y vista de ítems.

## Variables de entorno (`apps/api/.env`, nunca en el repo)

```
DATABASE_URL=          # Neon pooled (-pooler)
DIRECT_URL=            # Neon directa, para migraciones
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_DOC_ID=
GEMINI_API_KEY=
GEMINI_MODEL=          # modelo Flash disponible en el free tier
CRON_SECRET=
```

## Convenciones
- Código e identificadores en inglés; comentarios y documentación en español.
- TypeScript estricto, sin `any` salvo justificación.
- Mantener este archivo actualizado: marcar fases completadas y registrar decisiones nuevas.
