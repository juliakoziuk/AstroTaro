import { useEffect, useState } from 'react'
import { get } from '../lib/api.js'
import { t, useLang } from '../i18n/index.js'
import { initialOf } from './avatar.js'
import { navProps } from './router.js'
import { box } from './live/parts.jsx'

/**
 * Кружечок з аватаром і імʼям у бічній панелі: клік веде на сторінку «Profile», де дані можна змінити («Edit Profile»).
 * Фото в акаунті ще немає, тож аватар — золотий кружечок з першою літерою імені.
 */
export default function SideProfile({ at }) {
  useLang() // підпис змінюється з мовою
  const [name, setName] = useState('')
  useEffect(() => {
    let live = true
    get('/profile').then(
      (p) => live && setName(p.name ?? ''),
      () => {}, // без імені лишається просто кружечок: екран і без нього працює
    )
    return () => {
      live = false
    }
  }, [])
  return (
    <a className="ov side-profile" {...navProps('/profile')} style={box(...at)} aria-label={t('My profile')} title={t('My profile')}>
      <span className="avatar" aria-hidden="true">{initialOf(name) || '✦'}</span>
      <span className="who">
        <b>{name}</b>
        <small>{t('My profile')}</small>
      </span>
    </a>
  )
}
