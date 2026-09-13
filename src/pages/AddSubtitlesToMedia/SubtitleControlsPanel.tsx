import { Upload } from 'lucide-react'
import { BUTTON_OUTLINE, CARD, FIELD } from '../../styles/ui'
import {
  CAPTION_STYLE_OPTIONS,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  type FontOption,
} from './constants'

interface SubtitleControlsPanelProps {
  subtitleText: string
  onSubtitleTextChange: (value: string) => void
  captionStyleId: string
  onCaptionStyleChange: (value: string) => void
  fontId: string
  onFontChange: (value: string) => void
  fontOptions: FontOption[]
  fontScale: number
  onFontScaleChange: (value: number) => void
  isUploadingFont: boolean
  onFontUpload: (files: FileList | null) => void
  fontUploadRef: React.RefObject<HTMLInputElement | null>
  disabled: boolean
}

export default function SubtitleControlsPanel({
  subtitleText,
  onSubtitleTextChange,
  captionStyleId,
  onCaptionStyleChange,
  fontId,
  onFontChange,
  fontOptions,
  fontScale,
  onFontScaleChange,
  isUploadingFont,
  onFontUpload,
  fontUploadRef,
  disabled,
}: SubtitleControlsPanelProps) {
  return (
    <div className={`flex w-full flex-col gap-4 p-5 ${CARD}`}>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium tracking-wide text-[#5a3d24]/70 uppercase">Subtitle</label>
        <textarea
          value={subtitleText}
          onChange={(e) => onSubtitleTextChange(e.target.value)}
          placeholder="Type your subtitle… (Enter for a new line)"
          rows={2}
          disabled={disabled}
          className={`w-full resize-none ${FIELD} overflow-hidden`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium tracking-wide text-[#5a3d24]/70 uppercase">Style</label>
          <select
            value={captionStyleId}
            onChange={(e) => onCaptionStyleChange(e.target.value)}
            disabled={disabled}
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
          <label className="text-xs font-medium tracking-wide text-[#5a3d24]/70 uppercase">Font</label>
          <select
            value={fontId}
            onChange={(e) => onFontChange(e.target.value)}
            disabled={disabled}
            className={FIELD}
          >
            {fontOptions.map((f) => (
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
            disabled={disabled}
            className="mt-2 accent-[#5a3d24] disabled:opacity-50"
            onChange={(e) => onFontScaleChange(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium tracking-wide text-[#5a3d24]/70 uppercase">Custom font</label>
          <button
            type="button"
            disabled={disabled || isUploadingFont}
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
            onChange={(e) => onFontUpload(e.target.files)}
          />
        </div>
      </div>
    </div>
  )
}
