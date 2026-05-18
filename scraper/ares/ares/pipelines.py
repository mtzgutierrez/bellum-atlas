import json
import logging
import os
import urllib.error
import urllib.request

from itemadapter import ItemAdapter

from ares.normalizers import (
    normalize_casualties_side,
    normalize_coordinates,
    normalize_date,
    normalize_war_dates,
)

logger = logging.getLogger(__name__)

_ENDPOINTS = {
    'battle':    '/internal/scraper/battle',
    'war':       '/internal/scraper/war',
    'commander': '/internal/scraper/commander',
}

_SHARED_OPTIONAL = ['place', 'result', 'belligerents', 'commanders']


class BackendPipeline:
    """
    Normaliza y envía cada item al endpoint del backend según su tipo:
      battle    → POST /internal/scraper/battle
      war       → POST /internal/scraper/war
      commander → POST /internal/scraper/commander
    """

    def open_spider(self, spider):
        self.backend_url = os.environ.get('BACKEND_URL', 'http://localhost:3000').rstrip('/')
        self.api_key = os.environ.get('SCRAPER_API_KEY', '')
        if not self.api_key:
            logger.warning('SCRAPER_API_KEY no configurada — el backend rechazará peticiones con 401')

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        item_type = adapter.get('type')

        if item_type not in _ENDPOINTS:
            logger.warning("Tipo de item desconocido '%s', se descarta", item_type)
            return item

        payload = self._build_payload(item_type, adapter)
        upsert_key = 'name' if item_type == 'commander' else 'wikipediaUrl'

        if not payload.get(upsert_key):
            logger.warning("Item '%s' sin '%s', se descarta", item_type, upsert_key)
            return item

        self._send(item_type, payload)
        return item

    # ── Construcción del payload ───────────────────────────────────────────────

    def _build_payload(self, item_type: str, adapter) -> dict:
        if item_type == 'battle':
            return self._battle_payload(adapter)
        if item_type == 'war':
            return self._war_payload(adapter)
        return self._commander_payload(adapter)

    def _battle_payload(self, adapter) -> dict:
        payload = {
            'type':         'battle',
            'title':        adapter.get('title') or '',
            'wikipediaUrl': adapter.get('wikipediaUrl') or '',
        }

        if adapter.get('imageUrl'):
            payload['imageUrl'] = adapter['imageUrl']

        # Fecha: enviamos dateText (raw) + date (ISO normalizado)
        date_raw = adapter.get('dateText')
        if date_raw:
            payload['dateText'] = date_raw
            date_iso = normalize_date(date_raw)
            if date_iso:
                payload['date'] = date_iso

        # Coordenadas: enviamos { lat, lon } si se pueden normalizar
        coords = normalize_coordinates(adapter.get('coordinates'))
        if coords:
            payload['coordinates'] = coords

        # Strength (raw)
        if adapter.get('strength'):
            payload['strength'] = adapter['strength']

        # Bajas estructuradas: { side1: { raw, min, max }, side2: { raw, min, max } }
        raw_cas = adapter.get('casualties')
        if raw_cas:
            casualties = {}
            for side in ('side1', 'side2'):
                normalized = normalize_casualties_side(raw_cas.get(side))
                if normalized:
                    casualties[side] = normalized
            if casualties:
                payload['casualties'] = casualties

        for field in _SHARED_OPTIONAL:
            if adapter.get(field):
                payload[field] = adapter[field]

        return payload

    def _war_payload(self, adapter) -> dict:
        payload = {
            'type':         'war',
            'title':        adapter.get('title') or '',
            'wikipediaUrl': adapter.get('wikipediaUrl') or '',
        }

        if adapter.get('imageUrl'):
            payload['imageUrl'] = adapter['imageUrl']

        # Fechas de guerra: rango → startDate + endDate
        date_raw = adapter.get('dateText')
        if date_raw:
            payload['dateText'] = date_raw
            start_iso, end_iso = normalize_war_dates(date_raw)
            if start_iso:
                payload['startDate'] = start_iso
            if end_iso:
                payload['endDate'] = end_iso

        coords = normalize_coordinates(adapter.get('coordinates'))
        if coords:
            payload['coordinates'] = coords

        if adapter.get('description'):
            payload['description'] = adapter['description']

        # Bajas de guerra: solo raw (WarFaction no tiene campos min/max)
        raw_cas = adapter.get('casualties')
        if raw_cas:
            payload['casualties'] = raw_cas

        for field in _SHARED_OPTIONAL:
            if adapter.get(field):
                payload[field] = adapter[field]

        return payload

    def _commander_payload(self, adapter) -> dict:
        payload = {
            'type':         'commander',
            'name':         adapter.get('name') or '',
            'wikipediaUrl': adapter.get('wikipediaUrl') or '',
        }
        for field in ['imageUrl', 'country', 'birthYear', 'deathYear', 'description']:
            if adapter.get(field) is not None:
                payload[field] = adapter[field]
        return payload

    # ── Envío HTTP ────────────────────────────────────────────────────────────

    def _send(self, item_type: str, payload: dict):
        url = self.backend_url + _ENDPOINTS[item_type]
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json', 'x-api-key': self.api_key},
            method='POST',
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = json.loads(resp.read())
                identifier = body.get('slug') or body.get('id', '?')
                label = payload.get('title') or payload.get('name')
                logger.info("Upserted %s '%s' → %s", item_type, label, identifier)
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors='replace')
            label = payload.get('wikipediaUrl') or payload.get('name')
            logger.error('Backend HTTP %s para %s %s: %s', e.code, item_type, label, body)
        except urllib.error.URLError as e:
            logger.error('No se pudo conectar al backend (%s): %s', url, e.reason)
        except Exception as e:
            logger.error('Error inesperado enviando %s al backend: %s', item_type, e)
