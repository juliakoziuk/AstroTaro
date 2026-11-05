import { useMystiq } from '../storeCore.js'
import { PageHead, Chip } from '../ui.jsx'
import { go } from '../useHashRoute.js'
import { relativeDay } from '../dates.js'

// Короткі символічні значення образів: орієнтири для рефлексії, а не тлумачення «що буде»
const SYMBOL_HINTS = {
  вода: 'емоції та підсвідоме; стан води показує, наскільки спокійно ти почуваєшся з почуттями',
  політ: 'відчуття свободи або бажання піднятись над ситуацією',
  світло: 'ясність, увага, те, що стає видимим',
  відображення: 'погляд на себе збоку, самооцінка',
  будинок: 'внутрішній простір, різні частини особистості',
  ключ: 'доступ, рішення, яке вже є у твоїх руках',
  темрява: 'невідоме або те, чого поки не видно',
  потяг: 'рух життя, терміни, відчуття «встигнути»',
  дорога: 'шлях, вибір напрямку',
  поспіх: 'напруга очікувань і страх пропустити важливе',
  місяць: 'цикли, інтуїція, настрій',
  дзеркало: 'самоспостереження й чесність із собою',
  тиша: 'потреба в паузі та спокої',
}

const TONES = { Спокій: 'м’який, врівноважений', Захват: 'піднесений, живий', Цікавість: 'відкритий до нового', Тривога: 'напружений, пошуковий', Сум: 'тихий, ностальгійний' }

export default function Analysis({ param }) {
  const { dreams } = useMystiq()
  const dream = dreams.find((d) => d.id === param) ?? dreams[0]

  if (!dream) {
    return (
      <>
        <PageHead title="Аналіз сну">Записів ще немає. Додай перший сон у щоденнику.</PageHead>
        <button className="mq-btn mq-btn--lit" onClick={() => go('dreams')}>Відкрити Dream Journal</button>
      </>
    )
  }

  const repeats = dreams.filter((d) => d.id !== dream.id && d.symbols.some((s) => dream.symbols.includes(s)))
  const summary =
    `У цьому сні головні образи: ${dream.symbols.join(', ')}. Загальний настрій: ${TONES[dream.mood] ?? dream.mood.toLowerCase()}. ` +
    (repeats.length
      ? `Частина образів уже з’являлась у ${repeats.length} інших снах, тож варто придивитись, що в житті їх підживлює. `
      : 'Ці образи з’явились уперше, тому їх добре записати й спостерігати далі. ') +
    'Це гіпотеза для роздумів, а не тлумачення: лише ти знаєш, що ці образи означають для тебе.'

  return (
    <>
      <PageHead title="Аналіз сну">
        {dream.title} · {relativeDay(dream.date)}
      </PageHead>

      <div className="mq-chips" style={{ marginBottom: 20 }}>
        {dreams.map((d) => (
          <Chip key={d.id} active={d.id === dream.id} onClick={() => go('analysis/' + d.id)}>
            {d.title}
          </Chip>
        ))}
      </div>

      <div className="mq-analysis">
        <section className="mq-plaque" aria-label="Опис сну">
          <h2>Опис сну</h2>
          <p className="mq-prose">{dream.text}</p>
          <p className="muted small" style={{ marginTop: 12 }}>Прокинулась із відчуттям «{dream.mood.toLowerCase()}»</p>
        </section>

        <section className="mq-plaque" aria-label="Основні символи">
          <h2>Основні символи</h2>
          <ul className="mq-meanings">
            {dream.symbols.map((s) => (
              <li key={s}>
                <strong>{s}</strong>
                <span className="muted">{SYMBOL_HINTS[s] ?? 'образ, який варто порівняти з власними асоціаціями'}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mq-plaque" aria-label="Емоційний контекст">
          <h2>Емоційний контекст</h2>
          <div className="mq-chips">
            <Chip tone="glow">{dream.mood}</Chip>
            {dream.symbols.slice(0, 2).map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            {repeats.length
              ? `Схожі образи були в снах: ${repeats.map((d) => `«${d.title}»`).join(', ')}.`
              : 'Схожих снів у щоденнику поки немає.'}
          </p>
        </section>

        <section className="mq-plaque mq-tip" aria-label="AI-інтерпретація">
          <h2>AI-інтерпретація</h2>
          <p className="mq-prose">{summary}</p>
          <div className="mq-row" style={{ marginTop: 16 }}>
            <button className="mq-btn mq-btn--lit" onClick={() => go('companion')}>Обговорити з супутником</button>
            <button className="mq-btn" onClick={() => go('journal')}>Записати думку</button>
          </div>
        </section>
      </div>
    </>
  )
}
