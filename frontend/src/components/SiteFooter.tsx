import { Link } from 'react-router-dom'
import Logo from './Logo'

// Pie de página del sitio. Aclara la naturaleza del proyecto: catálogo de
// batallas nutrido de Wikipedia/Wikidata y narrativas redactadas con IA. No es
// una fuente académica; enlaza siempre a las fuentes originales.
export default function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Logo size={20} />
          <p className="site-footer-tagline">
            Geografía e Historia del Conflicto — atlas interactivo de batallas
            históricas situadas sobre el mapa.
          </p>
        </div>

        <nav className="site-footer-col" aria-label="Navegación">
          <h4>Explorar</h4>
          <Link to="/map">Mapa</Link>
          <Link to="/battles">Buscar batallas</Link>
          <Link to="/timeline">Cronología</Link>
        </nav>

        <nav className="site-footer-col" aria-label="El proyecto">
          <h4>El proyecto</h4>
          <Link to="/about">Acerca de</Link>
          <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer">
            Wikidata
          </a>
          <a href="https://www.wikipedia.org" target="_blank" rel="noopener noreferrer">
            Wikipedia
          </a>
        </nav>

        <div className="site-footer-col">
          <h4>Fuentes y datos</h4>
          <p>
            El catálogo se nutre de Wikidata (listado, fechas y coordenadas) y
            Wikipedia (imágenes y síntesis). Las narrativas extensas están{' '}
            <strong>generadas con IA</strong> y pueden contener errores: contrasta
            siempre con las fuentes originales.{' '}
            <Link to="/about">Más información</Link>.
          </p>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {year} Ares Codex</span>
        <span className="dot">·</span>
        <Link to="/about">Acerca de</Link>
        <span className="dot">·</span>
        <span>Datos: Wikipedia &amp; Wikidata</span>
        <span className="dot">·</span>
        <span>Narrativas: IA</span>
      </div>
    </footer>
  )
}
