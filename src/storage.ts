import { SEED_PINS } from './seed'
import type { AccessPin, BarrierType } from './types'

/** Bump when seed semantics change so demos pick up clearer barrier labels. */
const STORAGE_KEY = 'accessmap-pins-v2'

const BARRIER_TYPES: BarrierType[] = [
  'stairs',
  'no_ramp',
  'elevator_broken',
  'other',
]

function isPin(value: unknown): value is AccessPin {
  if (!value || typeof value !== 'object') return false
  const pin = value as AccessPin
  return (
    typeof pin.id === 'string' &&
    typeof pin.title === 'string' &&
    typeof pin.note === 'string' &&
    typeof pin.lat === 'number' &&
    typeof pin.lng === 'number' &&
    typeof pin.createdAt === 'string' &&
    (pin.status === 'open' || pin.status === 'fixed') &&
    BARRIER_TYPES.includes(pin.type)
  )
}

export function loadPins(): AccessPin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED_PINS.map((pin) => ({ ...pin }))
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return SEED_PINS.map((pin) => ({ ...pin }))
    const stored = parsed.filter(isPin)
    if (stored.length === 0) return SEED_PINS.map((pin) => ({ ...pin }))
    const seedsById = new Map(SEED_PINS.map((pin) => [pin.id, pin]))
    const merged = stored.map((pin) => {
      const seed = seedsById.get(pin.id)
      if (!seed) return pin
      return { ...seed, status: pin.status, photoDataUrl: pin.photoDataUrl }
    })
    const seen = new Set(merged.map((pin) => pin.id))
    const missingSeeds = SEED_PINS.filter((pin) => !seen.has(pin.id)).map((pin) => ({
      ...pin,
    }))
    return [...missingSeeds, ...merged]
  } catch {
    return SEED_PINS.map((pin) => ({ ...pin }))
  }
}

export function savePins(pins: AccessPin[]): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pins))
    return null
  } catch {
    return '这个浏览器存不下了。照片请换小一点的。'
  }
}
