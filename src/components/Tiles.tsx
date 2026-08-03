import { useEffect, useRef, useState } from 'react'

const TILE_SIZE = 48

interface TilesProps {
  className?: string
}

export default function Tiles({ className = '' }: TilesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [grid, setGrid] = useState({ rows: 0, cols: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateGrid = () => {
      const { width, height } = el.getBoundingClientRect()
      setGrid({
        cols: Math.ceil(width / TILE_SIZE) + 1,
        rows: Math.ceil(height / TILE_SIZE) + 1,
      })
    }

    updateGrid()
    const observer = new ResizeObserver(updateGrid)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden bg-[#f4e8d7] ${className}`}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${grid.rows}, ${TILE_SIZE}px)`,
        }}
      >
        {Array.from({ length: grid.rows * grid.cols }).map((_, i) => (
          <div
            key={i}
            className="border border-[#d3b98e]/50 hover:bg-[#8a5a35] hover:border-[#8a5a35]"
          />
        ))}
      </div>
    </div>
  )
}
