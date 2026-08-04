import { useCallback, useEffect, useRef, useState } from 'react'
import Tiles from './components/Tiles'

const isMediaFile = (type: string) => type.startsWith('image/') || type.startsWith('video/')

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function AddSubtitlesToMedia() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isInvalidDrag, setIsInvalidDrag] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const drawSubtitles = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = "black"
    ctx.globalAlpha = 0.7

    const paddingLeftRight = 0.1 // in percentage
    const paddingBottom = 0.1 // in percentage
    const subWidth = canvas.width * (1 - paddingLeftRight)
    const subHeight = canvas.height * (0.07)

    ctx.beginPath();
    ctx.roundRect(canvas.width * paddingLeftRight/2, canvas.height - 2 * subHeight, subWidth, subHeight, [20])
    ctx.fill();

    const subtitles = "Hier chillen ist entspannt"
    if (!subtitles) return
    const fontSize = 60
    ctx.fillStyle = 'white'
    ctx.font = `${fontSize}px Arial`
    ctx.textAlign = 'left'
    ctx.fillText(subtitles, canvas.width * paddingLeftRight/2, (canvas.height - 2 * subHeight) + fontSize/2 + subHeight/2, subWidth)
  }, [file])


  const drawVideoFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
  }, [])

  const stopVideoLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startVideoLoop = useCallback(() => {
    stopVideoLoop()
    const tick = () => {
      const video = videoRef.current
      if (!video || video.paused || video.ended) return
      drawVideoFrame()
      setCurrentTime(video.currentTime)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [drawVideoFrame, stopVideoLoop])

  useEffect(() => stopVideoLoop, [stopVideoLoop])

  useEffect(() => {
    setIsPlaying(false)
    setDuration(0)
    setCurrentTime(0)
    setIsMuted(true)
    stopVideoLoop()
  }, [file, stopVideoLoop])

  useEffect(() => {
    if (!file || !previewUrl || !file.type.startsWith('image/')) return
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')?.drawImage(img, 0, 0)
      drawSubtitles()
    }
    img.src = previewUrl
  }, [file, previewUrl])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !file) return
    const baseName = file.name.replace(/\.[^./]+$/, '') || file.name
    const link = document.createElement('a')
    link.download = `${baseName}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [file])

  const showError = useCallback((message: string) => {
    setError(message)
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    errorTimeoutRef.current = setTimeout(() => setError(null), 3000)
  }, [])

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const candidate = files[0]
      if (!isMediaFile(candidate.type)) {
        showError('Only image or video files are supported')
        return
      }
      setError(null)
      setFile(candidate)
    },
    [showError]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      setIsInvalidDrag(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const items = Array.from(e.dataTransfer.items)
    const valid =
      items.length > 0 && items.every((item) => item.kind === 'file' && isMediaFile(item.type))
    e.dataTransfer.dropEffect = valid ? 'copy' : 'none'
    setIsDragging(true)
    setIsInvalidDrag(!valid)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    setIsInvalidDrag(false)
  }, [])

  const clearFile = useCallback(() => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  return (
    <div
      className="relative min-h-screen w-full bg-[#f4e8d7]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <Tiles />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        {file && previewUrl ? (
          <div className="flex w-full max-w-4xl flex-col items-center gap-4">
            {file.type.startsWith('video/') && (
              <video
                ref={videoRef}
                src={previewUrl}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                className="hidden"
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget
                  const canvas = canvasRef.current
                  if (canvas) {
                    canvas.width = video.videoWidth
                    canvas.height = video.videoHeight
                    canvas.getContext('2d')?.drawImage(video, 0, 0)
                  }
                  setDuration(video.duration)
                }}
                onPlay={() => {
                  setIsPlaying(true)
                  startVideoLoop()
                }}
                onPause={() => {
                  setIsPlaying(false)
                  stopVideoLoop()
                }}
                onSeeked={(e) => {
                  drawVideoFrame()
                  setCurrentTime(e.currentTarget.currentTime)
                }}
                onEnded={() => {
                  setIsPlaying(false)
                  stopVideoLoop()
                }}
              />
            )}
            <canvas
              ref={canvasRef}
              className="max-h-[75vh] max-w-full rounded-xl bg-black shadow-2xl"
            />
            {file.type.startsWith('video/') && (
              <div className="flex w-full items-center gap-3 rounded-lg bg-[#eaddc4] px-4 py-2">
                <button
                  type="button"
                  className="rounded bg-[#5a3d24] px-3 py-1 text-sm text-white hover:bg-[#4a3019]"
                  onClick={() => {
                    const video = videoRef.current
                    if (!video) return
                    if (video.paused) video.play()
                    else video.pause()
                  }}
                >
                  {isPlaying ? 'Pause' : 'Play'}
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
                  className="flex-1"
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    setCurrentTime(value)
                    if (videoRef.current) videoRef.current.currentTime = value
                    drawVideoFrame()
                  }}
                />
                <button
                  type="button"
                  className="rounded bg-[#5a3d24] px-3 py-1 text-sm text-white hover:bg-[#4a3019]"
                  onClick={() => setIsMuted((m) => !m)}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <p className="text-[#5a3d24]">{file.name}</p>
              <button
                type="button"
                className="rounded bg-[#5a3d24] px-3 py-1 text-sm text-white hover:bg-[#4a3019]"
                onClick={handleDownload}
              >
                Download frame
              </button>
              <button
                type="button"
                className="rounded bg-[#5a3d24] px-3 py-1 text-sm text-white hover:bg-[#4a3019]"
                onClick={clearFile}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <div
              className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                isDragging
                  ? isInvalidDrag
                    ? 'border-red-500 bg-red-50'
                    : 'border-[#8a5a35] bg-[#eaddc4]'
                  : 'border-[#d3b98e] bg-[#f4e8d7]/80'
              }`}
            >
              <p className="text-[#5a3d24]">
                {isDragging
                  ? isInvalidDrag
                    ? 'Only images or videos are allowed'
                    : 'Drop it here'
                  : 'Drag and drop a media file here'}
              </p>
              <p className="text-sm text-[#8a5a35]">or</p>
              <button
                type="button"
                className="rounded bg-[#5a3d24] px-4 py-2 text-white hover:bg-[#4a3019]"
                onClick={() => inputRef.current?.click()}
              >
                Choose file
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddSubtitlesToMedia
