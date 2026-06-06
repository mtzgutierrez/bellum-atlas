import { BrowserRouter, Route, Routes } from 'react-router-dom'
import TopBar from './components/TopBar'
import BattleDetail from './pages/BattleDetail'
import Battles from './pages/Battles'
import Home from './pages/Home'
import MapExplorer from './pages/MapExplorer'

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
        </Routes>
      </div>
    </BrowserRouter>
  )
}
