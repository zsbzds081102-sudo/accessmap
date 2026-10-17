import { useState, type FormEvent } from 'react'
import {
  BARRIER_TYPE_LABELS,
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
  draftLat: number | null
  draftLng: number | null
  onCancel: () => void
  onSubmit: (pin: Omit<AccessPin, 'id' | 'createdAt' | 'status'>) => void
}

export function AddPinForm({
  draftLat,
  draftLng,
  onCancel,
  onSubmit,
}: AddPinFormProps) {
  const [title, setTitle] = useState('')
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
    <form className="panel-card add-form" onSubmit={handleSubmit}>
      <h3>Add barrier pin</h3>
      <p className="muted">
        Location: {draftLat.toFixed(5)}, {draftLng.toFixed(5)}
      </p>
      <label>
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. East entrance stairs"
          required
        />
      </label>
      <label>
        Type
        <select
          value={type}
          onChange={(e) => setType(e.target.value as BarrierType)}
        >
          {BARRIER_TYPES.map((t) => (
            <option key={t} value={t}>
              {BARRIER_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Note
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe the barrier…"
          rows={3}
          required
        />
      </label>
      <label>
        Photo (optional)
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handlePhoto(e.target.files?.[0])}
        />
      </label>
      {photoDataUrl ? (
        <img src={photoDataUrl} alt="Preview" className="photo-preview" />
      ) : null}
      <div className="row-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary">
          Save pin
        </button>
      </div>
    </form>
  )
}
