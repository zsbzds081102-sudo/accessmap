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
}

export const BARRIER_TYPE_LABELS: Record<BarrierType, string> = {
  stairs: 'Stairs / 台阶',
  no_ramp: 'No ramp / 无坡道',
  elevator_broken: 'Elevator broken / 电梯故障',
  other: 'Other / 其他',
}

export const BARRIER_TYPES = Object.keys(
  BARRIER_TYPE_LABELS,
) as BarrierType[]

export const STATUS_LABELS: Record<PinStatus, string> = {
  open: 'Open / 待解决',
  fixed: 'Fixed / 已畅通',
}
