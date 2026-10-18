/** Browser-only wallpaper persistence, keeping image bytes out of Host requests. */
/**
 * Read or replace this browser's custom wallpaper.
 * @param value - Omit to read, pass null to clear, or pass a Blob to save.
 * @returns The stored image, or null when no custom wallpaper is selected.
 */
export async function wallpaperStorage(value?: Blob | null): Promise<Blob | null> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open('dsh-glass-skin', 1)
    open.onupgradeneeded = () => { open.result.createObjectStore('settings') }
    open.onsuccess = () => { resolve(open.result) }
    open.onerror = () => { reject(open.error ?? new Error('Wallpaper database could not be opened')) }
  })
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction('settings', value === undefined ? 'readonly' : 'readwrite')
      const store = tx.objectStore('settings')
      const request = value === undefined ? store.get('wallpaper') : value === null ? store.delete('wallpaper') : store.put(value, 'wallpaper')
      tx.oncomplete = () => { resolve(value === undefined && request.result instanceof Blob ? request.result : value ?? null) }
      tx.onerror = () => { reject(tx.error ?? new Error('Wallpaper storage failed')) }
      tx.onabort = () => { reject(tx.error ?? new Error('Wallpaper storage was aborted')) }
    })
  } finally { db.close() }
}
/**
 * Compress one browser-selected image for local storage.
 * @param file - Browser-selected raster image.
 * @returns Locally resized WebP image.
 */
export async function compressWallpaper(file: File): Promise<Blob> {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'].includes(file.type)) throw new Error('Choose a PNG, JPEG, WebP, AVIF or GIF image')
  const image = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 2560 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale)
    const drawing = canvas.getContext('2d')
    if (drawing === null) throw new Error('2D canvas is unavailable')
    drawing.drawImage(image, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Image encoding failed')) }, 'image/webp', .8)
    })
  } finally { image.close() }
}
