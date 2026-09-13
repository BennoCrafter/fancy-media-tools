import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Loader2, Trash2 } from 'lucide-react'
import Tiles from '../../components/Tiles'
import Navbar from '../../components/Navbar'
import MediaDropzone from '../../components/MediaDropzone'
import VideoPlaybackToolbar from '../../components/VideoPlaybackToolbar'
import ExportProgressBar from '../../components/ExportProgressBar'
import { BUTTON_ACCENT, BUTTON_OUTLINE, BUTTON_PRIMARY } from '../../styles/ui'
import { isHeicFile, isMediaFile } from '../../lib/media'
import { useVideoExport } from '../../lib/useVideoExport'

function ChangeCapture() {
  const [file, setFile] = useState<File | null>(null)
  const [prevFile, setPrevFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isInvalidDrag, setIsInvalidDrag] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [subtitleText, setSubtitleText] = useState('')
  const [captionStyleId, setCaptionStyleId] = useState('netflix')
  const [fontScale, setFontScale] = useState(1)

  const [isUploadingFont, setIsUploadingFont] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fontUploadRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Reset transient playback state synchronously during render when the file prop
  // changes, per https://react.dev/learn/you-might-not-need-an-effect — avoids the
  // extra commit an effect-based reset would cause.
  if (file !== prevFile) {
    setPrevFile(file)
    setIsPlaying(false)
    setDuration(0)
    setCurrentTime(0)
    setIsMuted(true)
  }


  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (file?.type.startsWith('video/')) {
      const video = videoRef.current
      if (video) ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    } else if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0)
    } else {
      return
    }

  }, [file])

  const renderFrameRef = useRef(renderFrame)
  useEffect(() => {
    renderFrameRef.current = renderFrame
    renderFrame()
  }, [renderFrame])

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
      renderFrameRef.current()
      setCurrentTime(video.currentTime)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [stopVideoLoop])

  useEffect(() => stopVideoLoop, [stopVideoLoop])

  useEffect(() => {
    imageRef.current = null
    stopVideoLoop()
  }, [file, stopVideoLoop])

  const showError = useCallback((message: string) => {
    setError(message)
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    errorTimeoutRef.current = setTimeout(() => setError(null), 3000)
  }, [])

  useEffect(() => {
    if (!file || !previewUrl || !file.type.startsWith('image/')) return
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      imageRef.current = img
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      renderFrameRef.current()
    }
    img.onerror = () => {
      showError(
        isHeicFile(file)
          ? 'HEIC photos from iPhone aren’t supported by this browser. In Settings > Camera > Formats, choose "Most Compatible", or share/export the photo as JPEG first.'
          : 'Could not load that image'
      )
      setFile(null)
    }
    img.src = previewUrl
  }, [file, previewUrl, showError])

  const { isExporting, exportProgress, handleExportVideo } = useVideoExport({
    file,
    videoRef,
    canvasRef,
    renderFrame: () => renderFrameRef.current(),
    stopVideoLoop,
    setCurrentTime,
    onError: showError,
  })

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !file) return
    const baseName = file.name.replace(/\.[^./]+$/, '') || file.name
    const link = document.createElement('a')
    link.download = `${baseName}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [file])

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const candidate = files[0]
      if (!isMediaFile(candidate.type, candidate.name)) {
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
      className="relative flex min-h-screen w-full flex-col bg-[#f4e8d7]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <Tiles />
      <Navbar />
      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        {file && previewUrl ? (
          <div className="flex w-full max-w-6xl flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex flex-1 flex-col items-center gap-4">
              <div className="flex w-fit max-w-full flex-col items-stretch gap-4">
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
                      }
                      setDuration(video.duration)
                      renderFrameRef.current()
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
                      renderFrameRef.current()
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
                  <VideoPlaybackToolbar
                    isPlaying={isPlaying}
                    isMuted={isMuted}
                    currentTime={currentTime}
                    duration={duration}
                    disabled={isExporting}
                    onTogglePlay={() => {
                      const video = videoRef.current
                      if (!video) return
                      if (video.paused) video.play()
                      else video.pause()
                    }}
                    onToggleMute={() => setIsMuted((m) => !m)}
                    onSeek={(value) => {
                      setCurrentTime(value)
                      if (videoRef.current) videoRef.current.currentTime = value
                      renderFrameRef.current()
                    }}
                  />
                )}
                {isExporting && <ExportProgressBar progress={exportProgress} />}
              </div>
            </div>
            <div className="flex w-full flex-col gap-4 lg:w-80 xl:w-96">
              <p className="truncate px-5 text-sm text-[#5a3d24]/70">{file.name}</p>
              Hello
              <div className="flex w-full flex-col gap-3">
                {file.type.startsWith('video/') && (
                  <button
                    type="button"
                    disabled={isExporting}
                    className={`${BUTTON_ACCENT} w-full`}
                    onClick={handleExportVideo}
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isExporting ? 'Exporting…' : 'Export video (HQ)'}
                  </button>
                )}
                <button
                  type="button"
                  disabled={isExporting}
                  className={`${BUTTON_PRIMARY} w-full`}
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  {file.type.startsWith('image/') ? 'Download image' : 'Download frame'}
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  className={`${BUTTON_OUTLINE} w-full`}
                  onClick={clearFile}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <MediaDropzone
            isDragging={isDragging}
            isInvalidDrag={isInvalidDrag}
            error={error}
            accept="video/*,image/*"
            inputRef={inputRef}
            onFilesSelected={handleFiles}
          />
        )}
      </div>
    </div>
  )
}

export default ChangeCapture
