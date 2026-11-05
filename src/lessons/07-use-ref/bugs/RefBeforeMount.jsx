import { useRef } from 'react'

export default function RefBeforeMount() {
  const inputRef = useRef(null)

  inputRef.current.focus()

  return <input ref={inputRef} type="text" placeholder="Я хочу автофокус" />
}
