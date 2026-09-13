import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AddSubtitlesToMedia from './AddSubtitlesToMedia.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/add-subtitles" element={<AddSubtitlesToMedia />} />

    </Routes>
  </BrowserRouter>
)
