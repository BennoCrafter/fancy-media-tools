export type FontOption = { id: string; label: string; family: string; weight: number }

export const FONT_OPTIONS: FontOption[] = [
  { id: 'roboto', label: 'Netflix Style (Roboto)', family: 'Roboto', weight: 700 },
  { id: 'bebas', label: 'Bebas Neue', family: 'Bebas Neue', weight: 400 },
  { id: 'arial', label: 'Classic (Arial Bold)', family: 'Arial', weight: 700 },
]

export type CaptionStyleOption = { id: string; label: string }

export const CAPTION_STYLE_OPTIONS: CaptionStyleOption[] = [
  { id: 'netflix', label: '(netflix with black box)' },
  { id: 'vanilla', label: 'vanilla text' },
  { id: 'vanilla-outline', label: '(vanilla text with outline)' },
]

export const SUBTITLE_SIDE_PADDING_RATIO = 0.1
export const SUBTITLE_BOTTOM_MARGIN_RATIO = 0.06
export const SUBTITLE_FONT_SIZE_RATIO = 0.045
export const SUBTITLE_LINE_HEIGHT_MULTIPLIER = 1.25
export const FONT_SCALE_MIN = 0.5
export const FONT_SCALE_MAX = 2
