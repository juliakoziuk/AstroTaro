import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import fonts from '../../scripts/app/fonts.json'
import { go, navProps } from './router.js'
import { resolveTexts } from './resolve.js'
import { say } from './toast.js'
import { optionLabel, t, useLang } from '../i18n/index.js'
import NavLinks from './NavLinks.jsx'
import SideProfile from './SideProfile.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { LogoutIcon } from './icons.jsx'
import { logOut } from './live/common.js'
import { box } from './live/parts.jsx'

// гостьові екрани: людина ще не в застосунку, тож без бічного меню; картка посередині, арт по боках розтягується до країв
// (розкладка в app.css: .guest, .art-guest)
const GUEST = new Set(['register'])

const FAMILY = {
  serif: `'${fonts.serif.family}', Georgia, serif`,
  sans: `'${fonts.sans.family}', 'Segoe UI', sans-serif`,
}

// Бічна панель макета займає x < 242 одиниць. На широких екранах вона лишається біля лівого краю вікна, а решта екрана
// (x >= 242) центрується в залишку ширини: таким елементам CSS додає зсув --g (див. app.css). Прапорець --s = 1 вмикає зсув.
const SIDE = 242
// місце намальованого перемикача теми в нижній частині бічної панелі (x, y, w, h, r, зсув): живий перемикач лягає поверх нього
const THEME_TOGGLE = [62, 854, 152, 48, 24, 0]
// Живе меню лягає на місце намальованих пунктів (вони на плиті від y = 227 до 645) і закриває їх; під ним — профіль з аватаром,
// а під профілем «Вийти»; x, y, w, h, r, без зсуву
const SIDE_NAV = [46, 212, 184, 440, 0, 0]
const PROFILE = [46, 668, 184, 64, 32, 0]
const LOGOUT = [46, 744, 184, 56, 28, 0]
const shift = (x) => (x >= SIDE ? 1 : 0)

// Один рядок тексту: позиція, кегль, трекінг і колір підібрані за макетом (scripts/app/build.mjs)
// Рядок із обмеженням ширини (maxw: кнопка, сусідній текст, край картки): евристика за довжиною лише наближена, тож після
// малювання міряємо справжню ширину й за потреби зменшуємо кегль так, щоб текст не вилазив (не менше 55 % від початкового).
const MIN_FIT = 0.55

/**
 * Рядки однієї групи (data-g, напр. два рядки опису персони) мають однаковий кегль: спільний масштаб за найширшим
 * рядком відносно його maxw. Поодинці рядки підганялися б по-різному (довгий — дрібно, короткий — звичайно).
 */
function fitGroups(root) {
  const groups = new Map()
  root.querySelectorAll('[data-g]').forEach((el) => groups.set(el.dataset.g, [...(groups.get(el.dataset.g) ?? []), el]))
  for (const els of groups.values()) {
    els.forEach((el) => {
      el.style.setProperty('--fs', el.dataset.fs)
      el.style.setProperty('--lh', el.dataset.lh)
    })
    let scale = 1
    for (const el of els) {
      const fs = +el.dataset.fs
      const maxw = +el.dataset.maxw
      if (!fs || !maxw) continue
      const unit = parseFloat(getComputedStyle(el).fontSize) / fs // px в одній одиниці макета
      const width = el.getBoundingClientRect().width / unit
      if (unit > 0 && width > maxw) scale = Math.min(scale, Math.max(MIN_FIT, maxw / width))
    }
    if (scale < 1) {
      els.forEach((el) => {
        el.style.setProperty('--fs', +(+el.dataset.fs * scale).toFixed(2))
        el.style.setProperty('--lh', +(+el.dataset.lh * scale).toFixed(2)) // міжрядковий інтервал разом із кеглем
      })
    }
  }
}

function Text({ t }) {
  const Tag = t.href ? 'a' : t.tag
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !t.maxw || !t.fs || t.g) return // рядки груп підганяє fitGroups
    const fit = () => {
      el.style.setProperty('--fs', t.fs)
      const unit = parseFloat(getComputedStyle(el).fontSize) / t.fs // px в одній одиниці макета
      const width = el.getBoundingClientRect().width / unit
      if (unit > 0 && width > t.maxw) el.style.setProperty('--fs', +(t.fs * Math.max(MIN_FIT, t.maxw / width)).toFixed(2))
    }
    fit()
    document.fonts?.ready.then(fit) // шрифт міг завантажитись пізніше
  }, [t.s, t.fs, t.maxw, t.g])
  return (
    <Tag
      ref={ref}
      className="t"
      {...(t.g ? { 'data-g': t.g, 'data-fs': t.fs, 'data-lh': t.lh, 'data-maxw': t.maxw } : {})}
      {...(t.href ? navProps(t.href) : {})}
      style={{ '--x': t.x, '--y': t.y, '--s': shift(t.x), '--fs': t.fs, '--ls': t.ls, '--lh': t.lh, color: t.c, fontFamily: FAMILY[t.f], fontWeight: t.wg, ...(t.ralign ? { transform: 'translateX(-100%)' } : {}) }}
    >
      {t.s}
    </Tag>
  )
}

/** Рядки одного абзацу лежать в одному <p>, кожен рядок позиціюється окремо — переноси збігаються з макетом. */
function Texts({ texts }) {
  const out = []
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i]
    if (!t.p) {
      out.push(<Text key={i} t={t} />)
      continue
    }
    const lines = [t]
    while (texts[i + 1]?.p === t.p) lines.push(texts[++i])
    out.push(
      <p className="para" key={i}>
        {lines.map((l, j) => (
          <Text key={j} t={l} />
        ))}
      </p>,
    )
  }
  return out
}

const rect = (o) => ({ '--x': o.x, '--y': o.y, '--s': shift(o.x), '--w': o.w, '--h': o.h, '--r': o.r ?? 0 })

export default function Screen({ d, live }) {
  const lang = useLang() // перемальовуємо екран і перезавантажуємо дані (їх сервер віддає мовою інтерфейсу) при зміні мови
  const [on, setOn] = useState(() => ({
    ...Object.fromEntries(d.toggles.map((t) => [t.id, t.on])),
    ...Object.fromEntries(d.checks.map((c) => [c.id, c.on])),
  }))
  const [radio, setRadio] = useState(() => Object.fromEntries(d.radios.filter((r) => r.on).map((r) => [r.group, r.value])))
  const [sel, setSel] = useState(() => Object.fromEntries(d.selects.map((s) => [s.id, s.options[0]])))
  const [shown, setShown] = useState({}) // які поля пароля зараз показані відкритим текстом
  const fields = useRef({})

  // Живі дані екрана (див. live/*.jsx): тексти макета заповнюються з API, решту малюють оверлеї
  const [state, setState] = useState({ values: {}, data: null, options: {} })
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const alive = useRef(true)
  const guest = GUEST.has(d.id)
  // у гостя бічної панелі немає: її тексти (логотип) не показуємо
  // eslint-disable-next-line react-hooks/exhaustive-deps -- переклад залежить від поточної мови
  const texts =useMemo(() => resolveTexts(guest ? d.texts.filter((x) => x.x >= SIDE) : d.texts, state.values, t), [d, guest, state.values, lang])
  const stage = useRef(null)
  // у портретному вікні сцена ширша за екран і гортається вбік: гостя одразу ставимо на картку (вона по центру сцени)
  useLayoutEffect(() => {
    const page = guest ? stage.current?.closest('.page') : null
    if (page) page.scrollLeft = (page.scrollWidth - page.clientWidth) / 2
  }, [guest])
  useLayoutEffect(() => {
    const root = stage.current
    if (!root) return
    fitGroups(root)
    document.fonts?.ready.then(() => fitGroups(root)) // шрифт міг завантажитись пізніше
  }, [texts])

  const apply = useCallback((r) => {
    if (!alive.current) return
    setState({ values: r.values ?? {}, data: r.data ?? null, options: r.ui?.options ?? {} })
    if (r.ui?.toggles) setOn((v) => ({ ...v, ...r.ui.toggles }))
    if (r.ui?.selects) setSel((v) => ({ ...v, ...r.ui.selects }))
  }, [])
  const reload = useCallback(
    () => (live?.load ? live.load({ go }).then(apply, (e) => say(e.message)) : undefined),
    [live, apply],
  )
  useEffect(() => {
    alive.current = true
    live?.load?.({ go }).then(apply, (e) => say(e.message))
    return () => {
      alive.current = false
    }
  }, [live, apply, lang])

  const ctx = {
    data: state.data,
    values: state.values,
    ui: { on, radio, sel },
    field: (id) => fields.current[id],
    modal,
    go,
    reload,
    say,
    fail: (e) => say(e.message),
    openModal: setModal,
    closeModal: () => setModal(null),
    patchData: (fn) => setState((st) => ({ ...st, data: fn(st.data) })),
    run: async (fn) => {
      if (busy) return
      setBusy(true)
      try {
        await fn()
      } catch (e) {
        say(e.message)
      } finally {
        setBusy(false)
      }
    },
  }
  const actions = live?.actions ?? {}
  // зона з власною дією (за підписом) не переходить за href, а виконує дію
  const hitProps = (h) =>
    actions[h.label]
      ? { href: navProps(h.href).href, onClick: (e) => (e.preventDefault(), ctx.run(() => actions[h.label](ctx))) }
      : navProps(h.href)

  const flip = (id) => {
    const next = !on[id]
    setOn((v) => ({ ...v, [id]: next }))
    live?.onToggle?.(id, next, ctx)?.catch((e) => say(e.message))
  }
  const clear = (id) => {
    const el = fields.current[id]
    if (el) {
      el.value = ''
      el.focus()
    }
  }
  const clearable = new Set((d.clears ?? []).map((c) => c.id))
  const send = () => (actions.Send ? ctx.run(() => actions.Send(ctx)) : undefined)

  return (
    <main className={guest ? 'stage guest' : 'stage'} ref={stage} aria-label={d.title} data-screen={d.id}>
      {!guest && d.hits.some((h) => h.nav) && (
        <>
          <div className="ov side-nav" style={box(...SIDE_NAV)}>
            <NavLinks />
          </div>
          <SideProfile at={PROFILE} />
          <button type="button" className="ov side-logout" style={box(...LOGOUT)} onClick={() => (logOut(), go('/login'))}>
            <LogoutIcon />
            <span>{t('Log Out')}</span>
          </button>
          <ThemeToggle className="ov" style={{ ...box(...THEME_TOGGLE), fontSize: 'calc(var(--u) * 22)' }} />
        </>
      )}
      {/* плита розрізана на бічну панель і решту: на широких екранах між ними з'являється проміжок (його заповнює розмитий фон) */}
      <div className={guest ? 'art art-guest' : 'art'} aria-hidden="true">
        {guest ? (
          // арт по боках картки збільшується до країв вікна (як у логіні), 2x-плита тримає різкість; панелі немає
          ['left', 'mid', 'right'].map((part) => (
            <div className={`pl pl-${part}`} key={part}>
              <img src={d.plate2} width="1536" height="1024" alt="" draggable="false" decoding="async" fetchPriority="high" />
            </div>
          ))
        ) : (
          <>
            <div className="pl pl-side">
              <img className="plate" src={d.plate2} width="1536" height="1024" alt="" draggable="false" decoding="async" fetchPriority="high" />
            </div>
            <div className="pl pl-main">
              <img src={d.plate2} width="1536" height="1024" alt="" draggable="false" decoding="async" fetchPriority="high" />
            </div>
          </>
        )}
      </div>

      {live?.Under && <live.Under ctx={ctx} />}

      <Texts texts={texts} />

      {/* клікабельні зони поверх намальованих елементів: href — шлях екрана (#/tarot) або back:#/запасний для «назад» */}
      {d.hits.filter((h) => !h.nav).map((h) => (
        <a key={h.label + h.x + h.y} className={`hit${h.nav ? ' hit-nav' : ''}`} {...hitProps(h)} style={rect(h)} aria-label={live?.hitLabel?.(h.label, state.values) ?? t(h.label)} />
      ))}

      {d.toggles.map((control) => (
        <button key={control.id} type="button" role="switch" aria-label={t(({ insights: 'Show daily insights', autosave: 'Autosave readings', notif: 'Notifications' })[control.id] ?? control.id)} aria-checked={!!on[control.id]} className="tog" style={rect(control)} onClick={() => flip(control.id)}>
          <i />
        </button>
      ))}

      {d.radios.map((r) => (
        <button
          key={r.group + r.value}
          type="button"
          role="radio"
          aria-checked={radio[r.group] === r.value}
          aria-label={r.value}
          className="rad"
          style={rect({ x: r.cx - r.d / 2, y: r.cy - r.d / 2, w: r.d, h: r.d })}
          onClick={() => setRadio((v) => ({ ...v, [r.group]: r.value }))}
        />
      ))}

      {d.checks.map((c) => (
        <button key={c.id} type="button" role="checkbox" aria-checked={!!on[c.id]} aria-label={c.id} className="chk" style={rect({ x: c.x, y: c.y, w: c.size, h: c.size })} onClick={() => flip(c.id)} />
      ))}

      {d.selects.map((s) => (
        <Fragment key={s.id}>
          {/* текст — поруч із прозорим select (не всередині), бо координати тексту відраховуються від сцени */}
          <Text t={{ ...s.t, s: optionLabel(s.id, sel[s.id]), tag: 'span' }} />
          <label className="sel" style={rect(s)}>
            <select
              value={sel[s.id]}
              onChange={(e) => {
                setSel((v) => ({ ...v, [s.id]: e.target.value }))
                live?.onSelect?.(s.id, e.target.value, ctx)?.catch((err) => say(err.message))
              }}
              aria-label={s.id}
            >
              {(state.options[s.id] ?? s.options).map((o) => (
                <option key={o} value={o}>{optionLabel(s.id, o)}</option>
              ))}
            </select>
          </label>
        </Fragment>
      ))}

      {d.inputs.map((i) => (
        <input
          key={i.id}
          ref={(el) => {
            fields.current[i.id] = el
          }}
          className="in"
          type={shown[i.id] ? 'text' : i.type}
          name={i.id}
          placeholder={t(i.placeholder)}
          aria-label={t(i.placeholder)}
          onKeyDown={(e) => e.key === 'Enter' && (actions.Send && i.id === 'msg' ? send() : clearable.has(i.id) && clear(i.id))}
          style={{ '--x': i.t.x, '--y': i.t.y, '--s': shift(i.t.x), '--w': i.w - (i.t.x - i.x) - 12, '--fs': i.t.fs, '--ls': i.t.ls, '--lh': i.t.lh, '--ph': i.t.c, color: '#f3efe7', fontFamily: FAMILY[i.t.f], fontWeight: i.t.wg }}
        />
      ))}

      {/* значок «око» у полях пароля: показати/сховати введене (малюнок значка — частина плити) */}
      {(d.reveals ?? []).map((r) => (
        <button key={r.id} type="button" className="hit act" aria-pressed={!!shown[r.id]} aria-label={shown[r.id] ? 'Hide password' : 'Show password'} style={rect({ ...r, r: 12 })} onClick={() => setShown((v) => ({ ...v, [r.id]: !v[r.id] }))} />
      ))}

      {/* кнопка надсилання в чаті: дія «Send» екрана, а без неї просто очищає поле */}
      {(d.clears ?? []).map((c) => (
        <button key={c.id + c.x} type="button" className="hit act" aria-label={c.label ?? 'Send'} style={rect({ ...c, r: c.r ?? 28 })} onClick={() => (actions.Send ? send() : clear(c.id))} />
      ))}

      {live?.Over && <live.Over ctx={ctx} />}
    </main>
  )
}
