# tokito-study

App web gratuita para estudiar japonés a partir de los diarios de clase del curso.
El material se organiza en una **taxonomía de temas**, no por clase.

El contexto completo del proyecto está en [`CLAUDE.md`](./CLAUDE.md).

## Requisitos

- Node.js >= 20.9 (probado en 24)
- pnpm 11

## Puesta en marcha

```bash
pnpm install
pnpm build          # compila shared, api y web en orden topológico
```

## Comandos

| Comando          | Qué hace                                          |
| ---------------- | ------------------------------------------------- |
| `pnpm dev:api`   | NestJS en watch mode (`http://localhost:3001`)    |
| `pnpm dev:web`   | Next.js en dev (`http://localhost:3000`)          |
| `pnpm build`     | Construye todos los paquetes                      |
| `pnpm typecheck` | Verifica tipos en todos los paquetes              |

`GET /health` responde `{ "status": "ok" }` y sirve como prueba de humo del despliegue.

> `pnpm dev:web` necesita que `@tokito/shared` esté construido al menos una vez
> (`pnpm build`), porque los apps consumen su `dist/`.

## Estructura

```
apps/
  api/        NestJS + Prisma (Neon)
  web/        Next.js (App Router) + Tailwind
packages/
  shared/     tipos y DTOs compartidos (@tokito/shared)
```
