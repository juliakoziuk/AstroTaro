import { useMystiq } from '../storeCore.js'
import { cardOfDay, SPREADS } from '../tarotData.js'
import { moonInfo, moonSign, glyphOf } from '../astro.js'
import { TODAY, relativeDay } from '../dates.js'
import TarotCard from '../TarotCard.jsx'
import { go } from '../useHashRoute.js'

function greeting() {
  const h = TODAY.getHours()
  if (h < 5) return 'Доброї ночі'
  if (h < 12) return 'Доброго ранку'
  if (h < 18) return 'Доброго дня'
  return 'Доброго вечора'
}

export default function Dashboard() {
  const { dreams, journal, spreads } = useMystiq()
  const card = cardOfDay(TODAY)
  const moon = moonInfo(TODAY)
  const sign = moonSign(TODAY)
  const lastSpread = spreads[0]
  const lastDream = dreams[0]
  const spreadName = lastSpread ? SPREADS.find((s) => s.id === lastSpread.spreadId)?.name : null

  return (
    <>
      <div className="p-hero">
        <section className="p-card p-hero-art" aria-label="Вітання">
          <div className="p-hero-copy">
            <span className="p-tag">{TODAY.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</span>
            <h1>
              {greeting()}, <span className="gold">мандрівнице</span>
            </h1>
            <p className="p-sub">Зупинись, озирнись і знайди нові погляди через таро, сни, астрологію та уважний щоденник. Відображення, а не передбачення.</p>
            <button className="p-btn p-btn--primary" onClick={() => go('tarot')}>Почати подорож ↗</button>
          </div>
          <div className="p-moon" aria-hidden="true">☾</div>
        </section>

        <section className="p-card" aria-label="Інсайт дня">
          <h2>Карта дня</h2>
          <p className="p-text">Тиха підказка для сьогоднішнього шляху.</p>
          <div className="p-insight">
            <TarotCard card={card} width={104} flipped />
            <div>
              <h3>{card.name}</h3>
              <p className="p-text">{card.advice}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="p-grid p-grid-3">
        <div className="p-card">
          <div className="gold">☾ &nbsp; Фаза Місяця</div>
          <div className="p-metric">{moon.name}</div>
          <p className="p-text">Місяць у знаку {sign.name} {glyphOf(sign)}</p>
        </div>
        <div className="p-card">
          <div className="gold">✧ &nbsp; Таро дня</div>
          <div className="p-metric">{card.name}</div>
          <p className="p-text">{card.keywords.slice(0, 3).join(', ')}</p>
        </div>
        <div className="p-card">
          <div className="gold">✎ &nbsp; Щоденник</div>
          <div className="p-metric">{journal.length} записів</div>
          <p className="p-text">Твої роздуми цього місяця.</p>
        </div>
      </div>

      <div className="p-grid p-grid-2">
        <section className="p-card" aria-label="Продовжити">
          <h2>Продовжити</h2>
          <div className="p-list">
            {lastSpread && (
              <div className="p-row">
                <div className="p-iconbox">✧</div>
                <div>
                  <div className="p-row-title">Останній розклад таро</div>
                  <div className="p-row-sub">{spreadName} · {relativeDay(lastSpread.date)}</div>
                </div>
                <button className="p-btn" onClick={() => go('reading')}>Відкрити</button>
              </div>
            )}
            {lastDream && (
              <div className="p-row">
                <div className="p-iconbox">☾</div>
                <div>
                  <div className="p-row-title">{lastDream.title}</div>
                  <div className="p-row-sub">Щоденник снів · {relativeDay(lastDream.date)}</div>
                </div>
                <button className="p-btn" onClick={() => go('analysis/' + lastDream.id)}>Відкрити</button>
              </div>
            )}
            {!lastSpread && !lastDream && <p className="p-text">Тут з’являться твої останні розклади та сни.</p>}
          </div>
        </section>

        <section className="p-card" aria-label="Швидкі дії">
          <h2>Швидкі дії</h2>
          <p className="p-text">Обери невеликий момент для себе.</p>
          <div className="p-actions">
            <button className="p-btn" onClick={() => go('tarot')}>✧ Новий розклад</button>
            <button className="p-btn" onClick={() => go('dreams')}>☾ Записати сон</button>
            <button className="p-btn" onClick={() => go('journal')}>✎ Нотатка</button>
          </div>
        </section>
      </div>
    </>
  )
}
