import Tiles from './components/Tiles'
import { useNavigate } from 'react-router-dom'

function App() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen w-full bg-[#f4e8d7]">
      <Tiles />
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div>
          <h1 className="text-4xl font-semibold text-[#5a3d24]">some fancy media tools</h1>
          <button className="bg-[#5a3d24] text-white px-4 py-2 rounded" onClick={() => navigate('/add-subtitles')}>
            add subtitles to media
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
