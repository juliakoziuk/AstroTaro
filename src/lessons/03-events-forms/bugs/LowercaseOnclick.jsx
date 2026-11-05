import { useState } from 'react'

export default function LowercaseOnclick() {
  const [likes, setLikes] = useState(0)

  return (
    <button onclick={() => setLikes(likes + 1)}>
      👍 {likes}
    </button>
  )
}
