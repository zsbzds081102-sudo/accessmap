import { useState, type FormEvent } from 'react'
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
        resolve(canvas.toDataURL('image/jpeg', 0.72))
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
  onSubmit: (pin: Omit<AccessPin, 'id' | 'createdAt' | 'status'>) => void
}

export function AddPinForm({
  lang,
  draftLat,
  draftLng,
  defaultTitle,
  placeLabel,
  onSubmit,
}: AddPinFormProps) {
  const text = t(lang)
  const [title, setTitle] = useState(defaultTitle ?? '')
  const [type, setType] = useState<BarrierType>('stairs')
  const [note, setNote] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>()

  if (draftLat == null || draftLng == null) return null

  function handlePhoto(file: File | undefined) {
    if (!file) {
      setPhotoDataUrl(undefined)
      return
    }
    void compressPhoto(file).then(setPhotoDataUrl).catch(() => {
      setPhotoDataUrl(undefined)
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !note.trim() || draftLat == null || draftLng == null) return
    onSubmit({
      title: title.trim(),
      type,
      note: note.trim(),
      lat: draftLat,
      lng: draftLng,
      photoDataUrl,
    })
    setTitle('')
    setType('stairs')
    setNote('')
    setPhotoDataUrl(undefined)
  }

  return (
    <form
      id="add-pin-form"
      className="panel-card add-form"
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
          onChange={(e) => setTitle(e.target.value)}
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
        {text.formPhoto}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handlePhoto(e.target.files?.[0])}
        />
      </label>
      {photoDataUrl ? (
        <img src={photoDataUrl} alt="Preview" className="photo-preview" />
      ) : null}
    </form>
  )
}
