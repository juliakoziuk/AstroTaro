import { useRef, useState } from 'react'
import { del, get, patch, post } from '../../lib/api.js'
import { logOut } from './common.js'
import { LANGS, langFromSetting, setLang, t } from '../../i18n/index.js'
import { setTheme, themeFromSetting } from '../../lib/theme.js'
import { BillingPanel } from './BillingPanel.jsx'
import './settings-panel.css'

const TABS = ['General', 'Notifications', 'Appearance', 'Language', 'Privacy & Security', 'Data & Storage', 'Billing', 'About']

function Switch({ label, hint, checked, disabled, onChange }) {
  return <div className="settings-row"><div><h3>{label}</h3>{hint && <p>{hint}</p>}</div><button type="button" className="settings-switch" role="switch" aria-label={label} aria-checked={!!checked} disabled={disabled} onClick={() => onChange(!checked)}><i /></button></div>
}

export function SettingsPanel({ ctx, tab }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const lock = useRef(false)
  const settings = ctx.data?.settings
  const consent = ctx.data?.consent ?? {}
  const run = async (action) => {
    if (lock.current) return
    lock.current = true
    ctx.onBusy?.(true)
    setBusy(true); setError(''); setSaved(false)
    try { await action(); setSaved(true) } catch (e) { setError(e.message) }
    finally { lock.current = false; setBusy(false); ctx.onBusy?.(false) }
  }
  const change = (key, value) => run(async () => {
    const next = await patch('/settings', { [key]: value })
    ctx.patchData((data) => ({ ...data, settings: next }))
    if (key === 'theme') setTheme(themeFromSetting(next.theme))
    if (key === 'language') setLang(langFromSetting(next.language))
  })
  const changeConsent = (key, value) => run(async () => {
    const user = await patch('/auth/consent', { [key]: value })
    ctx.patchData((data) => ({ ...data, consent: user.consent }))
  })
  const exportData = () => run(async () => {
    const data = await get('/profile/export')
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = `mystiq-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.append(link); link.click(); link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })
  const confirmAction = () => run(async () => {
    if (confirm === 'reset') {
      const next = await post('/settings/reset')
      setTheme(themeFromSetting(next.theme)); setLang(langFromSetting(next.language))
      await ctx.reload()
    } else if (confirm === 'chats') await del('/messages')
    else if (confirm === 'local') {
      for (const key of Object.keys(sessionStorage)) if (key.startsWith('astrotarot.')) sessionStorage.removeItem(key)
    }
    setConfirm(null)
  })
  return <section className="settings-panel" role="tabpanel" id="settings-content" aria-labelledby={`settings-tab-${tab}`} aria-busy={busy}>
    <h2>{t(TABS[tab])}</h2>
    {!settings ? <p>{t('Loading…')}</p> : <>
      {tab === 0 && <>
        <p>{t('Core app preferences')}</p>
        <Switch label={t('Show daily insights')} hint={t('Daily astro overview just for you')} checked={settings.insights} disabled={busy} onChange={(value) => change('insights', value)} />
        <Switch label={t('Autosave conversations')} hint={t('Automatically save new chats and readings to your account.')} checked={settings.autosave} disabled={busy} onChange={(value) => change('autosave', value)} />
        <Switch label={t('Enable AI Companion')} hint={t('Turn on your personal mystical assistant')} checked={settings.companion} disabled={busy} onChange={(value) => change('companion', value)} />
        {[[t('Default reading type'), 'defaultReading', ['Astrology', 'Tarot', 'Dreams']], [t('Time format'), 'timeFormat', ['24-hour', '12-hour']], [t('Date format'), 'dateFormat', ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']]].map(([label, key, options]) => <label key={key} className="settings-row settings-select"><span>{label}</span><select value={settings[key]} disabled={busy} onChange={(event) => change(key, event.target.value)}>{options.map((option) => <option key={option} value={option}>{t(option)}</option>)}</select></label>)}
        <button type="button" className="settings-action" onClick={() => ctx.go(({ Tarot: '/tarot', Astrology: '/astrology', Dreams: '/dreams' })[settings.defaultReading] ?? '/tarot')}>{t('Open default workspace')}</button>
      </>}
      {tab === 1 && <>
        <p>{t('Notification preferences are saved to your account.')}</p>
        <Switch label={t('Notifications')} hint={t('Show an insight reminder when you open the app.')} checked={settings.notifications} disabled={busy} onChange={(value) => change('notifications', value)} />
        <Switch label={t('Show daily insights')} hint={t('Daily astro overview just for you')} checked={settings.insights} disabled={busy} onChange={(value) => change('insights', value)} />
        <p className="settings-note">{t('Reminders appear inside MYSTIQ, once a day on this device.')}</p>
      </>}
      {tab === 2 && <>
        <p>{t('Choose a theme. Auto follows your device settings.')}</p>
        <div className="settings-options">{['Dark', 'Light', 'Auto'].map((theme) => <button type="button" key={theme} className={settings.theme === theme ? 'selected' : ''} aria-pressed={settings.theme === theme} disabled={busy} onClick={() => change('theme', theme)}><span className={`settings-preview ${theme.toLowerCase()}`} aria-hidden="true">☾ ✦</span>{t(theme)}</button>)}</div>
      </>}
      {tab === 3 && <>
        <p>{t('The language of the interface, readings, interpretations and AI replies.')}</p>
        <div className="settings-languages">{LANGS.map((language) => <button type="button" key={language.id} className={settings.language === language.setting ? 'selected' : ''} aria-pressed={settings.language === language.setting} disabled={busy} onClick={() => change('language', language.setting)}>{language.label}<span aria-hidden="true">{settings.language === language.setting ? '✓' : ''}</span></button>)}</div>
      </>}
      {tab === 4 && <>
        <p>{t('Choose which records the AI Companion can use for personal context. You can revoke access at any time.')}</p>
        <Switch label={t('Dream Journal')} checked={consent.dreams} disabled={busy} onChange={(value) => changeConsent('dreams', value)} />
        <Switch label={t('Journal entries')} checked={consent.journal} disabled={busy} onChange={(value) => changeConsent('journal', value)} />
        <Switch label={t('Tarot readings')} checked={consent.spreads} disabled={busy} onChange={(value) => changeConsent('spreads', value)} />
        <p className="settings-note">{t('Turning access off keeps your records and excludes them from future AI context. Messages you send are still processed to answer you.')}</p>
        <button type="button" className="settings-action" disabled={busy} onClick={() => { logOut(); ctx.go('/login') }}>{t('Log Out')}</button>
      </>}
      {tab === 5 && <>
        <p>{t('Manage your records and preferences.')}</p>
        <div className="settings-data-actions">
          <button type="button" disabled={busy} onClick={exportData}>{t('Export my data (JSON)')}</button>
          <button type="button" disabled={busy} onClick={() => setConfirm('local')}>{t('Clear temporary data on this device')}</button>
          <button type="button" disabled={busy} onClick={() => setConfirm('reset')}>{t('Reset preferences')}</button>
          <button type="button" className="danger" disabled={busy} onClick={() => setConfirm('chats')}>{t('Clear conversation history')}</button>
        </div>
        <p className="settings-note">{t('Exports include your profile, preferences, dreams, journal, readings, reports and conversations. Keep the file private.')}</p>
        {confirm && <div className="settings-confirm" role="alertdialog" aria-label={t('Confirm action')}><p>{confirm === 'chats' ? t('Delete all saved conversations? This cannot be undone.') : confirm === 'reset' ? t('Reset appearance, language and general preferences? Your records and AI permissions will be kept.') : t('Clear temporary selections and drafts in this tab? Your account records will be kept.')}</p><button type="button" disabled={busy} onClick={() => setConfirm(null)}>{t('Cancel')}</button><button type="button" disabled={busy} onClick={confirmAction}>{t('Confirm action')}</button></div>}
      </>}
      {tab === 6 && <BillingPanel ctx={ctx} />}
      {tab === 7 && <>
        <div className="settings-about"><span aria-hidden="true">☾</span><h3>MYSTIQ</h3><p>{t('Your personal space for insight and balance')}</p></div>
        <p>{t('Tarot, dream journaling, astrology and an AI Companion in one space.')}</p>
        <p className="settings-note">{t('AI interpretations are for reflection and may be inaccurate.')}</p>
        <div className="settings-data-actions"><button type="button" onClick={() => ctx.go('/profile')}>{t('Profile')}</button><button type="button" onClick={() => ctx.go('/pricing')}>{t('Access')}</button></div>
      </>}
    </>}
    <div className="settings-status" role="status">{busy ? t('Saving…') : saved ? t('Done') : ''}</div>
    {error && <p className="settings-error" role="alert">{error}</p>}
  </section>
}
