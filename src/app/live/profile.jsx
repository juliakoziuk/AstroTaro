// Екрани Profile і Settings + форма редагування профілю (імʼя, дані народження для натальної карти).
import { get, patch, signOut } from '../../lib/api.js'
import { formatDay } from '../format.js'
import { useEffect, useState } from 'react'
import { t } from '../../i18n/index.js'
import { chooseLanguage } from '../../i18n/sync.js'
import { getLang, LANGS, langFromSetting } from '../../i18n/index.js'
import { Field, Modal, Ov, Zone } from './parts.jsx'
import { ReportsDialog } from './reports.jsx'
import { loadSettings, session } from './common.js'

/** Поле «місце народження» з підказками міст (Nominatim через наш сервер): вибір дає координати й країну. */
function PlaceField({ profile, pick, setPick }) {
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

// Налаштування ↔ ідентифікатори контролів на екранах
const TOGGLES = { notif: 'notifications', insights: 'insights', autosave: 'autosave', companion: 'companion' }
const SELECTS = { lang: 'language', theme: 'theme', reading: 'defaultReading', time: 'timeFormat', date: 'dateFormat' }

const settingsUi = (s, ids) => ({
  toggles: Object.fromEntries(ids.filter((id) => id in TOGGLES).map((id) => [id, s[TOGGLES[id]]])),
  selects: Object.fromEntries(ids.filter((id) => id in SELECTS).map((id) => [id, s[SELECTS[id]]])),
})

const saveSetting = {
  onToggle: (id, value) => patch('/settings', { [TOGGLES[id]]: value }),
  onSelect: (id, value) => (id === 'lang' ? chooseLanguage(langFromSetting(value)) : patch('/settings', { [SELECTS[id]]: value })),
}

export const profile = {
  bind: [
    { find: 'Yullia', key: 'name' },
    { find: 'yuliia@example.com', nth: 0, key: 'email' },
    { find: 'Jun 22, 2004', key: 'birth' },
    { find: '24', key: 'readings' },
    { find: '18', key: 'dreams' },
    { find: '5', key: 'reports' },
    { find: 'yuliia@example.com', nth: 1, key: 'email' },
  ],
  async load() {
    const [p, s] = await Promise.all([get('/profile'), loadSettings()])
    return {
      values: {
        name: p.name,
        email: p.email,
        birth: formatDay(p.birthDate, s.dateFormat),
        readings: p.activity.readings,
        dreams: p.activity.dreams,
        reports: p.activity.reports,
      },
      data: { profile: p },
      ui: settingsUi(s, ['notif', 'lang', 'theme']),
    }
  },
  ...saveSetting,
  actions: {
    'Edit Profile': (ctx) => ctx.openModal({ name: 'profile' }),
    'My Reports': (ctx) => ctx.openModal({ name: 'reports' }),
    Reports: (ctx) => ctx.openModal({ name: 'reports' }),
    'Log Out': (ctx) => {
      signOut()
      session.set('readingId', '')
      session.set('dreamId', '')
      ctx.go('/login')
    },
    'Saved Readings': async (ctx) => {
      session.set('historyFilter', 'saved')
      ctx.go('/history')
    },
    Readings: async (ctx) => {
      session.set('historyFilter', 'all')
      ctx.go('/history')
    },
  },
  Over: ({ ctx }) => (
    <>
      {ctx.modal?.name === 'profile' && <ProfileModal ctx={ctx} profile={ctx.data?.profile} />}
      {ctx.modal?.name === 'reports' && <ReportsDialog onClose={ctx.closeModal} />}
    </>
  ),
}

// Вкладки зліва в плиті (x 291, ширина 299): «General» намальована активною, «Language» — четверта
const TAB_GENERAL = [291, 233, 299, 70, 20]
const TAB_LANGUAGE = [291, 460, 299, 70, 20]
const PANEL = [634, 216, 842, 584, 22] // права панель налаштувань (внутрішність)
const COVER = '#091725'

/** Вибір мови: застосовується одразу до інтерфейсу, відповідей AI, карт і тлумачень, і зберігається в акаунті. */
function LanguagePanel({ ctx }) {
  const lang = getLang()
  return (
    <Ov at={PANEL} className="lang-panel" style={{ background: COVER }}>
      <h2>{t('Language')}</h2>
      <p>{t('The language of the interface, readings, interpretations and AI replies.')}</p>
      {LANGS.map((l) => (
        <button key={l.id} type="button" className={`lang-opt${l.id === lang ? ' on' : ''}`} aria-pressed={l.id === lang} onClick={() => chooseLanguage(l.id).catch((e) => ctx.fail(e))}>
          <span>{l.label}</span>
          {l.id === lang && <b aria-hidden="true">✓</b>}
        </button>
      ))}
    </Ov>
  )
}

export const settings = {
  bind: [],
  async load() {
    return { values: {}, ui: settingsUi(await loadSettings(), ['insights', 'autosave', 'companion', 'reading', 'time', 'date']) }
  },
  ...saveSetting,
  // активна вкладка «Language» (стан — у ctx.modal): закриваємо намальовану підсвітку «General» і малюємо свою біля «Language»
  Under: ({ ctx }) =>
    ctx.modal?.name === 'language' ? (
      <>
        <Ov at={TAB_GENERAL} className="row-dim ov-none" />
        <Ov at={TAB_LANGUAGE} className="row-on ov-none" />
      </>
    ) : null,
  Over: ({ ctx }) => (
    <>
      <Zone at={TAB_LANGUAGE} label="Language" onClick={() => ctx.openModal({ name: 'language' })} />
      {ctx.modal?.name === 'language' && (
        <>
          <Zone at={TAB_GENERAL} label="General" onClick={ctx.closeModal} />
          <LanguagePanel ctx={ctx} />
        </>
      )}
    </>
  ),
}
