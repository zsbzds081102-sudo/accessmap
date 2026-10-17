import { useEffect, useMemo, useState } from 'react'
import { AddPinForm } from './components/AddPinForm'
import { MapView } from './components/MapView'
import { SEED_PINS } from './seed'
import { loadPins, savePins } from './storage'
import {
  BARRIER_TYPE_LABELS,
  BARRIER_TYPES,
  STATUS_LABELS,
  placeVerdict,
  type AccessPin,
  type BarrierType,
  type PinStatus,
} from './types'
import './App.css'

type TypeFilter = BarrierType | 'all'
type StatusFilter = PinStatus | 'all'
type Audience = 'student' | 'school'

const WALKTHROUGH: Array<{ pinId: string; audience: Audience; text: string }> = [
  {
    pinId: 'seed-1',
    audience: 'student',
    text: '正门有台阶、没有坡道。坐轮椅的同学从这里进不了学校。',
  },
  {
    pinId: 'seed-2',
    audience: 'student',
    text: '主教学楼已经有电梯。学校不是什么都没有，课可以上。',
  },
  {
    pinId: 'seed-1',
    audience: 'school',
    text: '所以本周只做一件事：给正门加坡道。实验楼、图书馆、体育馆排在后面。',
  },
]

function repairOrder(pins: AccessPin[]): AccessPin[] {
  return [...pins].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1
    const aNew = a.id.startsWith('seed-') ? 1 : 0
    const bNew = b.id.startsWith('seed-') ? 1 : 0
    if (aNew !== bNew) return aNew - bNew
    return (a.priority ?? 50) - (b.priority ?? 50)
  })
}

export default function App() {
  const [pins, setPins] = useState<AccessPin[]>(() => loadPins())
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null)
  const [reporting, setReporting] = useState(false)
  const [audience, setAudience] = useState<Audience>('student')
  const [walkStep, setWalkStep] = useState(-1)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    setSaveError(savePins(pins))
  }, [pins])

  useEffect(() => {
    if (!selectedId) return
    document.getElementById(`pin-${selectedId}`)?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  const openCount = useMemo(
    () => pins.filter((pin) => pin.status === 'open').length,
    [pins],
  )
  const fixedCount = useMemo(
    () => pins.filter((pin) => pin.status === 'fixed').length,
    [pins],
  )

  const visiblePins = useMemo(
    () =>
      pins.filter((pin) => {
        if (typeFilter !== 'all' && pin.type !== typeFilter) return false
        if (statusFilter !== 'all' && pin.status !== statusFilter) return false
        return true
      }),
    [pins, statusFilter, typeFilter],
  )

  function addPin(input: Omit<AccessPin, 'id' | 'createdAt' | 'status'>) {
    const pin: AccessPin = {
      ...input,
      id: crypto.randomUUID(),
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    setPins((current) => [pin, ...current])
    setSelectedId(pin.id)
    setTypeFilter('all')
    setStatusFilter('all')
    setDraft(null)
    setReporting(false)
    setAudience('school')
    setWalkStep(-1)
  }

  function toggleStatus(id: string) {
    setPins((current) =>
      current.map((pin) =>
        pin.id === id
          ? { ...pin, status: pin.status === 'open' ? 'fixed' : 'open' }
          : pin,
      ),
    )
  }

  const ordered = useMemo(() => repairOrder(pins), [pins])
  const firstFix = ordered.find((pin) => pin.status === 'open') ?? null
  const walk = walkStep >= 0 ? WALKTHROUGH[walkStep] : null

  function playNext() {
    const next = (walkStep + 1) % WALKTHROUGH.length
    const beat = WALKTHROUGH[next]
    setWalkStep(next)
    setAudience(beat.audience)
    setStatusFilter('all')
    setTypeFilter('all')
    setSelectedId(beat.pinId)
    setReporting(false)
    setDraft(null)
  }

  const shown = audience === 'school' ? repairOrder(visiblePins) : visiblePins

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <p className="eyebrow">Neighborhood Hacks 2026</p>
          <h1>AccessMap</h1>
        </div>
        <div className="campus-block">
          <p className="campus">七台河市第一中学</p>
          <p className="counts">
            <span className="count bad"><strong>{openCount}</strong> 进不去</span>
            <span className="count ok"><strong>{fixedCount}</strong> 能进入</span>
          </p>
        </div>
      </header>

      <div className="workspace">
        <div className="map-pane">
          <MapView
            pins={visiblePins}
            draft={draft}
            reporting={reporting}
            selectedId={selectedId}
            onPickLocation={(lat, lng) => setDraft({ lat, lng })}
            onSelect={setSelectedId}
            onToggleStatus={toggleStatus}
          />
          <p className="map-legend">阶 台阶 · 坡 无坡道 · 梯 电梯故障 · 通 可通行</p>
        </div>

        <aside className="sidebar">
          <div className="segmented" role="group" aria-label="给谁看">
            <button
              type="button"
              className={audience === 'student' ? 'is-on' : ''}
              aria-pressed={audience === 'student'}
              onClick={() => setAudience('student')}
            >
              同学上课
            </button>
            <button
              type="button"
              className={audience === 'school' ? 'is-on' : ''}
              aria-pressed={audience === 'school'}
              onClick={() => setAudience('school')}
            >
              学校来修
            </button>
          </div>

          <article className="decision">
            <p className="kicker">{walk ? `演示 ${walkStep + 1} / 3` : '本周先修'}</p>
            <h2>{walk ? (walk.audience === 'school' ? '正门坡道' : pins.find((pin) => pin.id === walk.pinId)?.title) : (firstFix?.title ?? '都已能进入')}</h2>
            <p>
              {walk
                ? walk.text
                : firstFix
                  ? firstFix.affects ?? firstFix.note
                  : '现在没有未解决的障碍。'}
            </p>
            <button type="button" className="text-btn" onClick={playNext}>
              用 20 秒看完
            </button>
          </article>

          <div className="filters" role="group" aria-label="按能不能进筛选">
            {(
              [
                ['all', '全部'],
                ['open', '进不去'],
                ['fixed', '能进入'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={statusFilter === value ? 'chip is-on' : 'chip'}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="filters" role="group" aria-label="按障碍类型筛选">
            <button
              type="button"
              className={typeFilter === 'all' ? 'chip is-on' : 'chip'}
              onClick={() => setTypeFilter('all')}
            >
              全部类型
            </button>
            {BARRIER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={typeFilter === type ? 'chip is-on' : 'chip'}
                onClick={() => setTypeFilter(type)}
              >
                {BARRIER_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          <ul className="place-list">
            {shown.length === 0 ? (
              <li className="empty">这个筛选下没有地点。</li>
            ) : (
              shown.map((pin) => {
                const verdict = placeVerdict(pin)
                const open = pin.id === selectedId
                return (
                  <li key={pin.id} id={`pin-${pin.id}`} className={open ? 'is-open' : ''}>
                    <button
                      type="button"
                      className="place"
                      aria-expanded={open}
                      onClick={() => setSelectedId(open ? null : pin.id)}
                    >
                      <span className={verdict.ok ? 'mark ok' : 'mark bad'}>
                        {audience === 'school' && !verdict.ok ? (pin.priority ?? '新') : verdict.ok ? '通' : '阻'}
                      </span>
                      <span className="place-copy">
                        <span className="place-title">{pin.title}</span>
                        <span className="place-sub">
                          {audience === 'school' ? (pin.affects ?? verdict.label) : verdict.label}
                        </span>
                      </span>
                    </button>
                    {open ? (
                      <div className="place-detail">
                        {pin.affects ? <p className="affects">{pin.affects}</p> : null}
                        <p>{pin.note}</p>
                        <p className="muted">
                          {BARRIER_TYPE_LABELS[pin.type]} · {STATUS_LABELS[pin.status]}
                        </p>
                        {pin.photoDataUrl ? (
                          <img src={pin.photoDataUrl} alt={`${pin.title}的照片`} className="detail-photo" />
                        ) : null}
                        <button
                          type="button"
                          className="btn"
                          aria-pressed={pin.status === 'fixed'}
                          onClick={() => toggleStatus(pin.id)}
                        >
                          {pin.status === 'open' ? '标成已经修好' : '又遇到问题了'}
                        </button>
                      </div>
                    ) : null}
                  </li>
                )
              })
            )}
          </ul>

          <div className="action-row">
            <button
              type="button"
              className={reporting ? 'btn' : 'btn primary'}
              aria-pressed={reporting}
              onClick={() => {
                setReporting((current) => !current)
                setDraft(null)
              }}
            >
              {reporting ? '取消上报' : '我要上报障碍'}
            </button>
          </div>

          <p className="hint">
            {reporting
              ? '请点地图上障碍所在的位置。看地图时不会误开上报表。'
              : '先看上面能不能进。要标新障碍，再点「我要上报障碍」。'}
          </p>

          {saveError ? <p className="error" role="alert">{saveError}</p> : null}

          {draft ? (
            <AddPinForm
              draftLat={draft.lat}
              draftLng={draft.lng}
              onCancel={() => setDraft(null)}
              onSubmit={addPin}
            />
          ) : null}

          <button
            type="button"
            className="btn ghost reset"
            onClick={() => {
              setPins(SEED_PINS.map((pin) => ({ ...pin })))
              setSelectedId(null)
              setDraft(null)
              setTypeFilter('all')
              setStatusFilter('all')
              setReporting(false)
              setAudience('student')
              setWalkStep(-1)
            }}
          >
            恢复校园最初的 6 个地点
          </button>
        </aside>
      </div>
    </div>
  )
}
