import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null, ws: false },
  appType: 'custom',
})
after(() => vite.close())

const { loadPins, updatePins, PINS_STORAGE_KEY } = await vite.ssrLoadModule('/src/storage.ts')
const { displayPin, verdictLabel } = await vite.ssrLoadModule('/src/i18n.ts')
const { buildRepairCsv, buildRepairPriorities, buildRepairText } = await vite.ssrLoadModule('/src/repair.ts')
const { geolocationToMapPosition, distanceMeters, isNearby } = await vite.ssrLoadModule('/src/geo.ts')
const { SEED_PINS } = await vite.ssrLoadModule('/src/seed.ts')

const report = {
  id: 'local-test', title: 'Test entrance', type: 'no_ramp', note: 'Wheelchair route blocked.',
  status: 'open', lat: 45.867257, lng: 131.044321, createdAt: '2026-11-12T00:00:00Z',
}
let raw
let readsBlocked
let writeError
let writes

beforeEach(() => {
  raw = null
  readsBlocked = false
  writeError = null
  writes = 0
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem(key) {
        assert.equal(key, PINS_STORAGE_KEY)
        if (readsBlocked) throw new DOMException('Disabled', 'SecurityError')
        return raw
      },
      setItem(key, value) {
        assert.equal(key, PINS_STORAGE_KEY)
        if (writeError) throw new DOMException('Write failed', writeError)
        raw = value
        writes++
      },
    },
  })
})

test('failed writes leave persisted data intact and a retry creates one report', () => {
  assert.equal(loadPins().length, 6)
  assert.equal(writes, 0)
  writeError = 'QuotaExceededError'
  assert.deepEqual(updatePins((pins) => [report, ...pins]), { error: 'quota' })
  assert.equal(raw, null)
  writeError = 'SecurityError'
  assert.deepEqual(updatePins((pins) => [report, ...pins]), { error: 'unavailable' })
  writeError = null
  assert.equal(updatePins((pins) => [report, ...pins]).pins[0].id, report.id)
  assert.equal(loadPins().filter((pin) => pin.id === report.id).length, 1)
  assert.equal(writes, 1)
})

test('a read failure cannot overwrite existing reports with demo data', () => {
  raw = JSON.stringify([report])
  readsBlocked = true
  assert.equal(loadPins().length, 6)
  assert.deepEqual(updatePins((pins) => pins), { error: 'unavailable' })
  readsBlocked = false
  assert.equal(loadPins().at(-1).id, report.id)
  assert.equal(writes, 0)
})

test('passable and blocked-again use the same stored status in priority, speech copy, CSV, and print', () => {
  updatePins((pins) => [report, ...pins])
  function setStatus(status) {
    const result = updatePins((pins) => pins.map((pin) => pin.id === report.id ? { ...pin, status } : pin))
    return result.pins.find((pin) => pin.id === report.id)
  }
  const fixed = setStatus('fixed')
  assert.equal(verdictLabel(fixed, 'en'), 'Marked passable')
  assert.equal(displayPin(fixed, 'en').previousNote, report.note)
  assert.doesNotMatch(displayPin(fixed, 'en').note, /blocked/)
  assert(!buildRepairPriorities(loadPins(), 'en').some(({ pin }) => pin.id === report.id))
  assert.doesNotMatch(buildRepairCsv(loadPins(), 'en'), /Test entrance/)
  assert.match(buildRepairText(loadPins(), 'en'), /Recorded as passable:.*Test entrance/)
  assert.doesNotMatch(buildRepairText(loadPins(), 'en'), /Wheelchair route blocked/)

  const reopened = setStatus('open')
  assert.equal(verdictLabel(reopened, 'en'), 'Blocked')
  assert.equal(displayPin(reopened, 'en').note, report.note)
  assert.equal(buildRepairPriorities(loadPins(), 'en')[0].pin.id, report.id)
  assert.match(buildRepairCsv(loadPins(), 'en'), /Test entrance.*Wheelchair route blocked/)
  assert.match(buildRepairText(loadPins(), 'en'), /1\. Test entrance/)
})

test('legacy demo status overrides do not present old seed observations as current', () => {
  raw = JSON.stringify([
    { ...SEED_PINS[0], status: 'fixed' },
    { ...SEED_PINS[1], status: 'open' },
  ])
  const pins = loadPins()
  for (const lang of ['en', 'zh']) {
    const gate = displayPin(pins.find(({ id }) => id === 'seed-1'), lang)
    assert.equal(gate.affects, undefined)
    assert.ok(gate.previousNote)
    const teaching = buildRepairPriorities(pins, lang).find(({ pin }) => pin.id === 'seed-2')
    assert.match(teaching.note, lang === 'en' ? /cause has yet/ : /原因待补充/)
    assert.doesNotMatch(teaching.blocks, /Already usable|已经能上课/)
  }
})

test('browser position is shifted toward the demo gate while preserving accuracy', () => {
  const gps = { latitude: 45.86527, longitude: 131.03593, accuracy: 8 }
  const gate = SEED_PINS[0]
  const mapped = geolocationToMapPosition(gps)
  assert.equal(mapped.accuracy, 8)
  assert(distanceMeters(gps.latitude, gps.longitude, gate.lat, gate.lng) > 500)
  assert(distanceMeters(mapped.lat, mapped.lng, gate.lat, gate.lng) < 60)
  assert(isNearby(distanceMeters(mapped.lat, mapped.lng, gate.lat, gate.lng), 8))
  assert(!isNearby(distanceMeters(mapped.lat, mapped.lng, gate.lat, gate.lng), 100))
  assert(!isNearby(100, 20))
})

test('coordinates outside the transform bounds are unchanged and old report origin stays unknown', () => {
  assert.deepEqual(geolocationToMapPosition({ latitude: 48.8566, longitude: 2.3522, accuracy: 30 }),
    { lat: 48.8566, lng: 2.3522, accuracy: 30 })
  raw = JSON.stringify([report])
  const pins = loadPins()
  assert.equal(pins.at(-1).lat, report.lat)
  assert.equal(pins.at(-1).lng, report.lng)
  assert.equal(pins.at(-1).coordinateSystem, undefined)
  assert.match(buildRepairCsv(pins, 'en'), /"131\.04432","unknown"/)
  assert.match(buildRepairCsv(pins, 'en'), /"131\.04432","GCJ-02"/)
})

test('report evidence survives reload and exports with its stable ID', () => {
  const dated = {
    ...report, title: '=example', observedOn: '2026-10-24',
    observationSource: 'Test fixture: direct observation', coordinateSystem: 'GCJ-02',
  }
  updatePins((pins) => [dated, ...pins])
  assert.deepEqual(loadPins().find(({ id }) => id === report.id), dated)
  const csv = buildRepairCsv(loadPins(), 'en')
  assert.match(csv, /"record_id","record_kind","observed_on","observation_source"/)
  assert.match(csv, /"'=example".*"local-test","Local report","2026-10-24","Test fixture: direct observation"/)
  assert.match(buildRepairText(loadPins(), 'en'), /Observation date: 2026-10-24 · Evidence source: Test fixture: direct observation/)
  assert.match(csv, /"seed-1","Manual demo point","Unrecorded","Unrecorded"/)
})
