import { useCallback, useEffect, useRef, useState } from 'react'
import Tiles from './components/Tiles'

const isMediaFile = (type: string) => type.startsWith('image/') || type.startsWith('video/')

function AddSubtitlesToMedia() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isInvalidDrag, setIsInvalidDrag] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
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
            {file.type.startsWith('video/') ? (
              <video
                src={previewUrl}
                controls
                autoPlay
                muted
                className="max-h-[75vh] max-w-full rounded-xl bg-black shadow-2xl"
              />
            ) : (
              <img
                src={previewUrl}
                alt={file.name}
                className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            )}
            <div className="flex items-center gap-3">
              <p className="text-[#5a3d24]">{file.name}</p>
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
