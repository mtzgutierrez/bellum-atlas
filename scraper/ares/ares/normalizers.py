"""
Funciones de normalización para datos extraídos de infoboxes de Wikipedia.

  normalize_date(text)           → ISO 8601 (YYYY-MM-DD) | None
  normalize_war_dates(text)      → (startDate_iso | None, endDate_iso | None)
  normalize_coordinates(text)    → { lat, lon } | None
  normalize_casualties_side(text)→ { raw, min, max } | None
"""

import re
import logging

logger = logging.getLogger(__name__)

# ── Tablas de meses ───────────────────────────────────────────────────────────

_MONTHS = {
    # Español
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
    'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
    'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
    # Inglés
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12,
    # Abreviaturas inglesas
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4,
    'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
}

# Separadores de rango de fecha.
# El guion simple (-) solo se trata como separador si va entre un día/mes y otro día/mes
# (ej: "25 de julio-16 de noviembre"), no dentro de números (ej: "1936-07-17").
_RANGE_SEP = re.compile(
    r'\s*[–—]\s*'                          # em-dash / en-dash
    r'|\s+(?:al|to|hasta|through)\s+'      # palabras clave
    r'|(?<=\w)-(?=\d{1,2}\s+de\s+)',       # "julio-16 de" → guion entre mes y día
    re.IGNORECASE
)

# ── Fechas ────────────────────────────────────────────────────────────────────

def _parse_single_date(text: str) -> str | None:
    """
    Intenta parsear un fragmento de texto como una fecha.
    Devuelve ISO 8601 (YYYY-MM-DD) o None.
    """
    text = text.strip()

    # Ignorar referencias a BC/AC (fechas antiguas fuera del scope)
    if re.search(r'\b(?:BC|AC|a\.\s*C)\b', text, re.IGNORECASE):
        return None

    # 1) DD de MES de YYYY  — "18 de junio de 1815"
    m = re.search(r'(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})', text, re.IGNORECASE)
    if m:
        day, month_name, year = int(m.group(1)), m.group(2).lower(), int(m.group(3))
        month = _MONTHS.get(month_name)
        if month:
            return f'{year:04d}-{month:02d}-{day:02d}'

    # 2) MES DD, YYYY  — "June 18, 1815"
    m = re.search(r'([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})', text)
    if m:
        month_name, day, year = m.group(1).lower(), int(m.group(2)), int(m.group(3))
        month = _MONTHS.get(month_name)
        if month:
            return f'{year:04d}-{month:02d}-{day:02d}'

    # 3) DD MES YYYY  — "18 June 1815"
    m = re.search(r'(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})', text)
    if m:
        day, month_name, year = int(m.group(1)), m.group(2).lower(), int(m.group(3))
        month = _MONTHS.get(month_name)
        if month:
            return f'{year:04d}-{month:02d}-{day:02d}'

    # 4) MES de YYYY  — "agosto de 1938" (sin día → día 1)
    m = re.search(r'(\w+)\s+de\s+(\d{4})', text, re.IGNORECASE)
    if m:
        month_name, year = m.group(1).lower(), int(m.group(2))
        month = _MONTHS.get(month_name)
        if month:
            return f'{year:04d}-{month:02d}-01'

    # 5) MES YYYY  — "June 1815"
    m = re.search(r'([A-Za-z]+)\s+(\d{4})', text)
    if m:
        month_name, year = m.group(1).lower(), int(m.group(2))
        month = _MONTHS.get(month_name)
        if month:
            return f'{year:04d}-{month:02d}-01'

    # 6) Solo YYYY  — "1815"
    m = re.search(r'\b(\d{4})\b', text)
    if m:
        year = int(m.group(1))
        if 100 <= year <= 2200:
            return f'{year:04d}-01-01'

    return None


def normalize_date(text: str | None) -> str | None:
    """
    Normaliza texto de fecha de batalla a ISO 8601.
    Si hay un rango, toma la primera fecha.
    Si la primera parte no tiene año pero el texto completo sí, hereda el año.
    """
    if not text:
        return None

    clean = re.sub(r'\[[\w\s]+\]', '', text)
    parts = _RANGE_SEP.split(clean, maxsplit=1)
    first = parts[0].strip()

    result = _parse_single_date(first)
    if result:
        return result

    # Heredar el año del texto completo cuando la primera parte no lo incluye
    # Ej: "25 de julio-16 de noviembre de 1938" → primera parte es "25 de julio"
    year_m = re.search(r'\b(\d{4})\b', clean)
    if year_m:
        year = year_m.group(1)
        result = _parse_single_date(f'{first} de {year}') or _parse_single_date(f'{first} {year}')
        if result:
            return result

    logger.debug('normalize_date: no se pudo parsear "%s"', text[:80])
    return None


def normalize_war_dates(text: str | None) -> tuple[str | None, str | None]:
    """
    Normaliza texto de fecha de guerra a (startDate_iso, endDate_iso).
    Si es un año solo ("1936"), el endDate usará el 31 de diciembre.
    """
    if not text:
        return None, None

    clean = re.sub(r'\[[\w\s]+\]', '', text)
    parts = _RANGE_SEP.split(clean, maxsplit=1)

    start = _parse_single_date(parts[0]) if parts else None
    end = _parse_single_date(parts[1]) if len(parts) > 1 else None

    # Si el endDate quedó como YYYY-01-01 (solo año), ajustar a YYYY-12-31
    if end and end.endswith('-01-01') and len(parts) > 1 and re.fullmatch(r'\s*\d{4}\s*', parts[1].strip()):
        end = end[:4] + '-12-31'

    return start, end


# ── Coordenadas ───────────────────────────────────────────────────────────────

def normalize_coordinates(text: str | None) -> dict | None:
    """
    Convierte coordenadas a WGS84 decimal { lat, lon }.

    Prioridades:
      1. Decimal inline: "41.163888, 0.475"  (Wikipedia incluye ambos formatos)
      2. DMS: "41°09′50″N 0°28′30″E"
    """
    if not text:
        return None

    # 1) Decimal inline tras " / " o " / ﻿"  — "... / 41.163888, 0.475"
    m = re.search(r'/\s*([+-]?\d+\.\d+)\s*,\s*([+-]?\d+\.\d+)', text)
    if m:
        lat, lon = float(m.group(1)), float(m.group(2))
        if -90 <= lat <= 90 and -180 <= lon <= 180:
            return {'lat': round(lat, 6), 'lon': round(lon, 6)}

    # 2) DMS: grados°minutos′segundos″ dirección
    dms_re = re.compile(
        r'(\d+)\s*°\s*(?:(\d+)\s*[′\'ʹ]\s*)?(?:(\d+(?:\.\d+)?)\s*[″"ʺ]\s*)?([NSEW])',
        re.UNICODE
    )
    matches = dms_re.findall(text)
    if len(matches) < 2:
        logger.debug('normalize_coordinates: formato no reconocido: "%s"', text[:80])
        return None

    def _dms(deg, mins, secs, direction):
        dec = float(deg) + float(mins or 0) / 60 + float(secs or 0) / 3600
        return -dec if direction in ('S', 'W') else dec

    lat_m = next((m for m in matches if m[3] in ('N', 'S')), None)
    lon_m = next((m for m in matches if m[3] in ('E', 'W')), None)
    if not lat_m or not lon_m:
        return None

    lat = _dms(*lat_m)
    lon = _dms(*lon_m)
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None

    return {'lat': round(lat, 6), 'lon': round(lon, 6)}


# ── Bajas ─────────────────────────────────────────────────────────────────────

def normalize_casualties_side(text: str | None) -> dict | None:
    """
    Extrae min/max de bajas de un texto raw de Wikipedia.
    Devuelve { raw, min, max } o None si no se pueden extraer números.

    Maneja:
      - "46.713 bajas"           → min=46713, max=46713
      - "40.000–45.000"          → min=40000, max=45000
      - "≈ 100 aviones"          → min=100,   max=100
      - "7.150 muertos | 20.000" → min=7150,  max=20000
    """
    if not text:
        return None

    # Limpiar: quitar citas, pipes, notas
    clean = re.sub(r'\[[\w\s\d]+\]', '', text)
    clean = re.sub(r'\s*\|\s*', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()

    # Extraer números en formato español (punto como separador de miles): 46.713
    es_nums = [int(n.replace('.', '')) for n in re.findall(r'\d{1,3}(?:\.\d{3})+', clean)]

    # Extraer números en formato inglés (coma como separador de miles): 46,713
    en_nums = [int(n.replace(',', '')) for n in re.findall(r'\d{1,3}(?:,\d{3})+', clean)]

    # Extraer números planos ≥ 10 (evitar índices de cita sueltos)
    # Solo si no hay números con separador de miles
    plain_candidates = [int(n) for n in re.findall(r'\b(\d+)\b', clean)]

    numbers = es_nums + en_nums
    if not numbers:
        numbers = [n for n in plain_candidates if n >= 10]

    # Filtrar rango razonable de bajas (10 – 10 millones)
    numbers = sorted(set(n for n in numbers if 10 <= n <= 10_000_000))

    if not numbers:
        logger.debug('normalize_casualties_side: sin números en "%s"', text[:80])
        return None

    return {
        'raw': text.strip(),
        'min': numbers[0],
        'max': numbers[-1],
    }
