import Tiles from './components/Tiles'

function App() {
  return (
    <div className="relative min-h-screen w-full bg-[#f4e8d7]">
      <Tiles />
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <h1 className="text-4xl font-semibold text-[#5a3d24]">Hello World</h1>
      </div>
    </div>
  )
}

export default App
