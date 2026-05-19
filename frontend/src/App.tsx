import { BrowserRouter, Route, Routes } from 'react-router-dom'
import TopBar from './components/TopBar'
import BattleDetail from './pages/BattleDetail'
import Battles from './pages/Battles'
import CommanderDetail from './pages/CommanderDetail'
import Commanders from './pages/Commanders'
import Home from './pages/Home'
import MapExplorer from './pages/MapExplorer'
import WarDetail from './pages/WarDetail'
import Wars from './pages/Wars'

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
          <Route path="/wars" element={<Wars />} />
          <Route path="/wars/:id" element={<WarDetail />} />
          <Route path="/commanders" element={<Commanders />} />
          <Route path="/commanders/:id" element={<CommanderDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
