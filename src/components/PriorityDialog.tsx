import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { displayPin, t, type Lang } from '../i18n'
import { buildRepairCsv, buildRepairPriorities, buildRepairText, repairOrder } from '../repair'
import type { AccessPin } from '../types'

interface PriorityDialogProps {
  open: boolean
  pins: AccessPin[]
  lang: Lang
  onClose: () => void
}

function fallbackCopy(value: string): boolean {
  const area = document.createElement('textarea')
  area.value = value
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  return ok
}

export function PriorityDialog({ open, pins, lang, onClose }: PriorityDialogProps) {
  const text = t(lang)
  const panelRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const copyRef = useRef<HTMLButtonElement | null>(null)
  const copyTimer = useRef<number | null>(null)
  const [copied, setCopied] = useState(false)

  const priorities = useMemo(() => buildRepairPriorities(pins, lang), [pins, lang])
  const fixed = useMemo(
    () => repairOrder(pins).filter((pin) => pin.status === 'fixed'),
    [pins],
  )
  const plainText = useMemo(() => buildRepairText(pins, lang), [pins, lang])
  const csv = useMemo(() => buildRepairCsv(pins, lang), [pins, lang])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => copyRef.current?.focus(), 0)
    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = oldOverflow
      if (copyTimer.current != null) window.clearTimeout(copyTimer.current)
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const items = panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (!items || items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  async function copyList() {
    let ok = false
    try {
      await navigator.clipboard.writeText(plainText)
      ok = true
    } catch {
      ok = fallbackCopy(plainText)
    }
    if (!ok) return
    setCopied(true)
    if (copyTimer.current != null) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopied(false), 2500)
  }

  function downloadCsv() {
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'accessmap-repair-priorities.csv'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        id="priority-dialog"
        className="priority-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="priority-title"
        aria-describedby="priority-intro"
        ref={panelRef}
        onKeyDown={handleKeyDown}
      >
        <header className="dialog-head">
          <div>
            <p className="kicker">{text.schoolAction}</p>
            <h2 id="priority-title">{text.exportCta}</h2>
            <p id="priority-intro">{text.exportIntro}</p>
          </div>
          <button
            type="button"
            className="dialog-close"
            ref={closeRef}
            aria-label={text.exportClose}
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="dialog-scroll">
        <div className="dialog-meta">
          <span>{text.exportOpen(priorities.length)}</span>
          <span>{text.campus}</span>
        </div>

        {priorities.length > 0 ? (
          <ol className="priority-list">
            {priorities.map((item) => (
              <li key={item.pin.id}>
                <span className="priority-rank" aria-hidden="true">
                  {item.rank}
                </span>
                <div className="priority-copy">
                  <p className="priority-title">
                    {item.title}
                    <span className="priority-type">{text.type[item.pin.type]}</span>
                  </p>
                  <p>
                    <strong>{text.exportBlocks}:</strong> {item.blocks}
                  </p>
                  <p className="priority-note">
                    <strong>{text.exportNote}:</strong> {item.note}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="priority-empty">{text.exportEmpty}</p>
        )}

        <p className="priority-fixed">
          <strong>{text.exportAlready}:</strong>{' '}
          {fixed.length > 0
            ? fixed.map((pin) => displayPin(pin, lang).title).join(', ')
            : '—'}
        </p>

        <p className="dialog-note">
          {text.exportNoAccount} {text.exportFooter}
        </p>
        </div>

        <div className="dialog-actions">
          <button type="button" className="btn primary" ref={copyRef} onClick={() => void copyList()}>
            {copied ? text.exportCopied : text.exportCopy}
          </button>
          <button type="button" className="btn" onClick={downloadCsv}>
            {text.exportCsv}
          </button>
          <button type="button" className="btn" onClick={() => window.print()}>
            {text.exportPrint}
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            {text.exportClose}
          </button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {copied ? text.exportCopied : ''}
        </p>
      </section>
    </div>
  )
}
