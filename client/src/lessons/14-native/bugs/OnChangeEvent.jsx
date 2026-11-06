import { useState } from 'react'
import { View, Text, TextInput } from 'react-native'

export default function OnChangeEvent() {
  const [name, setName] = useState('')

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <TextInput
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Твоє ім’я"
        style={{ borderWidth: 1, borderColor: '#999', padding: 8, borderRadius: 6 }}
      />
      <Text>Привіт, {name}!</Text>
    </View>
  )
}
