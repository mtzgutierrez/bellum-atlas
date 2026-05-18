# Normalización de datos

**Archivo**: `scraper/ares/ares/normalizers.py`

El pipeline aplica normalización antes de enviar cada item al backend. Los datos de Wikipedia llegan como texto libre; este módulo los transforma a tipos estructurados que el backend puede almacenar directamente.

---

## Por qué normalizar en el scraper

El backend acepta tanto campos raw como normalizados. Si el scraper envía un campo normalizado, el backend lo persiste directamente. Si no lo envía, el campo queda a `null` y podría rellenarse en una futura pasada.

| Responsabilidad | Quién la hace |
|---|---|
| Extraer texto de la infobox | Spider |
| Limpiar y convertir a tipos estructurados | **Pipeline (normalizers.py)** |
| Validar y persistir | Backend |

---

## `normalize_date(text)` — Fechas de batalla

Convierte texto de fecha a **ISO 8601 (YYYY-MM-DD)**. Si hay un rango, toma la primera fecha.

### Formatos reconocidos

| Entrada | Salida |
|---|---|
| `"18 de junio de 1815"` | `"1815-06-18"` |
| `"25 de julio-16 de noviembre de 1938"` | `"1938-07-25"` (primera) |
| `"18 June 1815"` | `"1815-06-18"` |
| `"June 18, 1815"` | `"1815-06-18"` |
| `"agosto de 1938"` | `"1938-08-01"` (día 1 si falta) |
| `"1815"` | `"1815-01-01"` (enero 1 si solo año) |
| `"c. 480 BC"` | `None` (BC fuera del scope) |

El resultado se envía al backend como campo `date` (ISO) junto al `dateText` original.

---

## `normalize_war_dates(text)` — Fechas de guerra

Convierte un rango de fechas a **startDate + endDate** en ISO 8601.

### Separadores reconocidos

`–`, `—`, ` al `, ` to `, ` hasta `, ` through `

### Ejemplos

| Entrada | startDate | endDate |
|---|---|---|
| `"1936–1939"` | `"1936-01-01"` | `"1939-12-31"` |
| `"17 de julio de 1936 – 1 de abril de 1939"` | `"1936-07-17"` | `"1939-04-01"` |
| `"julio de 1936 – abril de 1939"` | `"1936-07-01"` | `"1939-04-01"` |

!!! note "endDate con solo año"
    Si el extremo final es un año sin mes/día (ej: `"1939"`), el endDate se ajusta al **31 de diciembre** de ese año en lugar de al 1 de enero.

---

## `normalize_coordinates(text)` — Coordenadas

Convierte coordenadas a **WGS84 decimal `{ lat, lon }`**.

### Estrategia de parseo (en orden de prioridad)

**1. Decimal inline** — Wikipedia incluye las coordenadas en ambos formatos separados por `/`:

```
"41°09′50″N  0°28′30″E ﻿ / ﻿ 41.163888888889, 0.475"
                                ↑ se extrae directamente
```

**2. DMS** — Si no hay decimal, se convierte desde grados°minutos′segundos″:

```
"41°09′50″N 0°28′30″E"
→ lat = 41 + 9/60 + 50/3600 = 41.163888
→ lon =  0 + 28/60 + 30/3600 = 0.475
→ { lat: 41.163888, lon: 0.475 }
```

Soporta formatos con y sin segundos, con distintas variantes de apóstrofe y comilla.

### Validación

El resultado se descarta si `lat` no está en `[-90, 90]` o `lon` no está en `[-180, 180]`.

---

## `normalize_casualties_side(text)` — Bajas

Extrae **min y max** de bajas de un texto raw. Devuelve `{ raw, min, max }`.

### Separadores de miles soportados

| Formato | Ejemplo | Interpretación |
|---|---|---|
| Punto (español) | `"46.713"` | 46 713 |
| Coma (inglés) | `"46,713"` | 46 713 |
| Espacio | `"46 713"` | — (solo si no hay otros) |

### Ejemplos

| Entrada | min | max |
|---|---|---|
| `"46.713 bajas"` | 46713 | 46713 |
| `"40.000–45.000"` | 40000 | 45000 |
| `"≈ 100 aviones derribados"` | 100 | 100 |
| `"7.150 muertos \| 20.000 heridos"` | 7150 | 20000 |

El resultado se almacena en `BattleFaction.casualtiesMin` / `casualtiesMax` junto al texto raw en `casualtiesRaw`.

!!! info "Solo para batallas"
    `WarFaction` no tiene campos `casualtiesMin`/`casualtiesMax` en el modelo de datos. Para guerras, las bajas se envían únicamente como `casualtiesRaw`.

---

## Integración en el pipeline

Las funciones se invocan en `_build_payload` antes de construir el JSON:

```python
# Fecha (batalla)
date_iso = normalize_date(adapter.get('dateText'))
if date_iso:
    payload['date'] = date_iso

# Coordenadas
coords = normalize_coordinates(adapter.get('coordinates'))
if coords:
    payload['coordinates'] = coords

# Bajas (batalla)
raw_cas = adapter.get('casualties')
casualties = {}
for side in ('side1', 'side2'):
    normalized = normalize_casualties_side(raw_cas.get(side))
    if normalized:
        casualties[side] = normalized     # { raw, min, max }
if casualties:
    payload['casualties'] = casualties
```

---

## Fallos de normalización

Si una función no puede parsear el valor, devuelve `None` y el campo se omite del payload. El backend recibirá el campo raw (`dateText`, `coordinates` raw, `casualtiesRaw`) si está disponible, y los campos normalizados quedarán a `null` en la BD.

El logger registra un `DEBUG` por cada fallo de normalización, visible con `scrapy crawl wikipedia --loglevel DEBUG`.

---

## Pruebas rápidas

```bash
# Desde scraper/ares
python3 -c "
from ares.normalizers import normalize_date, normalize_coordinates, normalize_casualties_side

print(normalize_date('18 de junio de 1815'))
# → '1815-06-18'

print(normalize_coordinates('41°09′50″N  0°28′30″E / 41.163888, 0.475'))
# → {'lat': 41.163888, 'lon': 0.475}

print(normalize_casualties_side('40.000–45.000 bajas'))
# → {'raw': '40.000–45.000 bajas', 'min': 40000, 'max': 45000}
"
```
