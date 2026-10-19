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
