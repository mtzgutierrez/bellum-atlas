import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

// Página "Acerca de": explica qué es el proyecto, de dónde salen los datos y
// cómo se generan las narrativas. Accesible desde el footer.
export default function About() {
  return (
    <main className="about">
      <div className="detail-breadcrumb">
        <Link to="/">Inicio</Link>
        <Icon name="chevron-right" size={12} />
        <span style={{ color: 'var(--color-text-primary)' }}>Acerca de</span>
      </div>

      <header className="about-header">
        <div className="about-eyebrow">Acerca del proyecto</div>
        <h1 className="about-title">Geografía e Historia del Conflicto</h1>
        <p className="about-lede">
          Bellum Atlas es un atlas interactivo de batallas históricas: las sitúa
          sobre el mapa, las ordena en el tiempo y las acompaña de contexto para
          que explorar la historia militar sea claro y visual.
        </p>
      </header>

      <section className="about-section">
        <h2 className="about-section-title">Qué encontrarás</h2>
        <p>
          Un catálogo de batallas, asedios y campañas con su ubicación, sus
          fechas y una síntesis de cada una. Puedes explorarlas en un{' '}
          <Link to="/map">mapa interactivo</Link>, recorrerlas por épocas en la{' '}
          <Link to="/timeline">cronología</Link> o{' '}
          <Link to="/battles">buscarlas</Link> por nombre.
        </p>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">De dónde salen los datos</h2>
        <p>
          El listado de batallas, sus fechas y sus coordenadas se obtienen de{' '}
          <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer">
            Wikidata
          </a>
          , la base de conocimiento estructurada de la Fundación Wikimedia. Las
          imágenes y los textos de síntesis proceden de{' '}
          <a href="https://www.wikipedia.org" target="_blank" rel="noopener noreferrer">
            Wikipedia
          </a>
          .
        </p>
        <p>
          Estos contenidos se publican bajo licencias libres (CC&nbsp;BY-SA para
          Wikipedia y CC0 para los datos de Wikidata). Su uso en este sitio no
          implica que sus autores o la Fundación Wikimedia respalden el proyecto.
          Cada ficha enlaza a su artículo original para que puedas ampliar y
          contrastar.
        </p>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">Las narrativas por IA</h2>
        <p>
          Las piezas extensas de cada batalla —relato, contexto estratégico,
          desenlace y curiosidades, bajo el rótulo «Narrativa por IA»— están{' '}
          <strong>redactadas con inteligencia artificial</strong> a partir del
          material de Wikipedia y de conocimiento histórico general.
        </p>
        <p>
          Aunque se busca el rigor, la IA puede cometer errores, simplificar o
          confundir datos. Trata estas narrativas como una introducción
          divulgativa, no como una fuente académica, y contrasta siempre con las
          fuentes originales antes de citarlas.
        </p>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">Naturaleza del proyecto</h2>
        <p>
          Bellum Atlas es un proyecto divulgativo y educativo, sin gamificación ni
          estadísticas inventadas: solo los hechos situados sobre el mapa, con su
          fecha y sus bandos. El sitio puede incluir publicidad o funciones de
          pago para sostener su desarrollo y mantenimiento.
        </p>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">Contacto</h2>
        <p>
          ¿Has visto un error en una batalla o quieres proponer una mejora?
          Escríbenos a{' '}
          <a href="mailto:raulmartinezz402@gmail.com">raulmartinezz402@gmail.com</a>
          .
        </p>
      </section>
    </main>
  )
}
