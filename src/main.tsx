import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './pages/Home.tsx'
import AddSubtitlesToMedia from './pages/AddSubtitlesToMedia'
import ChangeCapture from './pages/ChangeCapture'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/add-subtitles" element={<AddSubtitlesToMedia />} />
      <Route path="/change-capture" element={<ChangeCapture />} />
    </Routes>
  </BrowserRouter>
)
