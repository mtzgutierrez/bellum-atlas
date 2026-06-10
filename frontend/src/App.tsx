import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import SiteFooter from './components/SiteFooter'
import TopBar from './components/TopBar'
import About from './pages/About'
import BattleDetail from './pages/BattleDetail'
import Battles from './pages/Battles'
import Home from './pages/Home'
import MapExplorer from './pages/MapExplorer'
import Timeline from './pages/Timeline'

export default function App() {
  return (
    <BrowserRouter>
      <TopBar />
      <div className="shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapExplorer />} />
          <Route path="/battles" element={<Battles />} />
          <Route path="/battles/:id" element={<BattleDetail />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
      <FooterSlot />
    </BrowserRouter>
  )
}

// El footer aparece en todas las páginas de contenido, pero NO en el mapa, que
// ocupa el alto completo de la ventana.
function FooterSlot() {
  const { pathname } = useLocation()
  if (pathname === '/map') return null
  return <SiteFooter />
}
