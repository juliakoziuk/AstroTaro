import { View, Text } from 'react-native'

export default function DefaultColumn() {
  return (
    <View style={{ padding: 16, backgroundColor: '#eee' }}>
      <Text>Ліворуч</Text>
      <Text>Праворуч (я мав би бути поруч)</Text>
    </View>
  )
}
