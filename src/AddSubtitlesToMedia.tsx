import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Loader2, Pause, Play, Trash2, Upload, Volume2, VolumeX } from 'lucide-react'
import Tiles from './components/Tiles'

const CARD = 'rounded-2xl border border-[#5a3d24]/10 bg-white/40 shadow-xl backdrop-blur-md'
const FIELD =
  'rounded-xl border border-[#5a3d24]/20 bg-white/70 px-3 py-2 text-sm text-[#5a3d24] placeholder-[#8a5a35]/50 outline-none transition-colors focus:border-[#5a3d24] focus:ring-2 focus:ring-[#5a3d24]/30 disabled:cursor-not-allowed disabled:opacity-50'
const BUTTON_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#5a3d24] px-4 py-2 text-sm font-medium text-[#f4e8d7] shadow-lg shadow-[#5a3d24]/20 transition-all duration-200 hover:bg-[#432d1a] hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5a3d24] focus:ring-offset-2 focus:ring-offset-[#f4e8d7] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'
const BUTTON_ACCENT =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#8a5a35] px-4 py-2 text-sm font-medium text-[#f4e8d7] shadow-lg shadow-[#8a5a35]/20 transition-all duration-200 hover:bg-[#6f4726] hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#8a5a35] focus:ring-offset-2 focus:ring-offset-[#f4e8d7] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'
const BUTTON_OUTLINE =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[#5a3d24]/30 bg-white/40 px-4 py-2 text-sm font-medium text-[#5a3d24] backdrop-blur-md transition-all duration-200 hover:bg-white/70 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#5a3d24]/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'
const ICON_BUTTON =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5a3d24] text-[#f4e8d7] transition-colors hover:bg-[#432d1a] disabled:cursor-not-allowed disabled:opacity-50'

const isMediaFile = (type: string) => type.startsWith('image/') || type.startsWith('video/')

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

type FontOption = { id: string; label: string; family: string; weight: number }

const FONT_OPTIONS: FontOption[] = [
  { id: 'roboto', label: 'Netflix Style (Roboto)', family: 'Roboto', weight: 700 },
  { id: 'bebas', label: 'Bebas Neue', family: 'Bebas Neue', weight: 400 },
  { id: 'arial', label: 'Classic (Arial Bold)', family: 'Arial', weight: 700 },
]

type CaptionStyleOption = { id: string; label: string }

const CAPTION_STYLE_OPTIONS: CaptionStyleOption[] = [
  { id: 'netflix', label: '(netflix with black box)' },
  { id: 'vanilla', label: 'vanilla text' },
  { id: 'vanilla-outline', label: '(vanilla text with outline)' },
]

const SUBTITLE_SIDE_PADDING_RATIO = 0.1
const SUBTITLE_BOTTOM_MARGIN_RATIO = 0.06
const SUBTITLE_FONT_SIZE_RATIO = 0.045
const SUBTITLE_LINE_HEIGHT_MULTIPLIER = 1.25
const FONT_SCALE_MIN = 0.5
const FONT_SCALE_MAX = 2

const wrapSubtitleText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(' ')
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (current && ctx.measureText(candidate).width > maxWidth) {
        lines.push(current)
        current = word
      } else {
        current = candidate
      }
    }
    lines.push(current)
  }
  return lines
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
  const [subtitleText, setSubtitleText] = useState('')
  const [fontId, setFontId] = useState(FONT_OPTIONS[0].id)
  const [captionStyleId, setCaptionStyleId] = useState(CAPTION_STYLE_OPTIONS[0].id)
  const [fontScale, setFontScale] = useState(1)
  const [customFonts, setCustomFonts] = useState<FontOption[]>([])
  const [isUploadingFont, setIsUploadingFont] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
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

  const drawSubtitles = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const text = subtitleText.trim()
      if (!text) return

      const fontSize = Math.max(canvas.height * SUBTITLE_FONT_SIZE_RATIO * fontScale, 12)
      const lineHeight = fontSize * SUBTITLE_LINE_HEIGHT_MULTIPLIER
      const maxWidth = canvas.width * (1 - SUBTITLE_SIDE_PADDING_RATIO * 2)

      ctx.font = `${activeFont.weight} ${fontSize}px "${activeFont.family}", "Helvetica Neue", Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'

      const lines = wrapSubtitleText(ctx, text, maxWidth)
      const bottomY = canvas.height * (1 - SUBTITLE_BOTTOM_MARGIN_RATIO)
      const startY = bottomY - (lines.length - 1) * lineHeight

      if (captionStyleId === 'netflix') {
        const paddingX = fontSize * 0.5
        const paddingY = fontSize * 0.3
        const ascent = fontSize * 0.85
        const descent = fontSize * 0.25
        const widestLine = Math.max(...lines.map((line) => ctx.measureText(line).width))
        const boxWidth = widestLine + paddingX * 2
        const boxTop = startY - ascent - paddingY
        const boxBottom = bottomY + descent + paddingY

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
        ctx.beginPath()
        ctx.roundRect(canvas.width / 2 - boxWidth / 2, boxTop, boxWidth, boxBottom - boxTop, [8])
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        lines.forEach((line, i) => {
          ctx.fillText(line, canvas.width / 2, startY + i * lineHeight)
        })
        return
      }

      if (captionStyleId === 'vanilla-outline') {
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2
        ctx.lineWidth = fontSize * 0.09
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)'
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
        ctx.shadowBlur = fontSize * 0.12
        ctx.shadowOffsetY = fontSize * 0.03
      } else {
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2
        ctx.lineWidth = fontSize * 0.09
        ctx.strokeStyle = 'rgba(0, 0, 0, 0)'
        ctx.fillStyle = '#ffffff'
        ctx.shadowOffsetY = fontSize * 0.03
      }

      lines.forEach((line, i) => {
        const y = startY + i * lineHeight
        ctx.strokeText(line, canvas.width / 2, y)
        ctx.fillText(line, canvas.width / 2, y)
      })

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    },
    [subtitleText, activeFont, captionStyleId, fontScale]
  )

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
    drawSubtitles(ctx, canvas)
  }, [file, drawSubtitles])

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

  const handleExportVideo = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !file || isExporting) return

    if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
      showError('Video export is not supported in this browser')
      return
    }

    const wasLoop = video.loop
    video.loop = false
    video.pause()
    stopVideoLoop()

    const captureAudioTracks = (el: HTMLVideoElement): MediaStreamTrack[] => {
      try {
        type CaptureCapable = HTMLVideoElement & { captureStream?: () => MediaStream }
        return (el as CaptureCapable).captureStream?.().getAudioTracks() ?? []
      } catch {
        return []
      }
    }

    const fps = 30
    const canvasStream = canvas.captureStream(fps)
    const audioTracks = captureAudioTracks(video)
    const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks])

    const mimeCandidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ]
    const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''

    // High-quality target bitrate scaled to resolution (roughly 0.12 bits/pixel/frame at 30fps).
    const pixelCount = canvas.width * canvas.height
    const videoBitsPerSecond = Math.min(Math.max(pixelCount * 0.12, 4_000_000), 50_000_000)

    const recorder = new MediaRecorder(combinedStream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond,
    })
    const chunks: BlobPart[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    const cleanup = () => {
      combinedStream.getTracks().forEach((t) => t.stop())
      video.loop = wasLoop
      setIsExporting(false)
      setExportProgress(0)
      renderFrameRef.current()
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' })
      const baseName = file.name.replace(/\.[^./]+$/, '') || file.name
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${baseName}-subtitled.webm`
      link.href = url
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      cleanup()
    }

    const tick = () => {
      if (video.paused || video.ended) return
      renderFrameRef.current()
      setCurrentTime(video.currentTime)
      setExportProgress(video.duration ? video.currentTime / video.duration : 0)
      rafRef.current = requestAnimationFrame(tick)
    }

    video.addEventListener(
      'ended',
      () => {
        if (recorder.state !== 'inactive') recorder.stop()
      },
      { once: true }
    )

    setIsExporting(true)
    setExportProgress(0)
    video.currentTime = 0
    await video.play()
    recorder.start()
    rafRef.current = requestAnimationFrame(tick)
  }, [file, isExporting, showError, stopVideoLoop])

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
                  <div className={`flex w-full items-center gap-3 px-4 py-3 ${CARD}`}>
                    <button
                      type="button"
                      disabled={isExporting}
                      className={ICON_BUTTON}
                      onClick={() => {
                        const video = videoRef.current
                        if (!video) return
                        if (video.paused) video.play()
                        else video.pause()
                      }}
                    >
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
                      disabled={isExporting}
                      className="flex-1 accent-[#5a3d24] disabled:opacity-50"
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setCurrentTime(value)
                        if (videoRef.current) videoRef.current.currentTime = value
                        renderFrameRef.current()
                      }}
                    />
                    <button
                      type="button"
                      disabled={isExporting}
                      className={ICON_BUTTON}
                      onClick={() => setIsMuted((m) => !m)}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  </div>
                )}
                {isExporting && (
                  <div className={`flex w-full flex-col gap-1.5 px-4 py-3 ${CARD}`}>
                    <span className="text-sm text-[#5a3d24]">
                      Exporting high-quality video… {Math.round(exportProgress * 100)}%
                    </span>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#5a3d24]/10">
                      <div
                        className="h-full bg-[#8a5a35] transition-[width]"
                        style={{ width: `${Math.round(exportProgress * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex w-full flex-col gap-4 lg:w-80 xl:w-96">
              <p className="truncate px-5 text-sm text-[#5a3d24]/70">{file.name}</p>
              <div className={`flex w-full flex-col gap-4 p-5 ${CARD}`}>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium tracking-wide text-[#5a3d24]/70 uppercase">
                    Subtitle
                  </label>
                  <textarea
                    value={subtitleText}
                    onChange={(e) => setSubtitleText(e.target.value)}
                    placeholder="Type your subtitle… (Enter for a new line)"
                    rows={2}
                    disabled={isExporting}
                    className={`w-full resize-none ${FIELD} overflow-hidden`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium tracking-wide text-[#5a3d24]/70 uppercase">
                      Style
                    </label>
                    <select
                      value={captionStyleId}
                      onChange={(e) => setCaptionStyleId(e.target.value)}
                      disabled={isExporting}
                      className={FIELD}
                    >
                      {CAPTION_STYLE_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium tracking-wide text-[#5a3d24]/70 uppercase">
                      Font
                    </label>
                    <select
                      value={fontId}
                      onChange={(e) => setFontId(e.target.value)}
                      disabled={isExporting}
                      className={FIELD}
                    >
                      {allFontOptions.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium tracking-wide text-[#5a3d24]/70 uppercase">
                      Size {Math.round(fontScale * 100)}%
                    </label>
                    <input
                      type="range"
                      min={FONT_SCALE_MIN}
                      max={FONT_SCALE_MAX}
                      step={0.05}
                      value={fontScale}
                      disabled={isExporting}
                      className="mt-2 accent-[#5a3d24] disabled:opacity-50"
                      onChange={(e) => setFontScale(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium tracking-wide text-[#5a3d24]/70 uppercase">
                      Custom font
                    </label>
                    <button
                      type="button"
                      disabled={isExporting || isUploadingFont}
                      className={`${BUTTON_OUTLINE} w-full whitespace-nowrap px-3 py-2 text-xs`}
                      onClick={() => fontUploadRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5 shrink-0" />
                      {isUploadingFont ? 'Loading…' : 'Upload'}
                    </button>
                    <input
                      ref={fontUploadRef}
                      type="file"
                      accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                      className="hidden"
                      onChange={(e) => handleFontUpload(e.target.files)}
                    />
                  </div>
                </div>
              </div>
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
          <div className="w-full max-w-lg">
            <div
              className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed p-10 text-center backdrop-blur-md transition-colors ${
                isDragging
                  ? isInvalidDrag
                    ? 'rounded-2xl border-red-500 bg-red-50/70 shadow-xl'
                    : 'rounded-2xl border-[#8a5a35] bg-white/60 shadow-xl'
                  : `rounded-2xl border-[#5a3d24]/20 bg-white/40 shadow-xl`
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
              <button type="button" className={BUTTON_PRIMARY} onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" />
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
