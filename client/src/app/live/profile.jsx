// Форма редагування профілю (імʼя, дані народження для натальної карти) і поле міста з підказками.
import { get, patch } from '../../lib/api.js'
import { useEffect, useState } from 'react'
import { t } from '../../i18n/index.js'
import { Field, Modal } from './parts.jsx'

/** Поле «місце народження» з підказками міст (Nominatim через наш сервер): вибір дає координати й країну. */
export function PlaceField({ profile, pick, setPick }) {
  const [text, setText] = useState(profile?.birthPlace ?? '')
  const [options, setOptions] = useState([])
  const [note, setNote] = useState('')
  const stale = pick && pick.name !== text // текст змінили після вибору: координати вже не відповідають
  const searching = text.trim().length >= 3 && pick?.name !== text

  useEffect(() => {
    if (!searching) return undefined
    let live = true
    const timer = setTimeout(() => {
      get(`/cosmos/geo?q=${encodeURIComponent(text.trim())}`)
        .then((rows) => live && (setOptions(rows), setNote(rows.length ? '' : t('Nothing found'))))
        .catch((e) => live && setNote(e.message))
    }, 600)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [text, searching])

  return (
    <>
      <label>
        {t('Place of birth')}
        <input
          value={text}
          maxLength={200}
          autoComplete="off"
          placeholder={t('Start typing a city…')}
          onChange={(e) => {
            setText(e.target.value)
            setOptions([])
            setNote('')
            if (pick && pick.name !== e.target.value) setPick(null)
          }}
        />
      </label>
      <input type="hidden" name="birthPlace" value={text} />
      {searching &&
        options.map((o) => (
          <button type="button" className="opt" key={o.name + o.lat} onClick={() => (setText(o.name), setPick(o), setOptions([]))}>
            {o.name}
          </button>
        ))}
      {searching && note && <p className="hint">{note}</p>}
      {pick && !stale && <p className="hint">📍 {pick.lat.toFixed(2)}, {pick.lon.toFixed(2)}{pick.country ? ` · ${pick.country}` : ''}</p>}
    </>
  )
}

export function ProfileModal({ ctx, profile }) {
  const [pick, setPick] = useState(
    profile?.birthLat != null ? { name: profile.birthPlace, lat: profile.birthLat, lon: profile.birthLon, country: profile.country } : null,
  )
  const save = async (f) => {
    const text = (k) => String(f.get(k)).trim()
    const body = { name: text('name'), birthPlace: text('birthPlace') || null, birthLat: pick?.lat ?? null, birthLon: pick?.lon ?? null, country: pick?.country ?? null }
    for (const k of ['birthDate', 'birthTime']) if (text(k)) body[k] = text(k)
    await patch('/profile', body)
    await ctx.reload()
  }
  return (
    <Modal title={t('Edit profile')} onClose={ctx.closeModal} onSubmit={save}>
      <Field label={t('Name')} name="name" defaultValue={profile?.name} required maxLength={80} />
      <div className="row">
        <Field label={t('Date of birth')} name="birthDate" type="date" defaultValue={profile?.birthDate ?? ''} />
        <Field label={t('Time of birth')} name="birthTime" type="time" defaultValue={profile?.birthTime ?? ''} />
      </div>
      <PlaceField profile={profile} pick={pick} setPick={setPick} />
      <p className="hint">{t('Date is enough for your Sun, Moon and planets. Time and a chosen city add your Ascendant (local time is converted using the city’s time zone).')}</p>
    </Modal>
  )
}

