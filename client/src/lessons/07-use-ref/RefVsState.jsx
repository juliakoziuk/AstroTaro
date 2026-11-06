import { useRef, useState } from 'react'
import { RenderBadge } from '../ui.jsx'

// Головна різниця: зміна ref НЕ перемальовує компонент, зміна state — перемальовує
export default function RefVsState() {
  const [stateCount, setStateCount] = useState(0)
  const refCount = useRef(0)
  const [shownRef, setShownRef] = useState(null)

  return (
    <div>
      <div className="row">
        <button onClick={() => setStateCount(stateCount + 1)}>state + 1</button>
        <strong>state: {stateCount}</strong>
      </div>
      <div className="row">
        <button onClick={() => (refCount.current += 1)}>ref + 1 (екран не оновиться)</button>
        <button onClick={() => setShownRef(refCount.current)}>Прочитати ref</button>
        <strong>ref на момент останнього «Прочитати»: {shownRef ?? '—'}</strong>
      </div>
      <RenderBadge label="Компонент перемальовувався" />
      <p className="muted">
        Клікай «ref + 1»: лічильник оновлень не росте. Після «state + 1» — росте, і тільки тоді екран «підхопить» нові
        дані.
      </p>
    </div>
  )
}
