import { useRef } from 'react'

export default function SameRefManyInputs() {
  const fieldRef = useRef(null)

  return (
    <div>
      <input ref={fieldRef} type="text" placeholder="Поле 1" />{' '}
      <input ref={fieldRef} type="text" placeholder="Поле 2" />{' '}
      <input ref={fieldRef} type="text" placeholder="Поле 3" />
      <p>
        <button onClick={() => fieldRef.current.focus()}>Фокус на перше поле</button>
      </p>
    </div>
  )
}
