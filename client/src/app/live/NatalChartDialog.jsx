import { Fragment } from 'react'
import { t } from '../../i18n/index.js'
import { Dialog } from './parts.jsx'
import { degreeLabel } from './wheelLayout.js'
import { ASPECT_GLYPHS, ASPECT_LABELS, PLANET_GLYPHS, RETROGRADE_MARK, SIGN_ARC_DEGREES, SIGN_GLYPHS } from './zodiacWheel.constants.js'

const ORB_DECIMALS = 1
const signGlyphOf = (longitude) => SIGN_GLYPHS[Math.floor(longitude / SIGN_ARC_DEGREES)]
const placeOf = (longitude) => `${signGlyphOf(longitude)} ${degreeLabel(longitude % SIGN_ARC_DEGREES)}`

/** Натальна карта текстом: положення планет (знак, градуси, будинок, ретроградність), кути та аспекти з орбісом. */
export function NatalChartDialog({ natal, onClose }) {
  const nameOf = Object.fromEntries(natal.planets.map((p) => [p.name, p.planet]))
  return (
    <Dialog title={t('Natal Chart')} onClose={onClose} wide>
      <section className="report-section">
        <h3>{t('Planets')}</h3>
        <table className="chart-table">
          <thead>
            <tr><th>{t('Planet')}</th><th>{t('Position')}</th><th>{t('House')}</th></tr>
          </thead>
          <tbody>
            {natal.planets.map((p) => (
              <Fragment key={p.name}>
                <tr>
                  <td>{PLANET_GLYPHS[p.name]} {p.planet}{p.retrograde ? ` ${RETROGRADE_MARK}` : ''}</td>
                  <td>{placeOf(p.longitude)} {p.signName}</td>
                  <td>{p.house ?? '—'}</td>
                </tr>
                <tr className="meaning"><td colSpan={3}>{p.meaning}</td></tr>
              </Fragment>
            ))}
            {natal.angles && (
              <>
                <tr><td>{t('Ascendant')} (AC)</td><td>{placeOf(natal.angles.ascendant)}</td><td>1</td></tr>
                <tr><td>{t('Midheaven')} (MC)</td><td>{placeOf(natal.angles.midheaven)}</td><td>10</td></tr>
              </>
            )}
          </tbody>
        </table>
        {!natal.angles && <p className="hint">{t('Add birth time and place to see houses and the Ascendant')}</p>}
      </section>
      <section className="report-section">
        <h3>{t('Aspects')}</h3>
        {natal.aspects.length === 0 && <p>{t('No tight aspects')}</p>}
        <table className="chart-table">
          <tbody>
            {natal.aspects.map((a) => (
              <Fragment key={`${a.a}-${a.b}`}>
                <tr>
                  <td>{PLANET_GLYPHS[a.a]} {nameOf[a.a]}</td>
                  <td className="asp">{ASPECT_GLYPHS[a.type]}</td>
                  <td>{PLANET_GLYPHS[a.b]} {nameOf[a.b]}</td>
                  <td>{t(ASPECT_LABELS[a.type])}, {t('orb')} {a.orb.toFixed(ORB_DECIMALS)}°</td>
                </tr>
                <tr className="meaning"><td colSpan={4}>{a.meaning}</td></tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </section>
    </Dialog>
  )
}
