import { SEED_PINS } from './seed'
import { BARRIER_TYPES, type AccessPin } from './types'

/** Bump when seed semantics change so demos pick up clearer barrier labels. */
export const PINS_STORAGE_KEY = 'accessmap-pins-v2'

function isPin(value: unknown): value is AccessPin {
  if (!value || typeof value !== 'object') return false
  const pin = value as AccessPin
  return (
    typeof pin.id === 'string' &&
    typeof pin.title === 'string' &&
    typeof pin.note === 'string' &&
    typeof pin.lat === 'number' &&
    typeof pin.lng === 'number' &&
    (pin.observedOn === undefined || typeof pin.observedOn === 'string') &&
    (pin.observationSource === undefined || typeof pin.observationSource === 'string') &&
    (pin.coordinateSystem === undefined || pin.coordinateSystem === 'GCJ-02') &&
    typeof pin.createdAt === 'string' &&
    (pin.status === 'open' || pin.status === 'fixed') &&
    BARRIER_TYPES.includes(pin.type)
  )
}

function seedPins(): AccessPin[] {
  return SEED_PINS.map((pin) => ({ ...pin }))
}

function readPins(): AccessPin[] {
  const raw = localStorage.getItem(PINS_STORAGE_KEY)
  if (raw === null) return seedPins()
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('Invalid AccessMap storage')

  const seedsById = new Map(SEED_PINS.map((pin) => [pin.id, pin]))
  const stored = parsed.filter(isPin).map((pin) => {
    const seed = seedsById.get(pin.id)
    if (!seed) return pin
    return { ...seed, status: pin.status, photoDataUrl: pin.photoDataUrl }
  })
  const seen = new Set(stored.map((pin) => pin.id))
  return [...SEED_PINS.filter((pin) => !seen.has(pin.id)).map((pin) => ({ ...pin })), ...stored]
}

export function loadPins(): AccessPin[] {
  try {
    return readPins()
  } catch {
    return seedPins()
  }
}

export type SaveError = 'quota' | 'unavailable'

export function updatePins(
  update: (current: AccessPin[]) => AccessPin[],
): { pins: AccessPin[]; error?: never } | { pins?: never; error: SaveError } {
  try {
    // Re-read at the time of the action so a tab with an old view does not
    // overwrite reports already saved by another tab.
    const pins = update(readPins())
    localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(pins))
    return { pins }
  } catch (error) {
    return { error: error instanceof DOMException && error.name === 'QuotaExceededError'
      ? 'quota'
      : 'unavailable' }
  }
}
