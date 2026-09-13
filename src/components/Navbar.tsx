import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="relative z-20 flex items-center px-4 py-3">
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-[#5a3d24] transition-colors hover:bg-white/40"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>
    </header>
  )
}
