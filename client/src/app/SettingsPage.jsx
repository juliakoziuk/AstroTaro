import { useCallback, useEffect, useRef, useState } from 'react'
import { get, patch } from '../lib/api.js'
import { setTheme, settingOf } from '../lib/theme.js'
import { t, useLang } from '../i18n/index.js'
import { go } from './router.js'
import { SettingsPanel } from './live/settings-panel.jsx'
import AppPage from './AppPage.jsx'
import { AccessIcon, HelpIcon, SettingsIcon, MoonIcon, SunIcon, FeatherIcon, LayersIcon, SparkleIcon } from './icons.jsx'

const TABS = [['General', SettingsIcon], ['Notifications', SunIcon], ['Appearance', MoonIcon], ['Language', FeatherIcon], ['Privacy & Security', AccessIcon], ['Data & Storage', LayersIcon], ['Billing', SparkleIcon], ['About', HelpIcon]]
const ABOUT_TAB = TABS.findIndex(([label]) => label === 'About') // «Допомога» в меню відкриває «About», а не номер, що колись зсунеться

export default function SettingsPage() {
  const lang = useLang()
  const [tab, setTab] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const mounted = useRef(true)
  const reload = useCallback(async () => {
    const settings = await get('/settings')
    if (mounted.current) { setData({ settings }); setError('') }
  }, [])
  useEffect(() => {
    mounted.current = true
    reload().catch((e) => { if (mounted.current) setError(e.message) })
    return () => { mounted.current = false }
  }, [lang, reload])
  const ctx = { data, patchData: setData, reload, go, onBusy: setSaving }
  const chooseTheme = async (preference) => {
    setSaving(true)
    try {
      const settings = await patch('/settings', { theme: settingOf(preference) })
      setData((previous) => ({ ...previous, settings }))
      setTheme(preference)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }
  return <AppPage title={t('Settings')} subtitle={t('Customize your experience in MYSTIQ')} back="back:/profile" onHelp={() => setTab(ABOUT_TAB)} onTheme={chooseTheme} themeDisabled={saving || !data}>
      {error && <div className="settings-load-error" role="alert"><p>{error}</p><button type="button" onClick={() => reload().then(() => setError('')).catch((e) => setError(e.message))}>{t('Retry')}</button></div>}
      <div className="settings-layout">
        <div className="settings-tabs" role="tablist" aria-label={t('Settings')} aria-orientation="vertical">{TABS.map(([label, Icon], index) => <button type="button" key={label} role="tab" disabled={saving} id={`settings-tab-${index}`} aria-controls="settings-content" aria-selected={tab === index} tabIndex={tab === index ? 0 : -1} onClick={() => setTab(index)} onKeyDown={(event) => {
          const next = ['ArrowDown', 'ArrowRight'].includes(event.key) ? (index + 1) % TABS.length : ['ArrowUp', 'ArrowLeft'].includes(event.key) ? (index + TABS.length - 1) % TABS.length : event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : null
          if (next === null) return
          event.preventDefault(); setTab(next); document.getElementById(`settings-tab-${next}`)?.focus()
        }}><Icon /><span>{t(label)}</span></button>)}</div>
        <SettingsPanel key={tab} ctx={ctx} tab={tab} />
      </div>
  </AppPage>
}
