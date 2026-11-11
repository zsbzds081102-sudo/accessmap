import { useEffect, useRef, useState, type FormEvent } from 'react'
import { t, type Lang } from '../i18n'
import {
  BARRIER_TYPES,
  type AccessPin,
  type BarrierType,
} from '../types'

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read photo'))
    reader.onload = () => {
      const source = reader.result
      if (typeof source !== 'string') {
        reject(new Error('Could not read photo'))
        return
      }
      const image = new Image()
      image.onload = () => {
        const maxEdge = 960
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        if (!context) {
          resolve(source)
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.72))
        } catch {
          reject(new Error('Could not encode photo'))
        }
      }
      image.onerror = () => reject(new Error('Could not read photo'))
      image.src = source
    }
    reader.readAsDataURL(file)
  })
}

interface AddPinFormProps {
  lang: Lang
  draftLat: number | null
  draftLng: number | null
  defaultTitle?: string
  placeLabel?: string
  coordinateSystem?: AccessPin['coordinateSystem']
  onSubmit: (pin: Omit<AccessPin, 'id' | 'createdAt' | 'status'>) => void
}

export function AddPinForm({
  lang,
  draftLat,
  draftLng,
  defaultTitle,
  placeLabel,
  coordinateSystem,
  onSubmit,
}: AddPinFormProps) {
  const text = t(lang)
  const [title, setTitle] = useState(defaultTitle ?? '')
  const titleEdited = useRef(false)
  const [type, setType] = useState<BarrierType>('stairs')
  const [note, setNote] = useState('')
  const [observedOn, setObservedOn] = useState('')
  const [observationSource, setObservationSource] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>()
  const [photoState, setPhotoState] = useState<'idle' | 'loading' | 'error'>('idle')
  const photoInput = useRef<HTMLInputElement>(null)
  const photoRequest = useRef(0)

  useEffect(() => {
    // A new picker choice should retitle the form unless the visitor typed one.
    if (!titleEdited.current) setTitle(defaultTitle ?? '')
  }, [defaultTitle])

  if (draftLat == null || draftLng == null) return null

  function handlePhoto(file: File | undefined) {
    const request = ++photoRequest.current
    setPhotoDataUrl(undefined)
    setPhotoState(file ? 'loading' : 'idle')
    if (!file) return
    void compressPhoto(file).then((photo) => {
      if (request !== photoRequest.current) return
      setPhotoDataUrl(photo)
      setPhotoState('idle')
    }).catch(() => {
      if (request === photoRequest.current) setPhotoState('error')
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (photoState !== 'idle') return
    if (!title.trim() || !note.trim() || draftLat == null || draftLng == null) return
    onSubmit({
      title: title.trim(),
      type,
      note: note.trim(),
      observedOn: observedOn || undefined,
      observationSource: observationSource.trim() || undefined,
      lat: draftLat,
      lng: draftLng,
      photoDataUrl,
      coordinateSystem,
    })
  }

  return (
    <form
      id="add-pin-form"
      className="add-form"
      tabIndex={-1}
      onSubmit={handleSubmit}
    >
      <h3>{text.formTitle}</h3>
      <p className="muted">
        {text.formWhere}:{' '}
        {placeLabel ?? `${draftLat.toFixed(5)}, ${draftLng.toFixed(5)}`}
      </p>
      <label>
        {text.formName}
        <input
          value={title}
          onChange={(e) => {
            titleEdited.current = true
            setTitle(e.target.value)
          }}
          placeholder={text.formNamePh}
          required
        />
      </label>
      <label>
        {text.formType}
        <select
          value={type}
          onChange={(e) => setType(e.target.value as BarrierType)}
        >
          {BARRIER_TYPES.map((t) => (
            <option key={t} value={t}>
              {text.type[t]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {text.formNote}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={text.formNotePh}
          rows={3}
          required
        />
      </label>
      <label>
        {text.observedOn} ({text.optional})
        <input type="date" value={observedOn} onChange={(event) => setObservedOn(event.target.value)} />
      </label>
      <label>
        {text.observationSource} ({text.optional})
        <input
          value={observationSource}
          onChange={(event) => setObservationSource(event.target.value)}
          placeholder={text.sourcePlaceholder}
        />
      </label>
      <label>
        {text.formPhoto}
        <input
          type="file"
          ref={photoInput}
          accept="image/*"
          onChange={(e) => handlePhoto(e.target.files?.[0])}
        />
      </label>
      {photoState === 'loading' ? <p role="status">{text.photoLoading}</p> : null}
      {photoState === 'error' ? <p role="alert">{text.photoError}</p> : null}
      {photoDataUrl || photoState !== 'idle' ? (
        <button type="button" className="btn" onClick={() => {
          if (photoInput.current) photoInput.current.value = ''
          handlePhoto(undefined)
          photoInput.current?.focus()
        }}>
          {text.removePhoto}
        </button>
      ) : null}
      {photoDataUrl ? (
        <img src={photoDataUrl} alt={text.photoPreview} className="photo-preview" />
      ) : null}
    </form>
  )
}
