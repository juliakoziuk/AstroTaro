import { useState } from 'react'

const OPTIONS = {
  flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'],
  justifyContent: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
  alignItems: ['stretch', 'flex-start', 'center', 'flex-end'],
  flexWrap: ['nowrap', 'wrap'],
}

const BOXES = [
  { label: 'A', size: 40 },
  { label: 'B', size: 64 },
  { label: 'C', size: 40 },
  { label: 'D', size: 52 },
]

// Пісочниця Flexbox: міняй властивості контейнера й дивись, як змінюється розташування
export default function FlexPlayground() {
  const [style, setStyle] = useState({
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
    gap: 8,
  })

  const update = (key) => (e) => setStyle({ ...style, [key]: key === 'gap' ? Number(e.target.value) : e.target.value })

  const code = `<div style={{
  display: 'flex',
  flexDirection: '${style.flexDirection}',
  justifyContent: '${style.justifyContent}',
  alignItems: '${style.alignItems}',
  flexWrap: '${style.flexWrap}',
  gap: ${style.gap},
}}>`

  return (
    <div>
      <div className="playground">
        {Object.entries(OPTIONS).map(([key, values]) => (
          <label key={key}>
            {key}
            <select value={style[key]} onChange={update(key)}>
              {values.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        ))}
        <label>
          gap: {style.gap}
          <input type="range" min="0" max="30" value={style.gap} onChange={update('gap')} />
        </label>
      </div>

      <div className="flex-stage" style={{ display: 'flex', ...style }}>
        {BOXES.map((b) => (
          <div
            key={b.label}
            className="flex-box"
            style={{
              // у режимі stretch висота береться від контейнера, інакше — з розміру
              height: style.alignItems === 'stretch' && style.flexDirection.startsWith('row') ? undefined : b.size,
              width: style.flexDirection.startsWith('column') && style.alignItems === 'stretch' ? undefined : b.size + 20,
            }}
          >
            {b.label}
          </div>
        ))}
      </div>

      <pre className="code">
        <code>{code}</code>
      </pre>
      <p className="muted">
        <b>Головна вісь</b> — напрям <code>flexDirection</code>, її розташуванням керує <code>justifyContent</code>. <b>Поперечна вісь</b> —
        перпендикулярна, нею керує <code>alignItems</code>. Змінюєш напрям — осі міняються місцями.
      </p>
    </div>
  )
}
