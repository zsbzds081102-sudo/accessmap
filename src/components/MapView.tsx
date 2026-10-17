import { useEffect, useRef } from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import { CAMPUS_CENTER } from '../seed'
import {
  BARRIER_TYPE_LABELS,
  STATUS_LABELS,
  placeVerdict,
  type AccessPin,
  type BarrierType,
} from '../types'

const TYPE_COLORS: Record<BarrierType, string> = {
  stairs: '#b42318',
  no_ramp: '#c2410c',
  elevator_broken: '#7e22ce',
  other: '#1d4ed8',
}

const TYPE_GLYPH: Record<BarrierType, string> = {
  stairs: '阶',
  no_ramp: '坡',
  elevator_broken: '梯',
  other: '其',
}

function pinIcon(type: BarrierType, status: AccessPin['status'], selected: boolean) {
  const color = status === 'fixed' ? '#067647' : TYPE_COLORS[type]
  const glyph = status === 'fixed' ? '通' : TYPE_GLYPH[type]
  const size = selected ? 44 : 36
  return L.divIcon({
    className: 'access-pin-icon',
    html: `<span class="pin-face${selected ? ' is-selected' : ''}" style="background:${color};width:${size}px;height:${size}px">${glyph}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const draftIcon = L.divIcon({
  className: 'access-pin-icon',
  html: '<span class="pin-face is-draft">新</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
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
        if (target.closest('.leaflet-popup, .leaflet-marker-icon, .leaflet-control')) {
          return
        }
      }
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function FocusSelected({
  pins,
  selectedId,
}: {
  pins: AccessPin[]
  selectedId: string | null
}) {
  const map = useMap()
  const pinsRef = useRef(pins)
  pinsRef.current = pins

  useEffect(() => {
    if (!selectedId) return
    const pin = pinsRef.current.find((item) => item.id === selectedId)
    if (!pin) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.flyTo([pin.lat, pin.lng], Math.max(map.getZoom(), 16), {
      duration: reduceMotion ? 0 : 0.45,
    })
  }, [map, selectedId])

  return null
}

function PinMarker({
  pin,
  selected,
  onSelect,
  onToggleStatus,
}: {
  pin: AccessPin
  selected: boolean
  onSelect: (id: string) => void
  onToggleStatus: (id: string) => void
}) {
  return (
    <Marker
      position={[pin.lat, pin.lng]}
      icon={pinIcon(pin.type, pin.status, selected)}
      title={`${pin.title}，${placeVerdict(pin).label}`}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(pin.id) }}
    >
      <Popup>
        <strong>{pin.title}</strong>
        <br />
        {placeVerdict(pin).label}
        <br />
        {BARRIER_TYPE_LABELS[pin.type]} · {STATUS_LABELS[pin.status]}
        <br />
        {pin.note}
        {pin.photoDataUrl ? (
          <>
            <br />
            <img src={pin.photoDataUrl} alt={`${pin.title}的照片`} className="popup-photo" />
          </>
        ) : null}
        <br />
        <button
          type="button"
          className="btn popup-toggle"
          onClick={() => onToggleStatus(pin.id)}
        >
          {pin.status === 'open' ? '标成已经修好' : '又遇到问题了'}
        </button>
      </Popup>
    </Marker>
  )
}

interface MapViewProps {
  pins: AccessPin[]
  draft: { lat: number; lng: number } | null
  reporting: boolean
  selectedId: string | null
  onPickLocation: (lat: number, lng: number) => void
  onSelect: (id: string) => void
  onToggleStatus: (id: string) => void
}

export function MapView({
  pins,
  draft,
  reporting,
  selectedId,
  onPickLocation,
  onSelect,
  onToggleStatus,
}: MapViewProps) {
  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={16}
      className={reporting ? 'map-container is-reporting' : 'map-container'}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.amap.com/">高德地图</a>'
        url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
        subdomains="1234"
        maxZoom={18}
      />
      <ClickToAdd enabled={reporting} onPick={onPickLocation} />
      <FocusSelected pins={pins} selectedId={selectedId} />
      {draft ? (
        <Marker position={[draft.lat, draft.lng]} icon={draftIcon} />
      ) : null}
      {pins.map((pin) => (
        <PinMarker
          key={pin.id}
          pin={pin}
          selected={selectedId === pin.id}
          onSelect={onSelect}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </MapContainer>
  )
}
