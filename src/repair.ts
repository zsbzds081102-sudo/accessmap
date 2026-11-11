import { displayPin, observationEvidence, t, type Lang } from './i18n'
import type { AccessPin, BarrierType } from './types'

/**
 * Repair order used by the school view and the exported list.
 * Severity is about access, not about how loud a report is:
 * a missing ramp or a broken elevator removes a whole route, stairs
 * remove the upper floors, and "other" is kept last until reviewed.
 */
const SEVERITY: Record<BarrierType, number> = {
  no_ramp: 4,
  elevator_broken: 4,
  stairs: 2,
  other: 1,
}

export function repairOrder(pins: AccessPin[]): AccessPin[] {
  return [...pins].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1
    const severity = SEVERITY[b.type] - SEVERITY[a.type]
    if (severity !== 0) return severity
    // Within one severity band, a student report is more current than the
    // seeded demo places. This keeps the weekly list responsive.
    const aSeed = a.id.startsWith('seed-')
    const bSeed = b.id.startsWith('seed-')
    if (aSeed !== bSeed) return aSeed ? 1 : -1
    const priority = (a.priority ?? 50) - (b.priority ?? 50)
    if (priority !== 0) return priority
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export interface RepairPriority {
  pin: AccessPin
  rank: number
  title: string
  blocks: string
  note: string
}

export function buildRepairPriorities(pins: AccessPin[], lang: Lang): RepairPriority[] {
  const text = t(lang)
  return repairOrder(pins)
    .filter((pin) => pin.status === 'open')
    .map((pin, index) => {
      const shown = displayPin(pin, lang)
      return {
        pin,
        rank: index + 1,
        title: shown.title,
        blocks: shown.affects ?? text.type[pin.type],
        note: shown.note,
      }
    })
}

function formatDate(lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date())
}

export function buildRepairText(pins: AccessPin[], lang: Lang): string {
  const text = t(lang)
  const priorities = buildRepairPriorities(pins, lang)
  const fixed = repairOrder(pins)
    .filter((pin) => pin.status === 'fixed')
    .map((pin) => displayPin(pin, lang).title)
  const lines: string[] = [
    `AccessMap — ${text.campus}`,
    `${text.exportCta} · ${formatDate(lang)}`,
    '',
    text.exportIntro,
    '',
  ]

  if (priorities.length === 0) {
    lines.push(text.exportEmpty)
  } else {
    for (const item of priorities) {
      lines.push(`${item.rank}. ${item.title} — ${text.type[item.pin.type]}`)
      lines.push(`   ${text.exportBlocks}: ${item.blocks}`)
      lines.push(`   ${text.exportNote}: ${item.note}`)
      const evidence = observationEvidence(item.pin, lang)
      lines.push(`   ${text.recordId}: ${item.pin.id} · ${evidence.kind}`)
      lines.push(`   ${text.observedOn}: ${evidence.date} · ${text.observationSource}: ${evidence.source}`)
      const coordinates = `${item.pin.lat.toFixed(5)}, ${item.pin.lng.toFixed(5)}`
      lines.push(`   ${text.exportPin}: ${coordinates} · ${item.pin.coordinateSystem ?? text.unknownCoords}`)
      lines.push('')
    }
  }

  lines.push(`${text.exportAlready}: ${fixed.length > 0 ? fixed.join(', ') : '—'}`)
  lines.push('', text.exportNoAccount, text.exportFooter)
  return lines.join('\n')
}

function csvCell(value: string | number): string {
  const normalized = String(value).replace(/[\r\n]+/g, ' ').trim()
  return `"${normalized.replace(/"/g, '""')}"`
}

function spreadsheetText(value: string): string {
  return /^[=+@-]/.test(value.trimStart()) ? `'${value}` : value
}

export function buildRepairCsv(pins: AccessPin[], lang: Lang): string {
  const text = t(lang)
  const header = [
    'priority', 'place', 'barrier', 'blocks', 'student_note', 'latitude', 'longitude',
    'coordinate_system', 'record_id', 'record_kind', 'observed_on', 'observation_source',
  ]
  const rows = buildRepairPriorities(pins, lang).map((item) => {
    const evidence = observationEvidence(item.pin, lang)
    return [
      item.rank,
      spreadsheetText(item.title),
      text.type[item.pin.type],
      spreadsheetText(item.blocks),
      spreadsheetText(item.note),
      item.pin.lat.toFixed(5),
      item.pin.lng.toFixed(5),
      item.pin.coordinateSystem ?? 'unknown',
      spreadsheetText(item.pin.id),
      evidence.kind,
      spreadsheetText(evidence.date),
      spreadsheetText(evidence.source),
    ]
  })
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}
