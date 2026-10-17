import { useEffect, useMemo, useState } from 'react'
import { AddPinForm } from './components/AddPinForm'
import { MapView } from './components/MapView'
import { displayPin, loadLang, pinGlyph, storeLang, t, verdictLabel, type Lang } from './i18n'
import { SEED_PINS } from './seed'
import { loadPins, savePins } from './storage'
import {
  BARRIER_TYPES,
  placeVerdict,
  type AccessPin,
  type BarrierType,
  type PinStatus,
} from './types'
import './App.css'

type TypeFilter = BarrierType | 'all'
type StatusFilter = PinStatus | 'all'
type Audience = 'student' | 'school'

const WALKTHROUGH: Array<{ pinId: string; audience: Audience; key: 'walk1' | 'walk2' | 'walk3' }> = [
  { pinId: 'seed-1', audience: 'student', key: 'walk1' },
  { pinId: 'seed-2', audience: 'student', key: 'walk2' },
  { pinId: 'seed-1', audience: 'school', key: 'walk3' },
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
  const [lang, setLang] = useState<Lang>(() => loadLang())
  const [saveError, setSaveError] = useState<'quota' | null>(null)

  const text = t(lang)

  useEffect(() => {
    setSaveError(savePins(pins))
  }, [pins])

  useEffect(() => {
    storeLang(lang)
  }, [lang])

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
          <div className="langs" role="group" aria-label="Language">
            <button type="button" className={lang === 'en' ? 'is-on' : ''} onClick={() => setLang('en')}>EN</button>
            <button type="button" className={lang === 'zh' ? 'is-on' : ''} onClick={() => setLang('zh')}>中文</button>
          </div>
          <p className="campus">{text.campus}</p>
          <p className="counts">
            <span className="count bad"><strong>{openCount}</strong> {text.blockedCount}</span>
            <span className="count ok"><strong>{fixedCount}</strong> {text.openCount}</span>
          </p>
        </div>
      </header>

      <div className="workspace">
        <div className="map-pane">
          <MapView
            pins={visiblePins}
            lang={lang}
            draft={draft}
            reporting={reporting}
            selectedId={selectedId}
            onPickLocation={(lat, lng) => setDraft({ lat, lng })}
            onSelect={setSelectedId}
            onToggleStatus={toggleStatus}
          />
          <p className="map-legend">{text.legend}</p>
        </div>

        <aside className="sidebar">
          <div className="segmented" role="group" aria-label={text.audienceLabel}>
            <button
              type="button"
              className={audience === 'student' ? 'is-on' : ''}
              aria-pressed={audience === 'student'}
              onClick={() => setAudience('student')}
            >
              {text.student}
            </button>
            <button
              type="button"
              className={audience === 'school' ? 'is-on' : ''}
              aria-pressed={audience === 'school'}
              onClick={() => setAudience('school')}
            >
              {text.school}
            </button>
          </div>

          <article className="decision">
            <p className="kicker">{walk ? `${text.demo} ${walkStep + 1} / 3` : text.thisWeek}</p>
            <h2>
              {walk
                ? walk.audience === 'school'
                  ? text.gateRamp
                  : displayPin(pins.find((pin) => pin.id === walk.pinId) ?? pins[0], lang).title
                : firstFix
                  ? displayPin(firstFix, lang).title
                  : text.allClear}
            </h2>
            <p>
              {walk
                ? text[walk.key]
                : firstFix
                  ? displayPin(firstFix, lang).affects
                  : text.allClear}
            </p>
            <button type="button" className="text-btn" onClick={playNext}>
              {text.walk}
            </button>
          </article>

          <div className="filters" role="group" aria-label={text.statusLabel}>
            {(
              [
                ['all', text.all],
                ['open', text.cannotEnter],
                ['fixed', text.canEnter],
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

          <div className="filters" role="group" aria-label={text.typeLabel}>
            <button
              type="button"
              className={typeFilter === 'all' ? 'chip is-on' : 'chip'}
              onClick={() => setTypeFilter('all')}
            >
              {text.allTypes}
            </button>
            {BARRIER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={typeFilter === type ? 'chip is-on' : 'chip'}
                onClick={() => setTypeFilter(type)}
              >
                {text.type[type]}
              </button>
            ))}
          </div>

          <ul className="place-list">
            {shown.length === 0 ? (
              <li className="empty">{text.empty}</li>
            ) : (
              shown.map((pin) => {
                const verdict = placeVerdict(pin)
                const shownPin = displayPin(pin, lang)
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
                        {audience === 'school' && !verdict.ok ? (pin.priority ?? '·') : pinGlyph(pin, lang)}
                      </span>
                      <span className="place-copy">
                        <span className="place-title">{shownPin.title}</span>
                        <span className="place-sub">
                          {audience === 'school' ? (shownPin.affects ?? verdictLabel(pin, lang)) : verdictLabel(pin, lang)}
                        </span>
                      </span>
                    </button>
                    {open ? (
                      <div className="place-detail">
                        {shownPin.affects ? <p className="affects">{shownPin.affects}</p> : null}
                        <p>{shownPin.note}</p>
                        <p className="muted">
                          {text.type[pin.type]} · {text.status[pin.status]}
                        </p>
                        {pin.photoDataUrl ? (
                          <img src={pin.photoDataUrl} alt={`${shownPin.title} ${text.photoAlt}`} className="detail-photo" />
                        ) : null}
                        <button
                          type="button"
                          className="btn"
                          aria-pressed={pin.status === 'fixed'}
                          onClick={() => toggleStatus(pin.id)}
                        >
                          {pin.status === 'open' ? text.markFixed : text.reopen}
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
              {reporting ? text.cancelReport : text.report}
            </button>
          </div>

          <p className="hint">{reporting ? text.hintReporting : text.hintIdle}</p>

          {saveError ? <p className="error" role="alert">{text.saveError}</p> : null}

          {draft ? (
            <AddPinForm
              lang={lang}
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
            {text.reset}
          </button>
        </aside>
      </div>
    </div>
  )
}
