const MEDIA_EXTENSION_RE =
  /\.(jpe?g|png|gif|webp|bmp|avif|heic|heif|mp4|mov|webm|m4v|3gp|avi|mkv)$/i

// Some mobile browsers (notably iOS Safari for certain capture flows) hand back an
// empty File.type — fall back to the file extension so those uploads aren't rejected.
export const isMediaFile = (type: string, name = '') =>
  type.startsWith('image/') || type.startsWith('video/') || (!type && MEDIA_EXTENSION_RE.test(name))

export const isHeicFile = (file: File) =>
  /^image\/hei(c|f)/.test(file.type) || /\.hei[cf]$/i.test(file.name)

export const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
