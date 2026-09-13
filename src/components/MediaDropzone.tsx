import { Upload } from 'lucide-react'
import { BUTTON_PRIMARY } from '../styles/ui'

interface MediaDropzoneProps {
  isDragging: boolean
  isInvalidDrag: boolean
  error: string | null
  accept: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onFilesSelected: (files: FileList | null) => void
}

export default function MediaDropzone({
  isDragging,
  isInvalidDrag,
  error,
  accept,
  inputRef,
  onFilesSelected,
}: MediaDropzoneProps) {
  return (
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
          accept={accept}
          className="hidden"
          onChange={(e) => onFilesSelected(e.target.files)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
