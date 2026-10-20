import { useEffect, useRef } from 'react'
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import { distanceMeters } from '../geo'
import { displayPin, pinGlyph, t, verdictLabel, type Lang } from '../i18n'
import { CAMPUS_BOUNDS, CAMPUS_CENTER } from '../seed'
import { placeVerdict, type AccessPin } from '../types'

const TOUCH =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const PIN_SIZE = TOUCH ? 44 : 36
const PIN_SIZE_SELECTED = TOUCH ? 54 : 46

function pinIcon(pin: AccessPin, lang: Lang, selected: boolean) {
  const color = placeVerdict(pin).ok ? '#111111' : '#d0121a'
  const size = selected ? PIN_SIZE_SELECTED : PIN_SIZE
  return L.divIcon({
    className: 'access-pin-icon',
    html: `<span class="pin-face${selected ? ' is-selected' : ''}" style="background:${color};width:${size}px;height:${size}px">${pinGlyph(pin, lang)}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const draftIcon = L.divIcon({
  className: 'access-pin-icon draft-pin',
  html: `<span class="pin-face is-draft" style="width:${PIN_SIZE}px;height:${PIN_SIZE}px">+</span>`,
  iconSize: [PIN_SIZE, PIN_SIZE],
  iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2],
})

function ClickToAdd({
  enabled,
  onPick,
}: {
  enabled: boolean
  onPick: (lat: number, lng: number) => void
}) {
  const ignoreClick = useRef(false)

  useMapEvents({
    popupclose() {
      ignoreClick.current = true
      window.setTimeout(() => {
        ignoreClick.current = false
      }, 0)
    },
    click(event) {
      if (!enabled || ignoreClick.current) return
      const target = event.originalEvent.target
      if (target instanceof Element) {
        if (target.closest('.leaflet-popup, .leaflet-control')) return
        // The draft pin itself is not interactive, so a click on it should still
        // move the pin. Real pins are excluded here: they select the place.
        const marker = target.closest('.leaflet-marker-icon')
        if (marker && !marker.classList.contains('draft-pin')) return
      }
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function FollowUser({
  position,
}: {
  position: { lat: number; lng: number } | null
}) {
  const map = useMap()
  const seen = useRef<string>('')

  useEffect(() => {
    if (!position) return
    const away = distanceMeters(position.lat, position.lng, CAMPUS_CENTER[0], CAMPUS_CENTER[1])
    if (away > 3000) return
    const key = `${position.lat.toFixed(4)},${position.lng.toFixed(4)}`
    if (seen.current === key) return
    seen.current = key
    map.panTo([position.lat, position.lng])
  }, [map, position])

  return null
}

function FocusSelected({
  pins,
  selectedId,
  focusZoom,
}: {
  pins: AccessPin[]
  selectedId: string | null
  focusZoom: number
}) {
  const map = useMap()
  const pinsRef = useRef(pins)
  pinsRef.current = pins

  useEffect(() => {
    if (!selectedId) return
    const pin = pinsRef.current.find((item) => item.id === selectedId)
    if (!pin) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.flyTo([pin.lat, pin.lng], Math.max(map.getZoom(), focusZoom), {
      duration: reduceMotion ? 0 : 0.45,
    })
  }, [map, selectedId, focusZoom])

  return null
}

function PinMarker({
  pin,
  lang,
  selected,
  onSelect,
  onToggleStatus,
}: {
  pin: AccessPin
  lang: Lang
  selected: boolean
  onSelect: (id: string) => void
  onToggleStatus: (id: string) => void
}) {
  const text = t(lang)
  const shown = displayPin(pin, lang)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    const element = markerRef.current?.getElement()
    if (!element) return
    element.setAttribute(
      'aria-label',
      `${shown.title}. ${verdictLabel(pin, lang)}. ${text.type[pin.type]}`,
    )
    // Leaflet makes the marker focusable but does not activate it from the
    // keyboard, so Enter and Space select it like a native button.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      onSelect(pin.id)
    }
    element.addEventListener('keydown', onKeyDown)
    return () => element.removeEventListener('keydown', onKeyDown)
  }, [shown.title, pin, lang, text.type, selected, onSelect])

  return (
    <Marker
      ref={markerRef}
      position={[pin.lat, pin.lng]}
      icon={pinIcon(pin, lang, selected)}
      title={`${shown.title}. ${verdictLabel(pin, lang)}`}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(pin.id) }}
    >
      <Popup>
        <strong>{shown.title}</strong>
        <br />
        {verdictLabel(pin, lang)}
        <br />
        {text.type[pin.type]} · {text.status[pin.status]}
        <br />
        {shown.note}
        {pin.photoDataUrl ? (
          <>
            <br />
            <img src={pin.photoDataUrl} alt={`${shown.title} ${text.photoAlt}`} className="popup-photo" />
          </>
        ) : null}
        <br />
        <button
          type="button"
          className="btn popup-toggle"
          onClick={() => onToggleStatus(pin.id)}
        >
          {pin.status === 'open' ? text.markFixed : text.reopen}
        </button>
      </Popup>
    </Marker>
  )
}

interface MapViewProps {
  pins: AccessPin[]
  lang: Lang
  userPos: { lat: number; lng: number } | null
  draft: { lat: number; lng: number } | null
  reporting: boolean
  selectedId: string | null
  focusZoom: number
  onPickLocation: (lat: number, lng: number) => void
  onSelect: (id: string) => void
  onToggleStatus: (id: string) => void
}

export function MapView({
  pins,
  lang,
  userPos,
  draft,
  reporting,
  selectedId,
  focusZoom,
  onPickLocation,
  onSelect,
  onToggleStatus,
}: MapViewProps) {
  return (
    <div
      className={reporting ? 'map-frame is-reporting' : 'map-frame'}
      role="region"
      aria-label={t(lang).mapLabel}
    >
      <MapContainer
        bounds={CAMPUS_BOUNDS}
        boundsOptions={{ padding: [56, 56], maxZoom: 17 }}
        className="map-container"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.amap.com/">高德地图</a>'
          url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
          subdomains="1234"
          maxZoom={18}
        />
        <ClickToAdd enabled={reporting} onPick={onPickLocation} />
        <FocusSelected pins={pins} selectedId={selectedId} focusZoom={focusZoom} />
        <FollowUser position={userPos} />
        {userPos ? (
          <CircleMarker
            center={[userPos.lat, userPos.lng]}
            radius={7}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#111111', fillOpacity: 1 }}
          />
        ) : null}
        {draft ? (
          <Marker
            position={[draft.lat, draft.lng]}
            icon={draftIcon}
            interactive={false}
            keyboard={false}
          />
        ) : null}
        {pins.map((pin) => (
          <PinMarker
            key={pin.id}
            pin={pin}
            lang={lang}
            selected={selectedId === pin.id}
            onSelect={onSelect}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </MapContainer>
    </div>
  )
}
