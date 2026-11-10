/** Fait télécharger un fichier par le navigateur (sans serveur : le fichier reste sur l'appareil). */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // On laisse au navigateur le temps de démarrer le téléchargement avant de libérer l'adresse.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
