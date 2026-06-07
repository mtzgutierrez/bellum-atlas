# Plan de monetización — Historical Atlas (ares-codex)

> Documento de estrategia de negocio. Plan por fases para monetizar la app de
> batallas históricas (mapa Leaflet sobre datos de Wikidata/Wikipedia + relatos
> generados con IA Claude). Última revisión: 2026-06-07.

## Visión de negocio en una frase

No vendemos "un mapa de batallas". Vendemos **acceso a la historia militar como
experiencia**, a tres mercados con distinta disposición a pagar: *hobbyistas*
(suscripción barata, volumen), *educación* (licencias caras, B2B) y
*creadores/turismo* (afiliación y datos). El mapa gratis es el imán; la IA y los
datos son el producto.

## El insight financiero central

Gracias a la regla **Zero Real-Time Generation** + **caché permanente** de
`BattleAISummary`, generar el relato de una batalla cuesta una vez (céntimos con
prompt caching de Claude) y luego se sirve infinitas veces a coste ~0. Si además
activamos **SEO programático** (una página indexable por batalla), el coste de
adquisición también tiende a cero. Resultado: cada euro de suscripción/afiliación
es casi todo margen.

---

## FASE 0 — Cimientos: identidad, cuentas y legalidad (semanas 1–4)

Sin esto no se puede cobrar a nadie.

### Autenticación y cuentas
- Registro + login con **email/password** y **OAuth (Google, opc. Apple)** para
  reducir fricción y subir conversión.
- **Confirmación de email** obligatoria (token firmado, expira 24h). Reutilizar
  BullMQ para enviar correos async (Resend o Postmark; evitar SMTP propio).
- Recuperación de contraseña, cambio de email, **borrado de cuenta** (RGPD).
- **Gestión de cuenta**: perfil, estado de suscripción, historial de pagos.
- **Panel de admin**: ver usuarios, tiers, métricas, banear, conceder Premium.

> El claim `tier` del JWT ya existe. Hay que **dejar de emitir dev-tokens** y que
> `tier` salga de la BD real (`User.tier`, `subscriptionStatus`, `subscriptionEnd`).

### Legal (imprescindible para cobrar en la UE)
- Términos, política de privacidad, cookies, aviso legal.
- **Atribución correcta de Wikipedia/Wikidata (CC BY-SA)** — mayor riesgo legal.
  Citar fuente y licencia en cada ficha.
- Decidir entidad fiscal (autónomo basta para validar).

**KPI:** poder registrar, confirmar, loguear y que un admin vea usuarios.

---

## FASE 1 — Lanzar Premium y validar que alguien paga (semanas 4–10)

### Free vs Premium

| | Free | Premium |
|---|---|---|
| Mapa completo + fichas Wikipedia | ✅ | ✅ |
| "Un día como hoy", timeline, mini-mapa | ✅ | ✅ |
| **Relato narrativo IA** (`ai-story`) | Teaser (1er párrafo) | Completo |
| Batallas IA por mes | 3 gratis/mes | Ilimitado |
| Colecciones/favoritos guardados | ❌ | ✅ |
| Sin anuncios | — | ✅ |
| (futuro) Rutas temáticas, comparador, export | ❌ | ✅ |

El **teaser** (mostrar el primer párrafo del relato IA y cortar) es la mayor
palanca de conversión: la gente paga por terminar de leer lo que ya la enganchó.

### Precio
- **Mensual: 4,99 €/mes** — precio "Netflix-de-nicho" psicológicamente aceptable.
- **Anual: 39,99 €/año** (≈3,33 €/mes, −33%). Donde está el dinero real: caja por
  adelantado y menor churn.
- **Lifetime: 99 €** (solo en lanzamiento, edición limitada) para generar caja
  inicial de superfans y financiar marketing. Retirar después.
- No subir de 4,99 hasta tener prueba de demanda. Subir precio es fácil; bajarlo
  destruye confianza.

### Pasarela de pago
- **Lemon Squeezy o Paddle** (merchant of record) al principio: gestionan el
  **IVA UE/MOSS** automáticamente. Stripe cuando se internalice la fiscalidad.

### Free trial
- 7 días sin tarjeta **o** 14 días con tarjeta. Probar ambos (sin tarjeta = más
  volumen arriba del embudo).

### Unit economics
**Pre-generar ya** con IA todas las batallas de `importanceScore` alto (ya se hace
vía `AI_AUTO_QUEUE_MIN_SCORE`). El catálogo Premium queda "lleno" desde el día 1 y
el coste por usuario nuevo es ~0.

**KPI:** primeros 50–100 pagos. Conversión free→paid (objetivo 1–3%) y % anual.

---

## FASE 2 — Crecimiento orgánico: convertir la historia en tráfico (meses 3–9)

Ventaja clave: miles de batallas = miles de páginas de contenido único que Google
adora.

### SEO programático (la jugada más rentable)
- **Página pública indexable por batalla** (`/batalla/lepanto-1571`) con resumen,
  mapa, imagen y batallas de la misma época. SSR/SSG para que Google la lea.
- **Sitemap masivo** + datos estructurados Schema.org (`Event`, `Place`).
- Páginas de **agregación**: "Batallas de la 2GM", "Batallas en España",
  "Batallas del siglo XV", "Un día como hoy" (el endpoint `on-this-day` es oro
  para tráfico recurrente).
- El relato IA completo **no** se indexa (es de pago); el teaser sí → capta
  tráfico y convierte.

### Contenido y redes
- **Bot "on this day"**: usa el endpoint para publicar la efeméride diaria en
  X/Instagram/Threads/Bluesky con el mini-mapa como imagen. Contenido infinito.
- **Vídeo corto** (YouTube/TikTok/Reels): "La batalla de X en 60 s" con mapa
  animado. Nicho poco saturado en español.
- **Newsletter semanal** "Batalla de la semana" → captura emails → embudo Premium.

### Loops virales
- Botón "compartir" con imagen Open Graph dinámica del mini-mapa.
- Muro de pago elegante (con teaser) al agotar las 3 IA/mes.

**KPI:** tráfico orgánico, suscriptores newsletter, CAC ≈ 0.

---

## FASE 3 — Diversificar ingresos: B2B, afiliación y datos (meses 6–18)

### A) Educación (B2B — el cheque grande)
- **Licencia de aula/centro**: panel para profesor, cuentas de alumno, sin
  anuncios, modo presentación, crear "rutas" de batallas para una lección.
- Precio: **199–499 €/año por centro/aula**. Vender a profesores de Geografía e
  Historia, academias y universidades.
- Material descargable: fichas imprimibles, mapas para pizarra digital.

### B) Afiliación (ingreso pasivo sobre el tráfico existente)
En cada ficha, recomendar automáticamente:
- **Libros** sobre la batalla/guerra → Amazon Afiliados.
- **Juegos de mesa / wargames** → afiliación tiendas especializadas.
- **Tours al campo de batalla** → GetYourGuide/Civitatis (ticket alto: Normandía,
  Waterloo, Gettysburg).
- Documentales/streaming.

Monetiza a los usuarios *free* que nunca pagarán suscripción.

### C) Anuncios (solo free, discretos)
EthicalAds o AdSense para free; Premium sin anuncios (refuerza el valor). Nicho
historia = contenido "brand-safe".

### D) Licencia de datos / API
Dataset limpio, geolocalizado y enriquecido con resúmenes IA:
- **API de pago** para devs de juegos, apps educativas, otros mapas.
- Tiers: gratis (limitado) → 29 €/mes → 99 €/mes según volumen.

### E) Donaciones
Patreon/Ko-fi/GitHub Sponsors. En historia/cultura una minoría dona con
generosidad. Caja extra sin coste.

---

## FASE 4 — Foso defensivo y escala (mes 12+)

- **Contenido propietario**: mejores relatos IA, comparador de batallas, "modo
  recorrido" cinematográfico por una guerra completa.
- **Internacionalización**: el contenido ya es es↔en → abrir **inglés** = 10× el
  mercado; luego FR/DE/PT. Cada idioma = nuevo SEO programático.
- **App móvil** (PWA primero) para turismo de campos de batalla: "batallas cerca
  de ti" → afiliación de tours in-situ.
- **Partnerships** con museos y asociaciones de recreación histórica.
- **Sponsorships**: marcas de wargames, editoriales, plataformas de documentales.

---

## Resumen ejecutivo: prioridad por ROI

| Prioridad | Acción | Esfuerzo | Retorno |
|---|---|---|---|
| 1 | Auth real + pagos (Lemon Squeezy) + Premium 4,99/39,99 | Medio | Activa todo |
| 2 | **Teaser de IA + muro de pago** | Bajo | Conversión directa |
| 3 | **SEO programático** (página por batalla) | Medio | Tráfico gratis masivo |
| 4 | Bot "on this day" + newsletter | Bajo | Crecimiento orgánico |
| 5 | Afiliación libros/tours/juegos en fichas | Bajo | Ingreso pasivo del free |
| 6 | Licencia educativa B2B | Medio | Ticket alto |
| 7 | Inglés + i18n | Alto | 10× mercado |
| 8 | API de datos | Medio | Ingreso B2B recurrente |

**Secuencia mental:** primero cobrar (F0–1) → atraer gratis vía SEO/redes (F2) →
exprimir cada visitante por múltiples vías (F3) → blindar y escalar con idiomas (F4).
