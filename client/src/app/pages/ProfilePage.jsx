// Екран Profile: дані акаунта, активність, швидкі посилання й налаштування акаунта (сповіщення, мова, тема).
import { useState } from 'react'
import { get, patch } from '../../lib/api.js'
import { getLang, LANGS, optionLabel, t, useLang } from '../../i18n/index.js'
import { chooseLanguage } from '../../i18n/sync.js'
import { getPreference, useTheme } from '../../lib/theme.js'
import { chooseTheme } from '../../lib/themeSync.js'
import { formatDay } from '../format.js'
import AppPage from '../AppPage.jsx'
import { loadSettings, logOut, session } from '../live/common.js'
import { ProfileModal } from '../live/profile.jsx'
import { ReportsDialog } from '../live/reports.jsx'
import { initialOf } from '../avatar.js'
import { LogoutIcon } from '../icons.jsx'
import { usePage } from '../usePage.js'
import { LoadError, Loading, Toggle } from './parts.jsx'

const THEMES = ['dark', 'light', 'auto']
const THEME_LABEL = { dark: 'Dark', light: 'Light', auto: 'Auto' }

async function load() {
  const [profile, settings] = await Promise.all([get('/profile'), loadSettings()])
  return { profile, settings }
}

export default function ProfilePage() {
  useLang()
  useTheme() // подпис вибраної теми оновлюється, коли її змінюють деінде
  const page = usePage(load)
  const { ctx } = page
  const p = page.data?.profile
  const s = page.data?.settings
  const [notify, setNotify] = useState(null) // оптимістичний стан перемикача, поки сервер відповідає
  const history = (filter) => {
    session.set('historyFilter', filter)
    ctx.go('/history')
  }

  const setNotifications = (value) => {
    setNotify(value)
    patch('/settings', { notifications: value }).catch((e) => (setNotify(!value), ctx.fail(e)))
  }

  return (
    <AppPage title={t('Profile')} subtitle={t('Manage your account, preferences, and personal information')} back="back:/dashboard">
      <LoadError page={page} />
      {!p && page.status === 'loading' && <Loading />}
      {p && (
        <div className="ap-stack">
          <section className="ap-panel ap-me">
            <span className="avatar" aria-hidden="true">{initialOf(p.name) || '✦'}</span>
            <div className="grow">
              <h2>{p.name}</h2>
              <p>{p.email}</p>
              {p.birthDate && <p>{formatDay(p.birthDate, s.dateFormat)}</p>}
            </div>
            <button type="button" className="ap-btn primary" onClick={() => ctx.openModal({ name: 'profile' })}>{t('Edit Profile')}</button>
          </section>

          <div className="ap-cols even">
            <div className="ap-stack">
              <section className="ap-panel">
                <h2>{t('Your Activity')}</h2>
                <div className="ap-stats">
                  <button type="button" className="ap-stat" onClick={() => history('all')}><b>{p.activity.readings}</b><span>{t('Readings')}</span></button>
                  <button type="button" className="ap-stat" onClick={() => ctx.go('/dreams')}><b>{p.activity.dreams}</b><span>{t('Dreams')}</span></button>
                  <button type="button" className="ap-stat" onClick={() => ctx.openModal({ name: 'reports' })}><b>{p.activity.reports}</b><span>{t('Reports')}</span></button>
                </div>
              </section>
              <section className="ap-panel">
                <ul className="ap-list">
                  <li><button type="button" className="ap-row" onClick={() => history('saved')}><span className="grow"><b>{t('Saved Readings')}</b></span></button></li>
                  <li><button type="button" className="ap-row" onClick={() => history('all')}><span className="grow"><b>{t('History')}</b></span></button></li>
                  <li><button type="button" className="ap-row" onClick={() => ctx.openModal({ name: 'reports' })}><span className="grow"><b>{t('My Reports')}</b></span></button></li>
                </ul>
              </section>
            </div>
            <section className="ap-panel">
              <h2>{t('Account Settings')}</h2>
              <ul className="ap-list" style={{ marginBottom: '.6rem' }}>
                <li><button type="button" className="ap-row" onClick={() => ctx.go('/settings')}><span className="grow"><b>{t('Email')}</b><small>{p.email}</small></span></button></li>
                <li><button type="button" className="ap-row" onClick={() => ctx.go('/settings')}><span className="grow"><b>{t('Password')}</b><small>••••••••</small></span></button></li>
              </ul>
              <Toggle label={t('Notifications')} on={notify ?? s.notifications} onChange={setNotifications} />
              <div className="ap-toggle">
                <b>{t('Language')}</b>
                <select className="ap-select" aria-label={t('Language')} value={getLang()} onChange={(e) => chooseLanguage(e.target.value).catch(ctx.fail)}>
                  {LANGS.map((l) => <option key={l.id} value={l.id}>{optionLabel('lang', l.setting)}</option>)}
                </select>
              </div>
              <div className="ap-toggle">
                <b>{t('Theme')}</b>
                <select className="ap-select" aria-label={t('Theme')} value={getPreference()} onChange={(e) => chooseTheme(e.target.value).catch(ctx.fail)}>
                  {THEMES.map((id) => <option key={id} value={id}>{t(THEME_LABEL[id])}</option>)}
                </select>
              </div>
              <div className="ap-actions">
                <button type="button" className="ap-btn danger" onClick={() => (logOut(), ctx.go('/login'))}><LogoutIcon />{t('Log Out')}</button>
              </div>
            </section>
          </div>
        </div>
      )}
      {ctx.modal?.name === 'profile' && <ProfileModal ctx={ctx} profile={p} />}
      {ctx.modal?.name === 'reports' && <ReportsDialog onClose={ctx.closeModal} dateFormat={s?.dateFormat} />}
    </AppPage>
  )
}
