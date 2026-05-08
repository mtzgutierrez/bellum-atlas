import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import BattleDetail from './pages/BattleDetail'
import Wars, { WarDetailDesktop } from './pages/Wars'
import Timeline from './pages/Timeline'
import Commanders, { CommanderDetailDesktop } from './pages/Commanders'
import MapExplorer from './pages/MapExplorer'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/battles" element={<Catalog />} />
        <Route path="/battles/:id" element={<BattleDetail />} />
        <Route path="/wars" element={<Wars />} />
        <Route path="/wars/:id" element={<WarDetailDesktop />} />
        <Route path="/commanders" element={<Commanders />} />
        <Route path="/commanders/:id" element={<CommanderDetailDesktop />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/map" element={<MapExplorer />} />
      </Routes>
    </BrowserRouter>
  )
}
