export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(a))
}

export function formatDistance(meters: number, lang: 'en' | 'zh'): string {
  if (meters < 1000) {
    const rounded = Math.max(1, Math.round(meters))
    if (lang === 'zh') return `${rounded}米`
    return `${rounded} ${rounded === 1 ? 'meter' : 'meters'}`
  }
  const kilometers = meters / 1000
  const rounded = kilometers < 10 ? kilometers.toFixed(1) : String(Math.round(kilometers))
  if (lang === 'zh') return `${rounded}公里`
  return `${rounded} ${Number(rounded) === 1 ? 'kilometer' : 'kilometers'}`
}

export interface MapPosition {
  lat: number
  lng: number
  accuracy: number
}

export const NEARBY_METERS = 120

/** Convert only at the browser geolocation boundary. Gaode map clicks are already in map coordinates. */
export function geolocationToMapPosition(
  coords: Pick<GeolocationCoordinates, 'latitude' | 'longitude' | 'accuracy'>,
): MapPosition {
  const { latitude: lat, longitude: lng, accuracy } = coords
  // The offline GCJ-02 approximation uses a coarse mainland bounding box.
  if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) {
    return { lat, lng, accuracy }
  }

  const x = lng - 105
  const y = lat - 35
  const shared = 20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)
  const latitudeOffset = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y
    + 0.2 * Math.sqrt(Math.abs(x))
    + (shared + 20 * Math.sin(y * Math.PI) + 40 * Math.sin(y * Math.PI / 3)
      + 160 * Math.sin(y * Math.PI / 12) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3
  const longitudeOffset = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y
    + 0.1 * Math.sqrt(Math.abs(x))
    + (shared + 20 * Math.sin(x * Math.PI) + 40 * Math.sin(x * Math.PI / 3)
      + 150 * Math.sin(x * Math.PI / 12) + 300 * Math.sin(x * Math.PI / 30)) * 2 / 3

  const axis = 6378245
  const eccentricitySquared = 0.006693421622965943
  const radians = lat * Math.PI / 180
  const sinLatitude = Math.sin(radians)
  const meridian = 1 - eccentricitySquared * sinLatitude * sinLatitude
  const root = Math.sqrt(meridian)

  return {
    lat: lat + latitudeOffset * 180 * meridian * root / (axis * (1 - eccentricitySquared) * Math.PI),
    lng: lng + longitudeOffset * 180 * root / (axis * Math.cos(radians) * Math.PI),
    accuracy,
  }
}

export function isNearby(meters: number, accuracy: number): boolean {
  return meters + accuracy < NEARBY_METERS
}
