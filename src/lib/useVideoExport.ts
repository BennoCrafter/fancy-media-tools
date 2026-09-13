import { useCallback, useState } from 'react'

interface UseVideoExportOptions {
  file: File | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  renderFrame: () => void
  stopVideoLoop: () => void
  setCurrentTime: (time: number) => void
  onError: (message: string) => void
}

const captureAudioTracks = (el: HTMLVideoElement): MediaStreamTrack[] => {
  try {
    type CaptureCapable = HTMLVideoElement & { captureStream?: () => MediaStream }
    return (el as CaptureCapable).captureStream?.().getAudioTracks() ?? []
  } catch {
    return []
  }
}

const VIDEO_MIME_CANDIDATES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']

export function useVideoExport({
  file,
  videoRef,
  canvasRef,
  renderFrame,
  stopVideoLoop,
  setCurrentTime,
  onError,
}: UseVideoExportOptions) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const handleExportVideo = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !file || isExporting) return

    if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
      onError('Video export is not supported in this browser')
      return
    }

    const wasLoop = video.loop
    video.loop = false
    video.pause()
    stopVideoLoop()

    const fps = 30
    const canvasStream = canvas.captureStream(fps)
    const audioTracks = captureAudioTracks(video)
    const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks])

    const mimeType = VIDEO_MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''

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

    let rafId: number | null = null

    const cleanup = () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      combinedStream.getTracks().forEach((t) => t.stop())
      video.loop = wasLoop
      setIsExporting(false)
      setExportProgress(0)
      renderFrame()
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
      renderFrame()
      setCurrentTime(video.currentTime)
      setExportProgress(video.duration ? video.currentTime / video.duration : 0)
      rafId = requestAnimationFrame(tick)
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
    rafId = requestAnimationFrame(tick)
  }, [file, isExporting, videoRef, canvasRef, renderFrame, stopVideoLoop, setCurrentTime, onError])

  return { isExporting, exportProgress, handleExportVideo }
}
