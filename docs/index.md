# ⚔ AresCodex

> **Atlas histórico interactivo de conflictos militares.**

AresCodex es una plataforma web que centraliza datos de miles de batallas y conflictos históricos en una experiencia visual moderna: mapas interactivos, fichas detalladas, líneas de tiempo y perfiles de comandantes.

---

## ¿Por qué existe AresCodex?

Wikipedia contiene información extraordinaria sobre historia militar, pero está fragmentada en miles de artículos sin conexión entre sí. AresCodex extrae esos datos, los estructura y los presenta como un producto coherente:

- **Mapa global** con más de 5.000 batallas georreferenciadas
- **Búsqueda potente** con filtros por era, país, resultado y tipo de conflicto
- **Fichas completas**: facciones, comandantes, bajas, contexto estratégico
- **Timeline navegable** desde la Antigüedad hasta el siglo XXI

---

## Servicios

El proyecto está compuesto por tres servicios independientes:

| Servicio | Tecnología | Rol |
|---|---|---|
| **Backend** | NestJS + PostgreSQL | API REST y lógica de negocio |
| **Frontend** | React + Mapbox | Interfaz web |
| **Scraper** | Python + Scrapy | Extracción de datos de Wikipedia |

---

## Inicio rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/ares-codex.git
cd ares-codex

# 2. Levantar la infraestructura
docker compose up -d

# 3. Backend
cd backend && npm install && npm run start:dev

# 4. Frontend (en otra terminal)
cd frontend && npm install && npm run dev

# 5. Scraper (en otra terminal)
cd scraper && pip install -r requirements.txt
cd ares && scrapy crawl wikipedia
```

!!! tip "Primer seed"
    El scraper tarda varios minutos en poblar la base de datos. Para desarrollo, usa el archivo `scraper/ares/output.json` para cargar datos de prueba rápidamente mientras desarrollas.

---

## Navegación de la documentación

- **[Arquitectura](arquitectura/index.md)** — Decisiones de diseño, stack y modelo de datos
- **[Scraper](scraper/index.md)** — Cómo se extraen y normalizan los datos de Wikipedia
- **[Backend](backend/index.md)** — Módulos NestJS y referencia de la API
- **[Frontend](frontend/index.md)** — Páginas, componentes y mapa interactivo
- **[Desarrollo](desarrollo/local.md)** — Entorno local, Docker y variables de entorno
- **[Roadmap](roadmap.md)** — Features planificadas y modelo de negocio
