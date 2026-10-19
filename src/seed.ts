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
    note: '正门有台阶，没有坡道。坐轮椅进不了这道门，需要别人帮忙抬。上课不要把正门当成入口。',
    affects: '全校进出都要经过这道门。',
    priority: 1,
    status: 'open',
    lat: 45.867257,
    lng: 131.044321,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-2',
    title: '主教学楼',
    type: 'other',
    note: '7 层，楼里有电梯。坐轮椅可以进楼上课。电梯如果停了，把这里改成还没解决。',
    affects: '已经能上课，本周不用先修。',
    priority: 5,
    status: 'fixed',
    lat: 45.868041,
    lng: 131.043409,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-3',
    title: '实验楼',
    type: 'stairs',
    note: '4 层，没有电梯。坐轮椅只能留在一楼，上不了上面的实验室。',
    affects: '实验课上不了二楼以上。',
    priority: 2,
    status: 'open',
    lat: 45.868452,
    lng: 131.044536,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-4',
    title: '图书馆',
    type: 'stairs',
    note: '3 层，没有电梯。坐轮椅只能在一楼，上不了上面的阅览室。',
    affects: '阅览室在楼上，书拿不到。',
    priority: 3,
    status: 'open',
    lat: 45.867855,
    lng: 131.041467,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-5',
    title: '食堂',
    type: 'other',
    note: '3 层，楼里有电梯。坐轮椅可以进去吃饭。',
    affects: '已经能吃饭，本周不用先修。',
    priority: 6,
    status: 'fixed',
    lat: 45.869394,
    lng: 131.04357,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-6',
    title: '体育馆 / 操场入口',
    type: 'stairs',
    note: '入口一带 3 层，没有电梯。坐轮椅上不了楼里的场地。',
    affects: '体育馆楼层进不去。',
    priority: 4,
    status: 'open',
    lat: 45.868452,
    lng: 131.040394,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

/** Tight rectangle around the demo pins, so the first screen frames the campus. */
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [
    Math.min(...SEED_PINS.map((pin) => pin.lat)),
    Math.min(...SEED_PINS.map((pin) => pin.lng)),
  ],
  [
    Math.max(...SEED_PINS.map((pin) => pin.lat)),
    Math.max(...SEED_PINS.map((pin) => pin.lng)),
  ],
]
