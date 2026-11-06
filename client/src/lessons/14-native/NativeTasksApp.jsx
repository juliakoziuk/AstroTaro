import { useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, Switch, StyleSheet } from 'react-native'

const initialTasks = [
  { id: '1', title: 'Вивчити JSX', done: true },
  { id: '2', title: 'Вивчити хуки', done: true },
  { id: '3', title: 'Спробувати React Native', done: false },
]

// Реалістичний екран RN: форма + список + перемикач. Уся логіка — той самий React із попередніх уроків.
export default function NativeTasksApp() {
  const [tasks, setTasks] = useState(initialTasks)
  const [text, setText] = useState('')
  const [hideDone, setHideDone] = useState(false)

  const visible = hideDone ? tasks.filter((t) => !t.done) : tasks

  function addTask() {
    if (!text.trim()) return
    setTasks([...tasks, { id: String(Date.now()), title: text.trim(), done: false }])
    setText('')
  }

  const toggleTask = (id) => setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Мої задачі</Text>

      <View style={styles.row}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Нова задача" />
        <Pressable style={({ pressed }) => [styles.addButton, pressed && styles.pressed]} onPress={addTask}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <View style={[styles.row, styles.switchRow]}>
        <Text>Сховати виконані</Text>
        <Switch value={hideDone} onValueChange={setHideDone} />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(task) => task.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.empty}>Тут порожньо 🙈</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => toggleTask(item.id)} style={styles.item}>
            <Text style={[styles.itemText, item.done && styles.doneText]}>
              {item.done ? '✅' : '⬜'} {item.title}
            </Text>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  switchRow: { justifyContent: 'space-between' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  addButton: { backgroundColor: '#6d4aff', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#fff', fontSize: 22, lineHeight: 24 },
  pressed: { opacity: 0.6 },
  item: { paddingVertical: 12 },
  itemText: { fontSize: 16 },
  doneText: { color: '#999', textDecorationLine: 'line-through' },
  separator: { height: 1, backgroundColor: '#eee' },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
})
