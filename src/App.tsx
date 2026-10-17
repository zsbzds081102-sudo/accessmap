import { useEffect, useMemo, useState } from 'react'
import { AddPinForm } from './components/AddPinForm'
import { MapView } from './components/MapView'
import { SEED_PINS } from './seed'
import { loadPins, savePins } from './storage'
import {
  BARRIER_TYPE_LABELS,
  BARRIER_TYPES,
  STATUS_LABELS,
  type AccessPin,
  type BarrierType,
  type PinStatus,
} from './types'
import './App.css'

type TypeFilter = BarrierType | 'all'
type StatusFilter = PinStatus | 'all'

export default function App() {
  const [pins, setPins] = useState<AccessPin[]>(() => loadPins())
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null)
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

  const statsByType = useMemo(
    () =>
      BARRIER_TYPES.map((type) => {
        const ofType = pins.filter((pin) => pin.type === type)
        return {
          type,
          open: ofType.filter((pin) => pin.status === 'open').length,
          fixed: ofType.filter((pin) => pin.status === 'fixed').length,
          total: ofType.length,
        }
      }),
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
            {openCount} open · {fixedCount} fixed · {pins.length} pins
          </span>
        </p>
      </header>

      <div className="workspace">
        <div className="map-pane">
          <MapView
            pins={visiblePins}
            draft={draft}
            selectedId={selectedId}
            onPickLocation={(lat, lng) => setDraft({ lat, lng })}
            onSelect={setSelectedId}
            onToggleStatus={toggleStatus}
          />
        </div>

        <aside className="sidebar">
          <section className="story panel-card">
            <h2>为什么做 / Why</h2>
            <p>
              轮椅使用者、受伤同学和推婴儿车的家长，在校园里常被台阶和缺坡道挡住。
              AccessMap 把障碍标在地图上，方便同学上报、学校优先修缮。
            </p>
            <p className="story-en">
              Students who use wheelchairs—and anyone facing stairs without a
              ramp—should know which campus doors are blocked. AccessMap is a
              lightweight map + report tool so the school can fix the worst spots
              first.
            </p>
          </section>

          <section className="stats panel-card" aria-label="Barrier statistics">
            <h2>障碍统计 / Stats</h2>
            <div className="stats-summary">
              <div>
                <strong>{openCount}</strong>
                <span>Open / 待解决</span>
              </div>
              <div>
                <strong>{fixedCount}</strong>
                <span>Fixed / 已畅通</span>
              </div>
            </div>
            <ul className="stats-by-type">
              {statsByType.map((row) => (
                <li key={row.type}>
                  <span>{BARRIER_TYPE_LABELS[row.type]}</span>
                  <span className="stats-nums">
                    <em className="open-num">{row.open} open</em>
                    <em className="fixed-num">{row.fixed} fixed</em>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <p className="hint">Click the map to report a barrier. 点击地图上报障碍。</p>

          <div className="filters" role="group" aria-label="Filter by status">
            {(
              [
                ['all', 'All status', pins.length],
                ['open', 'Open', openCount],
                ['fixed', 'Fixed', fixedCount],
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

          <div className="filters" role="group" aria-label="Filter by type">
            <button
              type="button"
              className={typeFilter === 'all' ? 'chip is-on' : 'chip'}
              onClick={() => setTypeFilter('all')}
            >
              All types
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
            <li><i className="swatch stairs" /> Open · stairs</li>
            <li><i className="swatch no-ramp" /> Open · no ramp</li>
            <li><i className="swatch elevator" /> Open · elevator broken</li>
            <li><i className="swatch other" /> Open · other</li>
            <li><i className="swatch fixed" /> Fixed / accessible</li>
          </ul>

          {saveError ? <p className="error">{saveError}</p> : null}

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
              <li className="empty">No pins for this filter.</li>
            ) : (
              visiblePins.map((pin) => (
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
                        <span className={`status ${pin.status}`}>
                          {STATUS_LABELS[pin.status]}
                        </span>
                        <span>{BARRIER_TYPE_LABELS[pin.type]}</span>
                      </span>
                      <span className="pin-note">{pin.note || 'No note'}</span>
                    </button>
                    {pin.photoDataUrl ? (
                      <img src={pin.photoDataUrl} alt="" className="thumb" />
                    ) : null}
                    <button
                      type="button"
                      className="btn small"
                      aria-pressed={pin.status === 'fixed'}
                      onClick={() => toggleStatus(pin.id)}
                    >
                      {pin.status === 'open' ? 'Mark fixed' : 'Reopen'}
                    </button>
                  </article>
                </li>
              ))
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
            }}
          >
            Restore campus seed
          </button>
        </aside>
      </div>
    </div>
  )
}
