import { useRef } from 'react'

export default function ForgotCurrent() {
  const inputRef = useRef(null)

  return (
    <div className="row">
      <input ref={inputRef} type="text" placeholder="Сюди має потрапити фокус" />
      <button onClick={() => inputRef.focus()}>Фокус</button>
    </div>
  )
}
