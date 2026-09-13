import { CARD } from '../styles/ui'

interface ExportProgressBarProps {
  progress: number
  label?: string
}

export default function ExportProgressBar({ progress, label = 'Exporting high-quality video…' }: ExportProgressBarProps) {
  return (
    <div className={`flex w-full flex-col gap-1.5 px-4 py-3 ${CARD}`}>
      <span className="text-sm text-[#5a3d24]">
        {label} {Math.round(progress * 100)}%
      </span>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#5a3d24]/10">
        <div
          className="h-full bg-[#8a5a35] transition-[width]"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  )
}
