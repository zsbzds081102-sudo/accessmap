export type BarrierType =
  | 'stairs'
  | 'no_ramp'
  | 'elevator_broken'
  | 'other'

export type PinStatus = 'open' | 'fixed'

export interface AccessPin {
  id: string
  title: string
  type: BarrierType
  note: string
  status: PinStatus
  lat: number
  lng: number
  photoDataUrl?: string
  createdAt: string
  /** 1 means the school should fix this first. Omitted on new reports. */
  priority?: number
  /** Who is blocked, in one sentence a judge can read. */
  affects?: string
}

export const BARRIER_TYPES: BarrierType[] = [
  'stairs',
  'no_ramp',
  'elevator_broken',
  'other',
]

/** What a student needs at a glance: can I get in right now? */
export function placeVerdict(pin: AccessPin): {
  ok: boolean
  key: 'elevator' | 'blocked' | 'enter' | 'repaired'
} {
  if (pin.status === 'open' && pin.type === 'elevator_broken') {
    return { ok: false, key: 'elevator' }
  }
  if (pin.status === 'open') return { ok: false, key: 'blocked' }
  if (pin.type === 'other') return { ok: true, key: 'enter' }
  return { ok: true, key: 'repaired' }
}
