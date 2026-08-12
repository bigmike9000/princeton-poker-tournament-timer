export async function toggleFullscreen(doc: Document): Promise<void> {
  if (doc.fullscreenElement) {
    if (!doc.exitFullscreen) throw new Error('Fullscreen exit is not supported by this browser.')
    await doc.exitFullscreen()
    return
  }

  if (!doc.documentElement.requestFullscreen) {
    throw new Error('Fullscreen is not supported by this browser.')
  }
  await doc.documentElement.requestFullscreen()
}
