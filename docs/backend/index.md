# Backend — Visión general

API REST con **NestJS** y **Prisma** que expone las batallas al frontend,
ingiere datos de Wikidata/Wikipedia y genera la narrativa por IA en background.

---

## Responsabilidades

- Exponer la API REST consumida por el frontend (batallas, mapa, IA).
- Ingerir y normalizar datos desde Wikidata + Wikipedia (CLI).
- Generar y cachear la narrativa por IA con workers (BullMQ + Redis).
- Autenticación ligera por JWT (tier free/premium).

---

## Estructura de módulos

```
backend/src/
├── app.module.ts
├── main.ts
├── prisma/          # cliente Prisma (global)
├── battle/          # lectura de batallas y puntos del mapa
├── ai/              # endpoint Premium + worker + LLM
├── auth/            # JWT y guard premium
├── ingestion/       # cliente Wikidata/Wikipedia + servicio de ingesta
├── health/
├── seed.ts          # seed offline (3 batallas)
└── ingest.ts        # CLI de ingesta
```

---

## Secciones del backend

- [Módulos NestJS](modulos.md)
- [API Reference](api.md)
- [Ingesta (Wikidata)](ingesta.md)
- [IA (LLM)](ia.md)
