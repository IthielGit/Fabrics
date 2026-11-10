/** Convertit une « data URL » (`data:image/png;base64,…`) en fichier. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload = ''] = dataUrl.split(',')
  const mimeType = /data:([^;]+)/.exec(header)?.[1] ?? 'application/octet-stream'
  const bytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0))
  return new Blob([bytes], { type: mimeType })
}
