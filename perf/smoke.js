// Prueba de carga "smoke" con k6 para los endpoints públicos de lectura.
//
// Los `thresholds` convierten los hallazgos de rendimiento del análisis
// (docs/desarrollo/analisis-seguridad-rendimiento.md) en asserts: si un p95 se
// dispara, k6 sale con código != 0 y el job de CI falla.
//
// Local:  k6 run perf/smoke.js
// CI:     BASE_URL lo inyecta el workflow perf.yml
import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 }, // sube a 50 usuarios virtuales
        { duration: '1m', target: 50 }, // sostiene la carga
        { duration: '10s', target: 0 }, // baja
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% de errores
    'http_req_duration{ep:points}': ['p(95)<400'], // P-4: /points sin caché
    'http_req_duration{ep:stats}': ['p(95)<300'], // P-5: /stats (8 queries)
    'http_req_duration{ep:list}': ['p(95)<250'],
    'http_req_duration{ep:search}': ['p(95)<400'], // P-2: ILIKE %x% (full scan)
  },
};

export default function () {
  check(http.get(`${BASE}/battles/points`, { tags: { ep: 'points' } }), {
    'points 200': (r) => r.status === 200,
  });
  check(http.get(`${BASE}/battles/stats`, { tags: { ep: 'stats' } }), {
    'stats 200': (r) => r.status === 200,
  });
  check(
    http.get(`${BASE}/battles?page=1&pageSize=20`, { tags: { ep: 'list' } }),
    { 'list 200': (r) => r.status === 200 },
  );
  check(
    http.get(`${BASE}/battles?search=batalla`, { tags: { ep: 'search' } }),
    { 'search 200': (r) => r.status === 200 },
  );
}
