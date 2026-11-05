import { useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { PhoneFrame } from '../ui.jsx'

// ЗАВДАННЯ: перенеси веб-картку товару (зліва) в React Native (праворуч у «телефоні»).
// Усе пишеш у компоненті ProductCardNative нижче; імпорти з 'react-native' вже готові.
//
// TODO 1. div → View, h3/p/span → Text (кожен рядок тексту ТІЛЬКИ в <Text>!), img → Image.
//         Image потребує явного розміру: width і height (64×64).
// TODO 2. Назва — жирна, ціна — зелена, стара ціна — перекреслена і сіра
//         (у RN: textDecorationLine: 'line-through').
// TODO 3. Картка: колонка з відступами, border-radius 12, світла рамка (borderWidth + borderColor!).
//         У RN немає border: '1px solid …' — тільки окремі властивості.
// TODO 4. Кнопка «У кошик»: Pressable з onPress (НЕ onClick). При натисканні змінює текст на «✓ Додано».
//         Стиль кнопки — зі StyleSheet; поки натиснута (pressed), напівпрозора.
// TODO 5. Усі стилі — у StyleSheet.create({...}) внизу, без inline-стилів (окрім динамічних).
// БОНУС. Додай рядок «Знижка −24%» у червоному бейджі (position: 'absolute' у куті картки).

const product = { name: 'Навушники Aura', price: 1890, oldPrice: 2490, imageUrl: '/favicon.svg' }

function ProductCardWeb() {
  return (
    <div style={{ width: 240, border: '1px solid #ccc', borderRadius: 12, padding: 12, color: '#222', background: '#fff' }}>
      <img src={product.imageUrl} alt="" width={64} height={64} />
      <h3 style={{ margin: '8px 0' }}>{product.name}</h3>
      <p style={{ margin: 0 }}>
        <strong style={{ color: 'green' }}>{product.price} ₴</strong>{' '}
        <s style={{ color: 'gray' }}>{product.oldPrice} ₴</s>
      </p>
      <button style={{ marginTop: 8 }}>У кошик</button>
    </div>
  )
}

function ProductCardNative() {
  const [added, setAdded] = useState(false)
  void added
  void setAdded
  void Image
  void Pressable

  return (
    <View style={styles.card}>
      <Text>Перенеси сюди веб-картку (дороби мене)</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { padding: 12 },
})

export default function ProductPortTask() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      <div>
        <p className="muted">Веб-версія (еталон):</p>
        <ProductCardWeb />
      </div>
      <div>
        <p className="muted">React Native (твоя):</p>
        <PhoneFrame height={300}>
          <ProductCardNative />
        </PhoneFrame>
      </div>
    </div>
  )
}
