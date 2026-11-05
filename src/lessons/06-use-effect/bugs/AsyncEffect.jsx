import { useEffect, useState } from 'react'
import { getUser } from '../../fakeApi.js'

export default function AsyncEffect() {
  const [name, setName] = useState('…')

  useEffect(async () => {
    const user = await getUser(2)
    setName(user.name)
  }, [])

  return <p>Користувач: {name}</p>
}
