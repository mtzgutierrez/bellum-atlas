import json
import logging
import os
import urllib.error
import urllib.request

from itemadapter import ItemAdapter

logger = logging.getLogger(__name__)

# Campos opcionales que se reenvían al backend tal cual si están presentes.
_OPTIONAL_FIELDS = ["place", "result", "belligerents", "commanders", "strength", "casualties"]


class BackendPipeline:
    """Envía cada WikipediaItem al endpoint POST /internal/scraper/battle del backend."""

    def open_spider(self, spider):
        self.backend_url = os.environ.get("BACKEND_URL", "http://localhost:3000").rstrip("/")
        self.api_key = os.environ.get("SCRAPER_API_KEY", "")
        if not self.api_key:
            logger.warning(
                "SCRAPER_API_KEY no configurada — las peticiones al backend fallarán con 401"
            )

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        payload = self._build_payload(adapter)

        if not payload.get("wikipediaUrl"):
            logger.warning("Item sin wikipediaUrl, se descarta: %s", payload.get("title"))
            return item

        self._send(payload)
        return item

    # ── helpers ──────────────────────────────────────────────────────────────

    def _build_payload(self, adapter):
        payload = {
            "type":         adapter.get("type") or "battle",
            "title":        adapter.get("title") or "",
            "wikipediaUrl": adapter.get("wikipediaUrl") or "",
        }

        if adapter.get("imageUrl"):
            payload["imageUrl"] = adapter["imageUrl"]

        # El backend distingue dateText (raw) de date (ISO). Solo enviamos el raw
        # hasta que se implemente la normalización de fechas en el pipeline.
        if adapter.get("dateText"):
            payload["dateText"] = adapter["dateText"]

        for field in _OPTIONAL_FIELDS:
            value = adapter.get(field)
            if value:
                payload[field] = value

        return payload

    def _send(self, payload):
        url = f"{self.backend_url}/internal/scraper/battle"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = json.loads(resp.read())
                logger.info(
                    "Upserted '%s' → id=%s slug=%s",
                    payload["title"],
                    body.get("id"),
                    body.get("slug"),
                )
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")
            logger.error(
                "Backend devolvió HTTP %s para '%s': %s",
                e.code,
                payload.get("wikipediaUrl"),
                body,
            )
        except urllib.error.URLError as e:
            logger.error("No se pudo conectar al backend (%s): %s", url, e.reason)
        except Exception as e:
            logger.error("Error inesperado enviando al backend: %s", e)
