import {
  SUBTITLE_BOTTOM_MARGIN_RATIO,
  SUBTITLE_FONT_SIZE_RATIO,
  SUBTITLE_LINE_HEIGHT_MULTIPLIER,
  SUBTITLE_SIDE_PADDING_RATIO,
  type FontOption,
} from './constants'

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

export type DrawSubtitlesOptions = {
  text: string
  font: FontOption
  captionStyleId: string
  fontScale: number
}

export const drawSubtitles = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  { text, font, captionStyleId, fontScale }: DrawSubtitlesOptions
) => {
  const trimmed = text.trim()
  if (!trimmed) return

  const fontSize = Math.max(canvas.height * SUBTITLE_FONT_SIZE_RATIO * fontScale, 12)
  const lineHeight = fontSize * SUBTITLE_LINE_HEIGHT_MULTIPLIER
  const maxWidth = canvas.width * (1 - SUBTITLE_SIDE_PADDING_RATIO * 2)

  ctx.font = `${font.weight} ${fontSize}px "${font.family}", "Helvetica Neue", Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  const lines = wrapSubtitleText(ctx, trimmed, maxWidth)
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
}
