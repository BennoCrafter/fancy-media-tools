import Tiles from '../components/Tiles'

import { useNavigate } from 'react-router-dom';
import { Subtitles } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full bg-[#f4e8d7] text-[#5a3d24] antialiased">
      {/* Background patterns/tiles */}
      <Tiles />

      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white/40 p-8 backdrop-blur-md shadow-xl border border-[#5a3d24]/10 text-center">

          {/* Header Section */}
          <div className="mb-8 flex flex-col items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-[#5a3d24] sm:text-4xl">
              fancy media tools
            </h1>
          </div>

          {/* Action Button */}
          <div className="mb-8 flex flex-col gap-4">
            <button
              onClick={() => navigate('/add-subtitles')}
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#5a3d24] px-5 py-3.5 font-medium text-[#f4e8d7] shadow-lg shadow-[#5a3d24]/20 transition-all duration-200 hover:bg-[#432d1a] hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5a3d24] focus:ring-offset-2 focus:ring-offset-[#f4e8d7]"
            >
              <Subtitles className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span>add subtitles to image/video</span>
            </button>

            <button
              onClick={() => navigate('/add-subtitles')}
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#5a3d24] px-5 py-3.5 font-medium text-[#f4e8d7] shadow-lg shadow-[#5a3d24]/20 transition-all duration-200 hover:bg-[#432d1a] hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5a3d24] focus:ring-offset-2 focus:ring-offset-[#f4e8d7]"
            >
              <Subtitles className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span>Add Subtitles to Media</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Home
