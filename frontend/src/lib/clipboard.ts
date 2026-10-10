// Copy text; falls back to a hidden textarea + execCommand when the Clipboard API is unavailable.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.className = 'sr-only'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export const canShare = (): boolean => typeof navigator !== 'undefined' && typeof navigator.share === 'function'

export async function shareText(text: string): Promise<void> {
  try {
    await navigator.share({ text })
  } catch {
    // user cancelled the share sheet
  }
}
