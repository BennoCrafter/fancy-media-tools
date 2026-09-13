import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './pages/Home.tsx'
import AddSubtitlesToMedia from './pages/AddSubtitlesToMedia'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/add-subtitles" element={<AddSubtitlesToMedia />} />
    </Routes>
  </BrowserRouter>
)
