import { useState } from 'react'
import { post } from '../../lib/api.js'
import { t } from '../../i18n/index.js'
import { Dialog } from './parts.jsx'
import { ReportBody } from './reports.jsx'
import { synastryColors, SynastryWheel } from './SynastryWheel.jsx'
import { useTheme } from '../../lib/theme.js'
import { ASPECT_GLYPHS, ASPECT_LABELS, PLANET_GLYPHS } from './zodiacWheel.constants.js'

const MIN_BIRTH_DATE = '1900-01-01'
const today = () => new Date().toISOString().slice(0, 10)

/** Блок однієї людини: ім'я та дата народження. */
function Person({ title, person, setPerson, nameRequired = false }) {
  const set = (key) => (e) => setPerson({ ...person, [key]: e.target.value })
  return (
    <fieldset className="syn-person">
      <legend>{title}</legend>
      <div className="row">
        <label>
          {nameRequired ? t('Name') : t('Name (optional)')}
          <input value={person.name} maxLength={60} onChange={set('name')} autoComplete="off" />
        </label>
        <label>
          {t('Date of birth')}
          <input type="date" value={person.date} min={MIN_BIRTH_DATE} max={today()} required onChange={set('date')} />
        </label>
      </div>
    </fieldset>
  )
}

/** Форма: дві людини з датами народження (перша підставляється з профілю, але її можна змінити). */
function PairForm({ first, setFirst, second, setSecond, error, busy, onSubmit }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <p className="report-text">{t('Enter two dates of birth to see how compatible a pair is, as a percentage.')}</p>
      <Person title={t('First person')} person={first} setPerson={setFirst} />
      <Person title={t('Second person')} person={second} setPerson={setSecond} />
      <p className="hint">{t('Date is enough: the planets are calculated for midday of that day.')}</p>
      {error && <p className="err" role="alert">{error}</p>}
      <div className="actions">
        <button type="submit" className="primary" disabled={!first.date || !second.date || busy}>{busy ? t('Calculating…') : t('Calculate')}</button>
      </div>
    </form>
  )
}

const HARMONIOUS_FROM = 0.7 // частка гармонії аспекту: від цього — «злагоджений», до TENSE_UNTIL — «напружений», між ними — «змішаний»
const TENSE_UNTIL = 0.3
const ORB_DECIMALS = 1
const effectOf = (harmony) => (harmony >= HARMONIOUS_FROM ? 'Harmonious' : harmony <= TENSE_UNTIL ? 'Tense' : 'Mixed')

/** Усі аспекти між картами, які склали відсоток: від найважливіших; з позначкою, злагоджений він чи напружений. */
function AspectTable({ result }) {
  const nameOf = (person, id) => person.planets.find((p) => p.name === id)?.planet ?? id
  return (
    <details className="syn-all">
      <summary>{t('All aspects')} ({result.allAspects.length})</summary>
      <table className="chart-table">
        <thead>
          <tr><th>{result.me.name}</th><th /><th>{result.partner.name}</th><th>{t('Effect')}</th></tr>
        </thead>
        <tbody>
          {result.allAspects.map((x) => (
            <tr key={`${x.a}-${x.b}`}>
              <td>{PLANET_GLYPHS[x.a]} {nameOf(result.me, x.a)}</td>
              <td className="asp" title={`${t(ASPECT_LABELS[x.type])}, ${t('orb')} ${x.orb.toFixed(ORB_DECIMALS)}°`}>{ASPECT_GLYPHS[x.type]}</td>
              <td>{PLANET_GLYPHS[x.b]} {nameOf(result.partner, x.b)}</td>
              <td className={`eff ${effectOf(x.harmony).toLowerCase()}`}>{t(effectOf(x.harmony))} · {x.orb.toFixed(ORB_DECIMALS)}°</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

/** Результат: загальний відсоток за всіма аспектами, подвійне колесо, оцінки за сферами, усі аспекти й текстовий звіт. */
function Result({ result, onChange }) {
  const SYNASTRY_COLORS = synastryColors(useTheme())
  const { counted } = result
  return (
    <>
      <div className="syn-score">
        <b>{result.score}<small>%</small></b>
        <span>{t('Overall compatibility')}: {result.level}</span>
      </div>
      <p className="hint syn-counted">{t('Based on all {n} aspects between your charts: {h} harmonious, {x} tense.', { n: counted.total, h: counted.harmonious, x: counted.tense })}</p>
      <SynastryWheel me={result.me} partner={result.partner} aspects={result.allAspects} label={t('Compatibility chart')} />
      <p className="syn-legend">
        <span><i style={{ background: SYNASTRY_COLORS.partner }} />{result.partner.name} · {t('outer ring')}</span>
        <span><i style={{ background: SYNASTRY_COLORS.mine }} />{result.me.name} · {t('inner ring')}</span>
      </p>
      <ul className="syn-bars">
        {result.categories.map((c) => (
          <li key={c.id} title={c.text}>
            <span>{c.name}</span>
            <div className="syn-bar" role="img" aria-label={`${c.name}: ${c.score}%`}><div style={{ width: `${c.score}%` }} /></div>
            <b>{c.score}%</b>
          </li>
        ))}
      </ul>
      <AspectTable result={result} />
      {result.summary ? (
        <>
          <ReportBody text={result.summary} />
          <details className="syn-details">
            <summary>{t('Detailed breakdown')}</summary>
            <ReportBody text={result.text} />
          </details>
        </>
      ) : (
        <ReportBody text={result.text} />
      )}
      <button type="button" className="syn-change" onClick={onChange}>{t('Change partner')}</button>
    </>
  )
}

/**
 * «Compatibility»: дві дати народження → відсоток сумісності пари за всіма аспектами, подвійне колесо й звіт.
 * Першу людину підставляємо з профілю (з нього ж і час та місце народження, якщо дату не змінили).
 */
export function CompatibilityDialog({ profile, onClose }) {
  const [first, setFirst] = useState({ name: profile?.name ?? '', date: profile?.birthDate ?? '' })
  const [second, setSecond] = useState({ name: '', date: '' })
  const [state, setState] = useState({ status: 'form' })

  const calculate = async () => {
    setState({ status: 'loading' })
    const body = { birthDate: second.date }
    if (second.name.trim()) body.name = second.name.trim()
    if (first.name.trim()) body.firstName = first.name.trim()
    if (first.date !== profile?.birthDate) body.firstBirthDate = first.date // та сама дата, що в профілі: беремо його карту з часом і місцем
    try {
      setState({ status: 'ok', result: await post('/astrology/compatibility', body) })
    } catch (e) {
      setState({ status: 'form', error: e.message })
    }
  }

  return (
    <Dialog title={state.status === 'ok' ? state.result.title : t('Compatibility')} onClose={onClose} wide>
      {state.status === 'ok' ? (
        <Result result={state.result} onChange={() => setState({ status: 'form' })} />
      ) : (
        <PairForm first={first} setFirst={setFirst} second={second} setSecond={setSecond} error={state.error} busy={state.status === 'loading'} onSubmit={calculate} />
      )}
    </Dialog>
  )
}
