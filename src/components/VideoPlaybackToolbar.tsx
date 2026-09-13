import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { CARD, ICON_BUTTON } from '../styles/ui'
import { formatTime } from '../lib/media'

interface VideoPlaybackToolbarProps {
  isPlaying: boolean
  isMuted: boolean
  currentTime: number
  duration: number
  disabled?: boolean
  onTogglePlay: () => void
  onToggleMute: () => void
  onSeek: (time: number) => void
}

export default function VideoPlaybackToolbar({
  isPlaying,
  isMuted,
  currentTime,
  duration,
  disabled,
  onTogglePlay,
  onToggleMute,
  onSeek,
}: VideoPlaybackToolbarProps) {
  return (
    <div className={`flex w-full items-center gap-3 px-4 py-3 ${CARD}`}>
      <button type="button" disabled={disabled} className={ICON_BUTTON} onClick={onTogglePlay}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <span className="text-sm tabular-nums text-[#5a3d24]">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={currentTime}
        disabled={disabled}
        className="flex-1 accent-[#5a3d24] disabled:opacity-50"
        onChange={(e) => onSeek(Number(e.target.value))}
      />
      <button type="button" disabled={disabled} className={ICON_BUTTON} onClick={onToggleMute}>
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  )
}
