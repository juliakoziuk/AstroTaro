import { useState } from 'react'

// ЗАВДАННЯ: п’ять маленьких інтерактивних компонентів на useState.
// Пиши прямо в цьому файлі, результат одразу видно на сторінці уроку.
//
// TODO 1. LikeButton: кнопка «❤ 12». Клік — ставить/знімає лайк (liked — boolean у state);
//         кількість обчислюй: 12 + (liked ? 1 : 0). Не зберігай кількість окремим state!
// TODO 2. Stars: п’ять зірок ★/☆. Клік по N-й зірці встановлює рейтинг N.
//         Повторний клік по поточній оцінці скидає рейтинг до 0.
// TODO 3. Faq: три питання-відповіді. Одночасно відкрите максимум одне: state openId (або null).
// TODO 4. Counter: − / + / «Скинути». Значення від 0 до 10, на межах кнопки disabled.
//         Використовуй функціональне оновлення (prev => …).
// TODO 5. Note: textarea з лімітом 120 символів. Показуй «Залишилось N»; коли залишилось менше 10,
//         підпис червоніє (клас "err"). Підказка: maxLength не використовуй, обмеж у onChange.
// БОНУС. Зроби компонент Reset: кнопка «Скинути все», що повертає всі п’ять компонентів у початковий стан
//        (підказка: підніми state нагору або використай key).

function LikeButton() {
  const [liked, setLiked] = useState(false)
  return <button onClick={() => setLiked(!liked)}>{liked ? 'liked' : 'not liked'} (дороби мене)</button>
}

export default function StateTask() {
  return (
    <div>
      <LikeButton />
    </div>
  )
}
