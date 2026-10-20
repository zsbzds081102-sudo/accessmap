import type { Lang } from './i18n'

const SOUND_KEY = 'accessmap-sound'

/** Voice is on unless the visitor turned it off. */
export function loadSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}

export function storeSound(on: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
  } catch {
    // Private mode: the choice just does not persist.
  }
}

export function speak(text: string, lang: Lang, enabled = true): void {
  if (!enabled) return
  if (!text.trim() || typeof window === 'undefined' || !window.speechSynthesis) return
  if (typeof SpeechSynthesisUtterance === 'undefined') return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
    utterance.rate = 1
    window.speechSynthesis.speak(utterance)
  } catch {
    // Speech is an enhancement; a blocked voice must not break the map.
  }
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
}
