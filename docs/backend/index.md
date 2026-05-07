# Backend — Visión general

El backend es una API REST construida con **NestJS** y **Prisma** que expone los datos de batallas históricas al frontend y recibe los datos del scraper a través de un endpoint interno protegido.

---

## Responsabilidades

- Exponer la API REST consumida por el frontend
- Validar, deduplicar y persistir los datos enviados por el scraper
- Ejecutar búsqueda full-text con `tsvector` de PostgreSQL
- Gestionar la autenticación JWT
- Cachear respuestas frecuentes en Redis

---

## Estructura de módulos

```
backend/src/
├── app.module.ts
├── main.ts
├── prisma/
│   └── prisma.service.ts        # Wrapper del cliente Prisma
├── battles/
│   ├── battles.module.ts
│   ├── battles.controller.ts
│   └── battles.service.ts
├── wars/
│   ├── wars.module.ts
│   └── ...
├── commanders/
│   └── ...
├── locations/
│   └── ...
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts       # POST /auth/register, POST /auth/login
│   └── jwt.strategy.ts
└── internal/
    └── scraper/
        └── scraper.controller.ts  # POST /internal/scraper/battle
```

---

## Secciones del backend

- [Módulos NestJS](modulos.md) — Descripción de cada módulo y sus responsabilidades
- [API Reference](api.md) — Endpoints disponibles con ejemplos de petición/respuesta
