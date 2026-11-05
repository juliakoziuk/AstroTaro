import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'

export default function OnClickNotPress() {
  const [count, setCount] = useState(0)

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text>Кліків: {count}</Text>
      <Pressable onClick={() => setCount(count + 1)} style={{ backgroundColor: '#6d4aff', padding: 10 }}>
        <Text style={{ color: '#fff' }}>Натисни мене</Text>
      </Pressable>
    </View>
  )
}
