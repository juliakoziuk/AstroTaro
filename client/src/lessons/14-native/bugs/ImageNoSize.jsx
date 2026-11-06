import { View, Text, Image } from 'react-native'

export default function ImageNoSize() {
  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text>Логотип нижче:</Text>
      <Image source={{ uri: '/favicon.svg' }} />
      <Text>↑ тут має бути картинка</Text>
    </View>
  )
}
