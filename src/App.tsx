import { useEffect, useMemo, useRef, useState } from 'react'
import { AddPinForm } from './components/AddPinForm'
import { MapView } from './components/MapView'
import { distanceMeters, formatDistance } from './geo'
import { displayPin, loadLang, pinGlyph, storeLang, t, verdictLabel, type Lang } from './i18n'
import { CAMPUS_CENTER, SEED_PINS } from './seed'
import { loadSound, speak, stopSpeaking, storeSound } from './speech'
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
  const [draft, setDraft] = useState<{
    lat: number
    lng: number
    label?: string
    prefillTitle?: string
  } | null>(null)
  const [reporting, setReporting] = useState(false)
  const [audience, setAudience] = useState<Audience>('student')
  const [walkStep, setWalkStep] = useState(-1)
  const [lang, setLang] = useState<Lang>(() => loadLang())
  const [sound, setSound] = useState(() => loadSound())
  const [locating, setLocating] = useState(false)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [locError, setLocError] = useState<'denied' | 'unsupported' | 'unavailable' | null>(null)
  const [saveError, setSaveError] = useState<'quota' | null>(null)
  const [caption, setCaption] = useState('')
  const [toast, setToast] = useState<{ id: number; message: string; undo?: () => void } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const toastTimer = useRef<number | null>(null)
  const watchRef = useRef<number | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const spokenRef = useRef('')
  const skipSpeak = useRef(false)
  const skipScroll = useRef(false)
  const pinsRef = useRef(pins)
  const langRef = useRef(lang)
  const soundRef = useRef(sound)
  pinsRef.current = pins
  langRef.current = lang
  soundRef.current = sound

  const text = t(lang)

  useEffect(() => {
    setSaveError(savePins(pins))
  }, [pins])

  useEffect(() => {
    return () => {
      if (toastTimer.current != null) window.clearTimeout(toastTimer.current)
    }
  }, [])

  function showToast(message: string, undo?: () => void) {
    if (toastTimer.current != null) window.clearTimeout(toastTimer.current)
    const id = Date.now()
    setToast({ id, message, undo })
    toastTimer.current = window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, 7000)
  }

  useEffect(() => {
    if (!draft) return
    bodyRef.current?.scrollTo({ top: 0 })
  }, [draft])

  useEffect(() => {
    storeLang(lang)
    spokenRef.current = ''
  }, [lang])

  useEffect(() => {
    storeSound(sound)
    if (!sound) stopSpeaking()
  }, [sound])

  useEffect(() => {
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  function announceHere(here: { lat: number; lng: number }) {
    const language = langRef.current
    const list = pinsRef.current
    let nearest: AccessPin | null = null
    let best = Number.POSITIVE_INFINITY
    for (const pin of list) {
      const meters = distanceMeters(here.lat, here.lng, pin.lat, pin.lng)
      if (meters < best) {
        best = meters
        nearest = pin
      }
    }
    const campus = distanceMeters(here.lat, here.lng, CAMPUS_CENTER[0], CAMPUS_CENTER[1])
    const phrase = t(language)
    if (nearest && best < 120) {
      const key = `near:${nearest.id}:${language}`
      if (spokenRef.current === key) return
      spokenRef.current = key
      const shown = displayPin(nearest, language)
      skipSpeak.current = true
      skipScroll.current = true
      setSelectedId(nearest.id)
      const nearLine = phrase.near(shown.title, verdictLabel(nearest, language), shown.affects ?? shown.note)
      setCaption(nearLine)
      speak(nearLine, language, soundRef.current)
      return
    }
    const key = `far:${Math.round(campus / 500)}:${language}`
    if (spokenRef.current === key) return
    spokenRef.current = key
    const fix = repairOrder(list).find((pin) => pin.status === 'open')
    const shown = fix ? displayPin(fix, language) : null
    const farLine = phrase.far(formatDistance(campus, language), shown?.title ?? '', shown?.affects ?? '')
    setCaption(farLine)
    speak(farLine, language, soundRef.current)
  }

  function toggleLocate() {
    if (locating) {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
      setLocating(false)
      return
    }
    if (!navigator.geolocation) {
      setLocError('unsupported')
      return
    }
    setLocError(null)
    setLocating(true)
    spokenRef.current = ''
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const here = { lat: position.coords.latitude, lng: position.coords.longitude }
        setUserPos(here)
        announceHere(here)
      },
      (error) => {
        setLocError(error.code === 1 ? 'denied' : 'unavailable')
        setLocating(false)
        if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
        watchRef.current = null
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 12000 },
    )
  }

  function locateForReport() {
    if (!navigator.geolocation) {
      setLocError('unsupported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const here = { lat: position.coords.latitude, lng: position.coords.longitude }
        setUserPos(here)
        setLocError(null)
        setDraft({ ...here, label: text.myLocation, prefillTitle: text.nearMeTitle })
      },
      (error) => setLocError(error.code === 1 ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  useEffect(() => {
    if (!selectedId) return
    if (skipSpeak.current) {
      skipSpeak.current = false
      return
    }
    const pin = pins.find((item) => item.id === selectedId)
    if (!pin) return
    const shown = displayPin(pin, lang)
    const line = `${shown.title}. ${verdictLabel(pin, lang)}. ${shown.affects ?? shown.note}`
    setCaption(line)
    speak(line, lang, soundRef.current)
  }, [selectedId, lang, pins])

  useEffect(() => {
    if (selectedId) return
    setCaption('')
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    if (skipScroll.current) {
      // Location-driven selection should not hide the answer card at the top.
      skipScroll.current = false
      return
    }
    if (walkStep >= 0) {
      // The demo reads from the top card; do not let the list push it offscreen.
      bodyRef.current?.scrollTo({ top: 0 })
      return
    }
    document.getElementById(`pin-${selectedId}`)?.scrollIntoView({ block: 'nearest' })
  }, [selectedId, walkStep])

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
    showToast(text.toastReported)
  }

  function toggleStatus(id: string) {
    const pin = pins.find((item) => item.id === id)
    if (!pin) return
    const wasOpen = pin.status === 'open'
    setPins((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: wasOpen ? 'fixed' : 'open' } : item,
      ),
    )
    showToast(wasOpen ? text.toastMarkedFixed : text.toastReportedAgain, () => {
      setPins((current) =>
        current.map((item) => (item.id === id ? { ...item, status: pin.status } : item)),
      )
    })
  }

  function resetCampus() {
    setPins(SEED_PINS.map((pin) => ({ ...pin })))
    setSelectedId(null)
    setDraft(null)
    setTypeFilter('all')
    setStatusFilter('all')
    setReporting(false)
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
    watchRef.current = null
    setLocating(false)
    setUserPos(null)
    setLocError(null)
    setAudience('student')
    setWalkStep(-1)
    setCaption('')
    setConfirmReset(false)
    showToast(text.toastRestored)
  }

  const ordered = useMemo(() => repairOrder(pins), [pins])
  const firstFix = ordered.find((pin) => pin.status === 'open') ?? null
  const selectedPin = selectedId ? (pins.find((pin) => pin.id === selectedId) ?? null) : null
  const featured = selectedPin ?? firstFix
  const walk = walkStep >= 0 ? WALKTHROUGH[walkStep] : null
  const liveLine = walk
    ? `${text[walk.key]}${caption ? ` ${caption}` : ''}`
    : caption

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

  const nearestOpen = useMemo(() => {
    if (!userPos) return null
    let nearest: AccessPin | null = null
    let meters = Number.POSITIVE_INFINITY
    for (const pin of shown) {
      if (pin.status !== 'open') continue
      const distance = distanceMeters(userPos.lat, userPos.lng, pin.lat, pin.lng)
      if (distance < meters) {
        meters = distance
        nearest = pin
      }
    }
    return nearest ? { pin: nearest, meters } : null
  }, [shown, userPos])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <p className="eyebrow">Neighborhood Hacks 2026</p>
          <h1>AccessMap</h1>
        </div>
        <div className="campus-block">
          <div className="langs">
            <button type="button" className={lang === 'en' ? 'is-on' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
            <button type="button" className={lang === 'zh' ? 'is-on' : ''} aria-pressed={lang === 'zh'} onClick={() => setLang('zh')}>中文</button>
            <button
              type="button"
              className={sound ? 'is-on' : ''}
              aria-pressed={sound}
              title={sound ? text.voiceOff : text.voiceOn}
              onClick={() => setSound((current) => !current)}
            >
              {text.voice}
            </button>
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
            userPos={userPos}
            draft={draft}
            reporting={reporting}
            selectedId={selectedId}
            focusZoom={walkStep >= 0 ? 17 : 16}
            onPickLocation={(lat, lng) => setDraft({ lat, lng })}
            onSelect={setSelectedId}
            onToggleStatus={toggleStatus}
          />
          <p className="map-legend">{text.legend}</p>
        </div>

        <aside className="sidebar">
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {liveLine}
          </p>
          <div className="sidebar-body" ref={bodyRef}>
            {draft ? (
              <AddPinForm
                lang={lang}
                draftLat={draft.lat}
                draftLng={draft.lng}
                defaultTitle={draft.prefillTitle ?? ''}
                placeLabel={draft.label}
                onSubmit={addPin}
              />
            ) : null}
            {reporting && !draft ? (
              <section className="report-picker" aria-label={text.pickPlace}>
                <p className="picker-title">{text.pickPlace}</p>
                <div className="picker-chips">
                  {pins.map((pin) => (
                    <button
                      key={pin.id}
                      type="button"
                      className="chip"
                      onClick={() =>
                        setDraft({
                          lat: pin.lat,
                          lng: pin.lng,
                          label: displayPin(pin, lang).title,
                          prefillTitle: displayPin(pin, lang).title,
                        })
                      }
                    >
                      {displayPin(pin, lang).title}
                    </button>
                  ))}
                  <button type="button" className="chip locate-chip" onClick={locateForReport}>
                    {text.useMyLocation}
                  </button>
                </div>
                <p className="picker-hint">{text.orTapMap}</p>
              </section>
            ) : null}
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
            <p className="kicker">
              {walk
                ? `${text.demo} ${walkStep + 1} / 3`
                : selectedPin
                  ? text.selectedPlace
                  : text.thisWeek}
            </p>
            <h2>
              {walk
                ? walk.audience === 'school'
                  ? text.gateRamp
                  : displayPin(pins.find((pin) => pin.id === walk.pinId) ?? pins[0], lang).title
                : featured
                  ? displayPin(featured, lang).title
                  : text.allClear}
            </h2>
            {caption && !walk ? <p className="speaking">{text.speaking}</p> : null}
            <p className="story">
              {walk
                ? text[walk.key]
                : caption
                  ? caption
                  : featured
                    ? displayPin(featured, lang).affects
                    : text.allClear}
            </p>
            {walk && caption ? (
              <p className="spoken-line">
                <span>{text.speaking}</span>
                {caption}
              </p>
            ) : null}
            {walk ? (
              <div className="walk-dots" aria-hidden="true">
                {WALKTHROUGH.map((beat, index) => (
                  <span
                    key={beat.key}
                    className={index === walkStep ? 'is-on' : index < walkStep ? 'is-done' : ''}
                  />
                ))}
              </div>
            ) : null}
            <button type="button" className="text-btn" onClick={playNext}>
              <span>
                {walkStep < 0 ? text.walk : walkStep === WALKTHROUGH.length - 1 ? text.replay : text.next}
              </span>
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
                aria-pressed={statusFilter === value}
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
              aria-pressed={typeFilter === 'all'}
              onClick={() => setTypeFilter('all')}
            >
              {text.allTypes}
            </button>
            {BARRIER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={typeFilter === type ? 'chip is-on' : 'chip'}
                aria-pressed={typeFilter === type}
                onClick={() => setTypeFilter(type)}
              >
                {text.type[type]}
              </button>
            ))}
          </div>

          {nearestOpen ? (
            <button
              type="button"
              className="nearby"
              onClick={() => setSelectedId(nearestOpen.pin.id)}
            >
              <span className="nearby-label">{text.nearestBarrier}</span>
              <span className="nearby-value">
                {displayPin(nearestOpen.pin, lang).title} ·{' '}
                {formatDistance(nearestOpen.meters, lang)}
              </span>
            </button>
          ) : null}

          <ul className="place-list" aria-label={text.placesLabel}>
            {shown.length === 0 ? (
              <li className="empty">{text.empty}</li>
            ) : (
              shown.map((pin) => {
                const verdict = placeVerdict(pin)
                const shownPin = displayPin(pin, lang)
                const open = pin.id === selectedId
                const away = userPos
                  ? formatDistance(
                      distanceMeters(userPos.lat, userPos.lng, pin.lat, pin.lng),
                      lang,
                    )
                  : null
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
                          {away ? ` · ${away}` : ''}
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

            {confirmReset ? (
              <div className="reset-confirm" role="alertdialog" aria-label={text.resetConfirmTitle}>
                <p>{text.resetConfirm}</p>
                <div className="action-row">
                  <button type="button" className="btn" onClick={resetCampus}>
                    {text.confirmReset}
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setConfirmReset(false)}
                  >
                    {text.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn ghost reset"
                onClick={() => setConfirmReset(true)}
              >
                {text.reset}
              </button>
            )}
          </div>

          <div className="sidebar-dock">
            {toast ? (
              <div className="toast-inline" role="status" aria-live="polite">
                <span>{toast.message}</span>
                {toast.undo ? (
                  <button
                    type="button"
                    onClick={() => {
                      toast.undo?.()
                      setToast(null)
                    }}
                  >
                    {text.undo}
                  </button>
                ) : null}
              </div>
            ) : null}
            {draft ? (
              <>
                <div className="action-row">
                  <button type="submit" form="add-pin-form" className="btn primary">
                    {text.save}
                  </button>
                  <button type="button" className="btn" onClick={() => setDraft(null)}>
                    {text.cancel}
                  </button>
                </div>
                <p className="hint">{text.hintPlace}</p>
              </>
            ) : (
              <>
                <div className="action-row">
                  <button
                    type="button"
                    className={reporting ? 'btn' : 'btn primary'}
                    aria-pressed={reporting}
                    onClick={() => {
                      setReporting((current) => !current)
                      setDraft(null)
                      setWalkStep(-1)
                    }}
                  >
                    {reporting ? text.cancelReport : text.report}
                  </button>
                  <button
                    type="button"
                    className={locating ? 'btn primary' : 'btn'}
                    aria-pressed={locating}
                    onClick={toggleLocate}
                  >
                    {locating ? text.stopLocate : text.locate}
                  </button>
                </div>

                <p className="hint">
                  {locError === 'denied'
                    ? text.locDenied
                    : locError === 'unsupported'
                      ? text.locUnsupported
                      : locError === 'unavailable'
                        ? text.locUnavailable
                        : reporting
                          ? text.hintReporting
                          : userPos
                            ? nearestOpen && nearestOpen.meters < 120
                              ? text.nearPlace(
                                  displayPin(nearestOpen.pin, lang).title,
                                  formatDistance(nearestOpen.meters, lang),
                                )
                              : text.away(formatDistance(distanceMeters(userPos.lat, userPos.lng, CAMPUS_CENTER[0], CAMPUS_CENTER[1]), lang))
                            : text.hintIdle}
                </p>
              </>
            )}

            {saveError ? <p className="error" role="alert">{text.saveError}</p> : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
