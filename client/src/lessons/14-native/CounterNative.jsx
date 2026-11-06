import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'

// REACT NATIVE: та сама логіка (useState!), інші «цеглинки»: View, Text, Pressable, onPress, StyleSheet
export default function CounterNative() {
  const [count, setCount] = useState(0)

  return (
    <View style={styles.container}>
      <Text style={styles.count}>Кліків: {count}</Text>
      <Pressable style={styles.button} onPress={() => setCount(count + 1)}>
        <Text style={styles.buttonText}>Клікни</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 16, gap: 8 },
  count: { fontSize: 24 },
  button: { backgroundColor: '#6d4aff', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
})
