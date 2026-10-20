import type { Lang } from './i18n'

const SOUND_KEY = 'accessmap-sound'
const DEBOUNCE_MS = 420
const KEEPALIVE_MS = 280
const VOICE_RETRY_MS = 160
const VOICE_RETRIES = 4

type SpeechRequest = {
  text: string
  lang: Lang
  interrupt: boolean
}

/**
 * Speech is a small state machine rather than a raw speechSynthesis call.
 * Chrome cancels/restarts audibly, so a location update must never cut off a
 * sentence that is already being spoken: it is queued and spoken after the
 * current utterance ends. Explicit user actions (choosing a place, changing
 * language, pressing a control) pass interrupt=true and may restart.
 */
let activeUtterance: SpeechSynthesisUtterance | null = null
let activeText = ''
let activeLang: Lang | null = null
let pending: SpeechRequest | null = null
let queued: SpeechRequest | null = null
let debounceTimer: number | null = null
let gapTimer: number | null = null
let keepAliveTimer: number | null = null
let speechToken = 0
let cachedVoices: SpeechSynthesisVoice[] = []
let voiceListenerBound = false

function getSynth(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  return window.speechSynthesis
}

function refreshVoices(): SpeechSynthesisVoice[] {
  const synth = getSynth()
  if (!synth) return cachedVoices
  try {
    const next = synth.getVoices()
    if (next.length > 0) cachedVoices = next
  } catch {
    // Some embedded browsers expose speechSynthesis but not its voice list.
  }
  return cachedVoices
}

function bindVoiceListener(synth: SpeechSynthesis): void {
  if (voiceListenerBound) return
  voiceListenerBound = true
  const refresh = () => {
    try {
      const next = synth.getVoices()
      if (next.length > 0) cachedVoices = next
    } catch {
      // The voice list can be unavailable until the first user gesture.
    }
  }
  try {
    synth.addEventListener('voiceschanged', refresh)
  } catch {
    synth.onvoiceschanged = refresh
  }
  refresh()
}

function scoreVoice(voice: SpeechSynthesisVoice, lang: Lang): number {
  const target = lang === 'zh' ? 'zh-cn' : 'en-us'
  const base = lang === 'zh' ? 'zh' : 'en'
  const label = voice.lang.toLowerCase().replace('_', '-')
  if (!label.startsWith(base)) return Number.NEGATIVE_INFINITY
  const name = voice.name.toLowerCase()
  let score = 0
  if (label === target) score += 14
  else if (label.startsWith(base)) score += 6

  if (/(enhanced|premium|neural|natural)/.test(name)) score += 24
  if (lang === 'zh' && /(tingting|meijia|xiaoxiao|xiaoyi|yunxi|yunyang|sinji|婷婷|美嘉|善怡|shelley|eddy|siri)/.test(name)) {
    score += 12
  }
  if (lang === 'en' && /(samantha|ava|allison|susan|karen|moira|daniel|alex)/.test(name)) {
    score += 6
  }
  if (name.includes('google')) score += 7
  if (name.includes('microsoft')) score += 3
  if (voice.localService) score += 2
  // The OS default is usually the voice the user already hears everywhere
  // else. Prefer it over an arbitrary novelty voice from the same language.
  if (voice.default) score += 20
  if (/(compact|espeak|festival|robot|novelty|zarvox|albert|bad news|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|bahh|grandma|grandpa|reed|rocko|fred|junior|ralph)/.test(name)) {
    score -= 60
  }
  return score
}

/** Prefer a natural local voice; fall back to the browser default. */
function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null
  let bestScore = Number.NEGATIVE_INFINITY
  for (const voice of refreshVoices()) {
    const score = scoreVoice(voice, lang)
    if (score > bestScore) {
      best = voice
      bestScore = score
    }
  }
  return best
}

function clearDebounce(): void {
  if (debounceTimer != null) window.clearTimeout(debounceTimer)
  debounceTimer = null
}

function clearGap(): void {
  if (gapTimer != null) window.clearTimeout(gapTimer)
  gapTimer = null
}

function stopKeepAlive(): void {
  if (keepAliveTimer != null) window.clearInterval(keepAliveTimer)
  keepAliveTimer = null
}

function startKeepAlive(): void {
  stopKeepAlive()
  const synth = getSynth()
  if (!synth) return
  keepAliveTimer = window.setInterval(() => {
    if (!activeUtterance) {
      stopKeepAlive()
      return
    }
    // A known Chrome issue leaves speechSynthesis paused without firing end.
    // Resume only when the API itself reports paused, never on every tick.
    try {
      if (synth.paused) synth.resume()
    } catch {
      stopKeepAlive()
    }
  }, KEEPALIVE_MS)
}

function cancelActive(): void {
  // Invalidate a startSpeech attempt that may be waiting for voices.
  speechToken += 1
  if (activeUtterance) {
    activeUtterance.onend = null
    activeUtterance.onerror = null
    activeUtterance = null
  }
  activeText = ''
  activeLang = null
  stopKeepAlive()
  try {
    getSynth()?.cancel()
  } catch {
    // A cancelled voice is not an application error.
  }
}

function finish(utterance: SpeechSynthesisUtterance): void {
  if (activeUtterance !== utterance) return
  activeUtterance = null
  activeText = ''
  activeLang = null
  stopKeepAlive()
  if (!queued) return
  const next = queued
  queued = null
  clearGap()
  gapTimer = window.setTimeout(() => {
    gapTimer = null
    startSpeech(next)
  }, VOICE_RETRY_MS)
}

function startSpeech(request: SpeechRequest): void {
  const synth = getSynth()
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return
  clearGap()
  const token = ++speechToken
  const attempt = (tries: number) => {
    if (token !== speechToken) return
    const voices = refreshVoices()
    if (voices.length === 0 && tries < VOICE_RETRIES) {
      gapTimer = window.setTimeout(() => {
        gapTimer = null
        attempt(tries + 1)
      }, VOICE_RETRY_MS)
      return
    }
    speakNow(request, synth)
  }
  attempt(0)
}

function speakNow(request: SpeechRequest, synth: SpeechSynthesis): void {
  const utterance = new SpeechSynthesisUtterance(request.text)
  const voice = pickVoice(request.lang)
  if (voice) utterance.voice = voice
  utterance.lang = voice?.lang ?? (request.lang === 'zh' ? 'zh-CN' : 'en-US')
  utterance.rate = request.lang === 'zh' ? 0.95 : 1
  utterance.pitch = 1
  utterance.volume = 1

  activeUtterance = utterance
  activeText = request.text
  activeLang = request.lang

  utterance.onend = () => finish(utterance)
  utterance.onerror = () => finish(utterance)

  try {
    synth.speak(utterance)
    startKeepAlive()
  } catch {
    finish(utterance)
  }
}

function scheduleStart(request: SpeechRequest): void {
  // Chrome can ignore speak() immediately after cancel(); one short tick
  // avoids both a swallowed sentence and an audible restart.
  const token = speechToken
  gapTimer = window.setTimeout(() => {
    gapTimer = null
    if (token === speechToken) startSpeech(request)
  }, 80)
}

function flushPending(): void {
  clearDebounce()
  const request = pending
  pending = null
  if (!request) return
  const synth = getSynth()
  if (!synth) return

  const isSpeaking = Boolean(activeUtterance)
  // A cancel can still be settling in the browser after our active utterance
  // was cleared. An interrupting request should wait for that to finish.
  const browserBusy = !activeUtterance && (synth.speaking || synth.pending)
  if (isSpeaking && !request.interrupt) {
    queued = request
    return
  }
  if ((isSpeaking || browserBusy) && request.interrupt) {
    queued = null
    cancelActive()
    scheduleStart(request)
    return
  }
  startSpeech(request)
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

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

/**
 * Speak a line. Location-driven lines debounce and queue; explicit user actions
 * may interrupt the current sentence. Identical text is never restarted.
 */
export function speak(text: string, lang: Lang, enabled = true, interrupt = false): void {
  if (!enabled) {
    stopSpeaking()
    return
  }
  const synth = getSynth()
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return
  bindVoiceListener(synth)

  const clean = normalizeText(text)
  if (!clean) return
  if (clean === activeText && lang === activeLang) return
  if (queued && clean === queued.text && lang === queued.lang) return
  if (pending && clean === pending.text && lang === pending.lang) {
    if (interrupt) {
      pending.interrupt = true
      flushPending()
    }
    return
  }

  if (interrupt) {
    clearDebounce()
    pending = null
    queued = null
    pending = { text: clean, lang, interrupt: true }
    flushPending()
    return
  }

  pending = { text: clean, lang, interrupt: false }
  clearDebounce()
  debounceTimer = window.setTimeout(() => {
    debounceTimer = null
    flushPending()
  }, DEBOUNCE_MS)
}

export function stopSpeaking(): void {
  clearDebounce()
  clearGap()
  pending = null
  queued = null
  cancelActive()
}

// Attach early so voices that load after the first render are picked up.
const initialSynth = getSynth()
if (initialSynth) bindVoiceListener(initialSynth)
