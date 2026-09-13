import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Loader2, Trash2 } from 'lucide-react'
import Tiles from '../../components/Tiles'
import MediaDropzone from '../../components/MediaDropzone'
import VideoPlaybackToolbar from '../../components/VideoPlaybackToolbar'
import ExportProgressBar from '../../components/ExportProgressBar'
import { BUTTON_ACCENT, BUTTON_OUTLINE, BUTTON_PRIMARY } from '../../styles/ui'
import { isMediaFile } from '../../lib/media'
import { FONT_OPTIONS, type FontOption } from './constants'
import { drawSubtitles } from './canvasSubtitles'
import { useVideoExport } from './useVideoExport'
import SubtitleControlsPanel from './SubtitleControlsPanel'

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
  const [subtitleText, setSubtitleText] = useState('')
  const [fontId, setFontId] = useState(FONT_OPTIONS[0].id)
  const [captionStyleId, setCaptionStyleId] = useState('netflix')
  const [fontScale, setFontScale] = useState(1)
  const [customFonts, setCustomFonts] = useState<FontOption[]>([])
  const [isUploadingFont, setIsUploadingFont] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fontUploadRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const allFontOptions = useMemo(() => [...FONT_OPTIONS, ...customFonts], [customFonts])
  const activeFont = allFontOptions.find((f) => f.id === fontId) ?? FONT_OPTIONS[0]

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    Promise.all(FONT_OPTIONS.map((f) => document.fonts.load(`${f.weight} 16px "${f.family}"`))).catch(
      () => {}
    )
  }, [])

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
    drawSubtitles(ctx, canvas, {
      text: subtitleText,
      font: activeFont,
      captionStyleId,
      fontScale,
    })
  }, [file, subtitleText, activeFont, captionStyleId, fontScale])

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
    setIsPlaying(false)
    setDuration(0)
    setCurrentTime(0)
    setIsMuted(true)
    imageRef.current = null
    stopVideoLoop()
  }, [file, stopVideoLoop])

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
    img.src = previewUrl
  }, [file, previewUrl])

  const showError = useCallback((message: string) => {
    setError(message)
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    errorTimeoutRef.current = setTimeout(() => setError(null), 3000)
  }, [])

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

  const handleFontUpload = useCallback(
    async (files: FileList | null) => {
      const uploaded = files?.[0]
      if (!uploaded) return
      setIsUploadingFont(true)
      try {
        const buffer = await uploaded.arrayBuffer()
        const family = `CustomFont-${customFonts.length}-${uploaded.name.replace(/[^a-zA-Z0-9]/g, '')}`
        const face = new FontFace(family, buffer)
        await face.load()
        document.fonts.add(face)
        const label = uploaded.name.replace(/\.[^./]+$/, '') || uploaded.name
        const id = `custom-${family}`
        setCustomFonts((prev) => [...prev, { id, label, family, weight: 400 }])
        setFontId(id)
      } catch {
        showError('Could not load that font file')
      } finally {
        setIsUploadingFont(false)
        if (fontUploadRef.current) fontUploadRef.current.value = ''
      }
    },
    [customFonts.length, showError]
  )

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
              <SubtitleControlsPanel
                subtitleText={subtitleText}
                onSubtitleTextChange={setSubtitleText}
                captionStyleId={captionStyleId}
                onCaptionStyleChange={setCaptionStyleId}
                fontId={fontId}
                onFontChange={setFontId}
                fontOptions={allFontOptions}
                fontScale={fontScale}
                onFontScaleChange={setFontScale}
                isUploadingFont={isUploadingFont}
                onFontUpload={handleFontUpload}
                fontUploadRef={fontUploadRef}
                disabled={isExporting}
              />
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

export default AddSubtitlesToMedia
