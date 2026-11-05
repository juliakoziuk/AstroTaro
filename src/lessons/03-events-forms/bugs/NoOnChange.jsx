import { useState } from 'react'

export default function NoOnChange() {
  const [text, setText] = useState('Спробуй мене стерти')

  return (
    <div>
      <input type="text" value={text} />
      <p>У state: {text}</p>
    </div>
  )
}
