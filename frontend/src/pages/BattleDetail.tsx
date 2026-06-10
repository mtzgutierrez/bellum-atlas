import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BattleCard from "../components/BattleCard";
import BattleMiniMap from "../components/BattleMiniMap";
import Icon from "../components/Icon";
import SmartImage, { TYPE_LABEL } from "../components/SmartImage";
import TypeIcon from "../components/TypeIcon";
import { useApiFetch } from "../hooks/useApiFetch";
import { aiService } from "../services/ai.service";
import type { AIStoryState } from "../services/ai.types";
import { battleService } from "../services/battle.service";
import type { BattleDetail } from "../services/battle.types";
import { formatBattleDates } from "../utils/dates";

export default function BattleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetcher = useCallback(() => battleService.detalle(id!), [id]);
  const { data: battle, loading, error } = useApiFetch(fetcher, [id]);

  if (loading) {
    return (
      <main className="detail">
        <div
          className="skeleton"
          style={{ height: 32, width: "40%", marginBottom: 24 }}
        />
        <div
          className="skeleton"
          style={{ height: 64, width: "70%", marginBottom: 48 }}
        />
        <div className="skeleton" style={{ height: 320, marginBottom: 24 }} />
      </main>
    );
  }
  if (error || !battle) {
    return (
      <main className="detail">
        <div className="detail-breadcrumb">
          <Link to="/battles">Catálogo</Link>
          <Icon name="chevron-right" size={12} />
          <span>—</span>
        </div>
        <h1 className="detail-title">Registro no encontrado.</h1>
        <button className="btn btn-ghost" onClick={() => navigate("/battles")}>
          Volver al catálogo
        </button>
      </main>
    );
  }

  return <Detail battle={battle} />;
}

function Detail({ battle }: { battle: BattleDetail }) {
  const typeLabel = TYPE_LABEL[battle.type] ?? "—";
  const hasCoords = battle.latitude != null && battle.longitude != null;

  return (
    <main className="detail">
      <div className="detail-breadcrumb">
        <Link to="/battles">Catálogo</Link>
        <Icon name="chevron-right" size={12} />
        <span style={{ color: "var(--color-text-primary)" }}>
          {battle.name}
        </span>
      </div>

      <header className="detail-header">
        <div className="detail-eyebrow">
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <TypeIcon type={battle.type} size={12} /> {typeLabel}
          </span>
        </div>
        <h1 className="detail-title">{battle.name}</h1>
        <div className="detail-meta-row">
          <span className="item">
            <Icon name="calendar" />
            <span className="font-mono">{formatBattleDates(battle)}</span>
          </span>
          {hasCoords && (
            <>
              <span className="item">
                <Icon name="map-pin" />
                <span
                  className="font-mono"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {battle.latitude!.toFixed(2)}, {battle.longitude!.toFixed(2)}
                </span>
              </span>
              <Link to={`/map?focus=${battle.slug}`} className="item btn-link">
                <Icon name="map" size={14} />
                <span>Ver en el mapa</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {battle.summary ? (
        // En la ficha, si no hay imagen simplemente se oculta (sin placeholder):
        // la síntesis pasa a ancho completo.
        <div className={`detail-intro${battle.imageUrl ? '' : ' detail-intro--full'}`}>
          {battle.imageUrl && (
            <div className="detail-intro-media">
              <SmartImage
                src={battle.imageUrl}
                alt={battle.name}
                type={battle.type}
                label={typeLabel}
              />
            </div>
          )}
          <section className="detail-intro-synthesis">
            <div className="detail-outcome-eyebrow">Síntesis</div>
            <div className="detail-outcome-body">
              {battle.summary.split(/\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        </div>
      ) : battle.imageUrl ? (
        <div className="detail-hero-media">
          <SmartImage
            src={battle.imageUrl}
            alt={battle.name}
            type={battle.type}
            label={typeLabel}
          />
        </div>
      ) : null}

      <BattleArticleSection slug={battle.slug} summary={battle.summary} />

      {hasCoords && (
        <section className="detail-section">
          <h2 className="detail-section-title">Ubicación</h2>
          <Link
            to={`/map?focus=${battle.slug}`}
            className="detail-map-link"
            aria-label={`Ver ${battle.name} en el mapa`}
          >
            <BattleMiniMap
              latitude={battle.latitude!}
              longitude={battle.longitude!}
              name={battle.name}
            />
            {/* Capa transparente: garantiza que el clic en el mapa navegue
                (Leaflet captura sus propios eventos). */}
            <span className="detail-map-overlay" aria-hidden="true" />
            <span className="detail-map-cta">
              <Icon name="map" size={14} /> Ver en el mapa
            </span>
          </Link>
        </section>
      )}

      <AiStorySection slug={battle.slug} />

      <RelatedBattles battle={battle} />

      {battle.wikipediaUrl && (
        <section className="detail-section">
          <a
            href={battle.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-link"
          >
            Leer el artículo completo en Wikipedia{" "}
            <Icon name="external" size={12} />
          </a>
        </section>
      )}
    </main>
  );
}

// ── Batallas de la misma época ───────────────────────────────────────────────
// Sustituye a la relación por guerra: batallas en una ventana de ±20 años.

function RelatedBattles({ battle }: { battle: BattleDetail }) {
  const ref = battle.year ?? battle.startYear;
  const fetcher = useCallback(() => {
    if (ref == null) return Promise.resolve(null);
    return battleService.listar({
      yearMin: ref - 20,
      yearMax: ref + 20,
      pageSize: 7,
    });
  }, [ref]);
  const { data } = useApiFetch(fetcher, [ref]);

  const items = (data?.data ?? [])
    .filter((b) => b.slug !== battle.slug)
    .slice(0, 6);
  if (ref == null || items.length === 0) return null;

  return (
    <section className="detail-section">
      <h2 className="detail-section-title">Batallas de la misma época</h2>
      <div className="catalog-grid">
        {items.map((b) => (
          <BattleCard key={b.id} battle={b} />
        ))}
      </div>
    </section>
  );
}

// ── Contexto histórico (Wikipedia) ────────────────────────────────────────
// Extracto completo del artículo de Wikipedia, cacheado en BD al abrir la
// ficha. Da contenido rico a TODAS las batallas sin depender de la IA.

function BattleArticleSection({
  slug,
  summary,
}: {
  slug: string;
  summary: string | null;
}) {
  const fetcher = useCallback(() => battleService.articulo(slug), [slug]);
  const { data, loading } = useApiFetch(fetcher, [slug]);
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <section className="detail-section">
        <h2 className="detail-section-title">Contexto histórico</h2>
        <div className="skeleton" style={{ height: 180 }} />
      </section>
    );
  }

  const text = data?.article?.trim();
  if (!text) return null;

  // La síntesis es el inicio del artículo de Wikipedia: recortamos esos
  // párrafos iniciales para no repetirla aquí.
  const blocks = parseArticleBlocks(stripSummaryOverlap(text, summary));
  if (blocks.length === 0) return null;

  const PREVIEW = 5;
  const shown = expanded ? blocks : blocks.slice(0, PREVIEW);
  const hasMore = blocks.length > PREVIEW;

  return (
    <section className="detail-section">
      <h2 className="detail-section-title">Contexto histórico</h2>
      <div
        className={`detail-article ${!expanded && hasMore ? "is-collapsed" : ""}`}
      >
        {shown.map((b, i) =>
          b.heading ? (
            <h3 key={i} className="detail-article-h">
              {b.text}
            </h3>
          ) : (
            <p key={i}>{b.text}</p>
          ),
        )}
      </div>
      {hasMore && (
        <button
          className="btn btn-ghost detail-article-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Mostrar menos" : "Leer más"}
        </button>
      )}
      <div className="detail-article-source">
        Fuente: artículo de{" "}
        <a
          href={data?.sourceUrl ?? "https://es.wikipedia.org"}
          target="_blank"
          rel="noopener noreferrer"
        >
          Wikipedia
        </a>
      </div>
    </section>
  );
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

// Quita del artículo los párrafos iniciales que ya cubre la síntesis (ambos
// salen del mismo artículo de Wikipedia, así que el inicio coincide).
function stripSummaryOverlap(article: string, summary: string | null): string {
  if (!summary) return article;
  const sumN = normalize(summary).replace(/…$/, "").trim();
  const paras = article.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  let i = 0;
  while (i < paras.length) {
    const probe = normalize(paras[i]).slice(0, 60);
    if (probe.length >= 20 && sumN.includes(probe)) {
      i++;
      continue;
    }
    break;
  }
  return paras.slice(i).join("\n\n");
}

// Convierte el texto plano de Wikipedia en bloques: los "== Título ==" pasan a
// encabezados; el resto, párrafos. Descarta secciones finales sin interés.
function parseArticleBlocks(text: string): { heading: boolean; text: string }[] {
  const SKIP = /^(véase también|referencias|notas|bibliografía|enlaces externos)$/i;
  const out: { heading: boolean; text: string }[] = [];
  for (const raw of text.split(/\n+/)) {
    const p = raw.trim();
    if (!p) continue;
    const h = p.match(/^(={2,})\s*(.+?)\s*\1$/);
    if (h) {
      const title = h[2].trim();
      if (SKIP.test(title)) break; // a partir de aquí, secciones de cierre
      out.push({ heading: true, text: title });
    } else {
      out.push({ heading: false, text: p });
    }
  }
  // Si quedó un encabezado huérfano al final, lo quitamos.
  while (out.length && out[out.length - 1].heading) out.pop();
  return out;
}

// ── Narrativa de IA ───────────────────────────────────────────────────────
// Abierta a todos. Vitrina curada: solo unas pocas batallas tienen narrativa
// ampliada redactada; cuando no existe, no se muestra la sección.

const AI_TABS = [
  { key: "summary", label: "Story Mode" },
  { key: "context", label: "Contexto estratégico" },
  { key: "outcome", label: "Resultado" },
  { key: "curiosities", label: "Curiosidades" },
] as const;

type AiTabKey = (typeof AI_TABS)[number]["key"];

function AiStorySection({ slug }: { slug: string }) {
  const [state, setState] = useState<AIStoryState | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<AiTabKey>("summary");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setState(await aiService.historia(slug));
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    Promise.resolve().then(() => void load());
  }, [load]);

  // Si no hay narrativa aún, ni siquiera mostramos la sección (no hay nada que
  // ofrecer y no se puede pedir su generación).
  if (!loading && (!state || state.kind !== "ready")) return null;

  return (
    <section className="detail-section">
      <h2 className="detail-section-title detail-ai-title">
        Narrativa ampliada
        <span className="detail-ai-badge">IA</span>
      </h2>

      {loading && !state && (
        <div className="skeleton" style={{ height: 160 }} />
      )}

      {state?.kind === "ready" && (
        <div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {AI_TABS.map((t) => (
              <button
                key={t.key}
                className="btn btn-ghost"
                style={
                  tab === t.key
                    ? {
                        background: "var(--color-gold, #b8860b)",
                        color: "var(--color-bg, #0d0d0d)",
                        borderColor: "var(--color-gold, #b8860b)",
                      }
                    : undefined
                }
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="detail-outcome-body">
            {state.story[tab].split(/\n+/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              marginTop: 12,
            }}
          >
            Generado por IA a partir de datos históricos. La precisión no está
            garantizada.{" "}
          </div>
        </div>
      )}
    </section>
  );
}
