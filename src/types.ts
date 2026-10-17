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

export const BARRIER_TYPE_LABELS: Record<BarrierType, string> = {
  stairs: '台阶',
  no_ramp: '没有坡道',
  elevator_broken: '电梯故障',
  other: '其他',
}

export const BARRIER_TYPES = Object.keys(
  BARRIER_TYPE_LABELS,
) as BarrierType[]

export const STATUS_LABELS: Record<PinStatus, string> = {
  open: '还没解决',
  fixed: '可以通行',
}

/** What a student needs at a glance: can I get in right now? */
export function placeVerdict(pin: AccessPin): { ok: boolean; label: string } {
  if (pin.status === 'open' && pin.type === 'elevator_broken') {
    return { ok: false, label: '电梯用不了' }
  }
  if (pin.status === 'open') {
    return { ok: false, label: '现在进不去' }
  }
  if (pin.note.includes('有电梯') && !pin.note.includes('没有电梯')) {
    return { ok: true, label: '可以进入' }
  }
  return { ok: true, label: '已经修好' }
}
