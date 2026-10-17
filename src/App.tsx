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

  const selected = pins.find((pin) => pin.id === selectedId) ?? null
  const ordered = useMemo(() => repairOrder(pins), [pins])
  const firstFix = ordered.find((pin) => pin.status === 'open') ?? null
  const alreadyOk = ordered.filter((pin) => pin.status !== 'open')
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

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Neighborhood Hacks 2026</p>
          <h1>AccessMap</h1>
        </div>
        <p className="campus">
          七台河市第一中学
          <span>
            {openCount} 处还进不去 · {fixedCount} 处可以通行
          </span>
        </p>
      </header>

      <p className="judge-line">
        {walk
          ? walk.text
          : firstFix
            ? `${openCount} 处还进不去，${fixedCount} 处已经能进。本周先做一件事：${firstFix.title}。${firstFix.affects ?? ''}`
            : '现在没有未解决的障碍。'}
      </p>

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
        </div>

        <aside className="sidebar">
          <div className="audience" role="group" aria-label="给谁看">
            <button
              type="button"
              className={audience === 'student' ? 'btn primary' : 'btn'}
              aria-pressed={audience === 'student'}
              onClick={() => setAudience('student')}
            >
              同学上课
            </button>
            <button
              type="button"
              className={audience === 'school' ? 'btn primary' : 'btn'}
              aria-pressed={audience === 'school'}
              onClick={() => setAudience('school')}
            >
              学校来修
            </button>
          </div>
          <button type="button" className="btn ghost" onClick={playNext}>
            用 20 秒看完{walk ? `（${walkStep + 1}/3）` : ''}
          </button>

          {audience === 'school' ? (
            <section className="brief panel-card" aria-label="修缮顺序">
              <h2>本周修缮顺序</h2>
              <ol className="repair-list">
                {ordered
                  .filter((pin) => pin.status === 'open')
                  .map((pin) => (
                    <li key={pin.id}>
                      <button
                        type="button"
                        className={pin.id === selectedId ? 'brief-item is-on' : 'brief-item'}
                        onClick={() => setSelectedId(pin.id)}
                      >
                        <span className="rank">{pin.id.startsWith('seed-') ? pin.priority : '新'}</span>
                        <span className="repair-copy">
                          <span className="pin-title">{pin.title}</span>
                          <span className="pin-note">{pin.affects ?? pin.note}</span>
                        </span>
                      </button>
                    </li>
                  ))}
              </ol>
              {alreadyOk.length > 0 ? (
                <p className="hint">
                  已经能进，先不用修：{alreadyOk.map((pin) => pin.title).join('、')}
                </p>
              ) : null}
            </section>
          ) : (
          <section className="brief panel-card" aria-label="今天能不能进">
            <h2>今天这几处</h2>
            <ul className="brief-list">
              {pins
                .filter((pin) => pin.id.startsWith('seed-'))
                .map((pin) => {
                  const verdict = placeVerdict(pin)
                  return (
                    <li key={pin.id}>
                      <button
                        type="button"
                        className={pin.id === selectedId ? 'brief-item is-on' : 'brief-item'}
                        onClick={() => setSelectedId(pin.id)}
                      >
                        <span>{pin.title}</span>
                        <strong className={verdict.ok ? 'ok' : 'bad'}>{verdict.label}</strong>
                      </button>
                    </li>
                  )
                })}
            </ul>
          </section>
          )}

          <div className="action-row">
            <button
              type="button"
              className="btn primary"
              aria-pressed={statusFilter === 'open'}
              onClick={() => setStatusFilter((current) => (current === 'open' ? 'all' : 'open'))}
            >
              {statusFilter === 'open' ? '显示全部地点' : '只看还进不去的'}
            </button>
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

          <div className="filters" role="group" aria-label="按能不能进筛选">
            {(
              [
                ['all', '全部', pins.length],
                ['open', '还进不去', openCount],
                ['fixed', '可以通行', fixedCount],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                className={statusFilter === value ? 'chip is-on' : 'chip'}
                onClick={() => setStatusFilter(value)}
              >
                {label}
                <span>{count}</span>
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
              <span>{pins.length}</span>
            </button>
            {BARRIER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={typeFilter === type ? 'chip is-on' : 'chip'}
                onClick={() => setTypeFilter(type)}
              >
                {BARRIER_TYPE_LABELS[type]}
                <span>{pins.filter((pin) => pin.type === type).length}</span>
              </button>
            ))}
          </div>

          <ul className="legend">
            <li><i className="swatch stairs" /> 阶 · 台阶</li>
            <li><i className="swatch no-ramp" /> 坡 · 没有坡道</li>
            <li><i className="swatch elevator" /> 梯 · 电梯故障</li>
            <li><i className="swatch other" /> 其 · 其他</li>
            <li><i className="swatch fixed" /> 通 · 可以通行</li>
          </ul>

          {saveError ? <p className="error" role="alert">{saveError}</p> : null}

          {selected ? (
            <section className="detail panel-card" aria-live="polite">
              <p className={placeVerdict(selected).ok ? 'verdict ok' : 'verdict bad'}>
                {placeVerdict(selected).label}
              </p>
              <h2>{selected.title}</h2>
              {selected.affects ? <p className="affects">{selected.affects}</p> : null}
              <p>{selected.note}</p>
              <p className="muted">
                {BARRIER_TYPE_LABELS[selected.type]} · {STATUS_LABELS[selected.status]}
              </p>
              {selected.photoDataUrl ? (
                <img
                  src={selected.photoDataUrl}
                  alt={`${selected.title}的照片`}
                  className="detail-photo"
                />
              ) : null}
              <button
                type="button"
                className="btn"
                aria-pressed={selected.status === 'fixed'}
                onClick={() => toggleStatus(selected.id)}
              >
                {selected.status === 'open' ? '标成已经修好' : '又遇到问题了'}
              </button>
            </section>
          ) : null}

          {draft ? (
            <AddPinForm
              draftLat={draft.lat}
              draftLng={draft.lng}
              onCancel={() => setDraft(null)}
              onSubmit={addPin}
            />
          ) : null}

          <ul className="pin-list">
            {visiblePins.length === 0 ? (
              <li className="empty">这个筛选下面没有地点。</li>
            ) : (
              visiblePins.map((pin) => {
                const verdict = placeVerdict(pin)
                return (
                  <li key={pin.id} id={`pin-${pin.id}`}>
                    <article
                      className={
                        pin.id === selectedId ? 'pin-card is-selected' : 'pin-card'
                      }
                    >
                      <button
                        type="button"
                        className="pin-select"
                        onClick={() => setSelectedId(pin.id)}
                      >
                        <span className="pin-title">{pin.title}</span>
                        <span className="pin-meta">
                          <span className={verdict.ok ? 'status fixed' : 'status open'}>
                            {verdict.label}
                          </span>
                          <span>{BARRIER_TYPE_LABELS[pin.type]}</span>
                        </span>
                        <span className="pin-note">{pin.note}</span>
                      </button>
                      {pin.photoDataUrl ? (
                        <img src={pin.photoDataUrl} alt="" className="thumb" />
                      ) : null}
                      <button
                        type="button"
                        className="btn"
                        aria-pressed={pin.status === 'fixed'}
                        onClick={() => toggleStatus(pin.id)}
                      >
                        {pin.status === 'open' ? '标成已经修好' : '又遇到问题了'}
                      </button>
                    </article>
                  </li>
                )
              })
            )}
          </ul>

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
