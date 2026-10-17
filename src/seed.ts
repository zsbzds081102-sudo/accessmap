import type { AccessPin } from './types'

/**
 * 七台河市第一中学，新兴区金沙街道。
 * Center and pins sit on that campus in the same coordinates as the Gaode basemap.
 * 正门 / 门卫 is placed at the labeled south gate.
 *
 * Semantics for judges:
 * - status "open"  = barrier that still blocks accessible travel
 * - status "fixed" = already accessible (e.g. elevator present) or resolved
 */
export const CAMPUS_CENTER: [number, number] = [45.868334, 131.042813]

export const SEED_PINS: AccessPin[] = [
  {
    id: 'seed-1',
    title: '正门 / 门卫',
    type: 'no_ramp',
    note: '【障碍 Barrier】有台阶，无坡道。轮椅与婴儿车难以进入。',
    status: 'open',
    lat: 45.867257,
    lng: 131.044321,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-2',
    title: '主教学楼',
    type: 'other',
    note: '【已畅通 Accessible】7 层，有电梯。可作为对照：不是障碍，而是可用通道。',
    status: 'fixed',
    lat: 45.868041,
    lng: 131.043409,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-3',
    title: '实验楼',
    type: 'stairs',
    note: '【障碍 Barrier】4 层，无电梯。轮椅无法到高楼层实验室。',
    status: 'open',
    lat: 45.868452,
    lng: 131.044536,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-4',
    title: '图书馆',
    type: 'stairs',
    note: '【障碍 Barrier】3 层，无电梯。阅读区对轮椅使用者不友好。',
    status: 'open',
    lat: 45.867855,
    lng: 131.041467,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-5',
    title: '食堂',
    type: 'other',
    note: '【已畅通 Accessible】3 层，有电梯。就餐通道可用。',
    status: 'fixed',
    lat: 45.869394,
    lng: 131.04357,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-6',
    title: '体育馆 / 操场入口',
    type: 'stairs',
    note: '【障碍 Barrier】3 层，无电梯。体育课与活动入口有台阶。',
    status: 'open',
    lat: 45.868452,
    lng: 131.040394,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]
