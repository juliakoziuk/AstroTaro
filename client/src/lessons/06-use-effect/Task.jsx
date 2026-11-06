import { useEffect, useState } from 'react'
import { getUser } from '../fakeApi.js'

// ЗАВДАННЯ: п’ять компонентів із useEffect.
// Пиши прямо в цьому файлі, результат одразу видно на сторінці уроку.
//
// TODO 1. Clock: показує час «гг:хх:сс», оновлюється щосекунди (setInterval + cleanup).
// TODO 2. WindowSize: показує ширину вікна «Ширина: N px» (addEventListener('resize') + cleanup).
// TODO 3. Countdown: відлік від 10 до 0 після натискання «Старт»; на 0 пише «Час вийшов!»
//         і таймер зупиняється. Кнопка «Скинути». Таймер ОБОВ’ЯЗКОВО очищується (cleanup).
// TODO 4. UserCard: кнопки 1–5 вибирають id; завантаж користувача через getUser(id)
//         зі станами loading / success / error і БЕЗ гонки запитів (прапорець ignore у cleanup).
// TODO 5. SavedNote: <textarea>, текст зберігається в localStorage під ключем 'lesson6-note'
//         (при кожній зміні) і читається при першому показі (ледача ініціалізація useState).
// БОНУС. Debounce-пошук: після паузи 500 мс у введенні показуй «Шукаємо: …».
//
// Не забувай про масив залежностей і підказки ESLint (npm run lint).

function Clock() {
  const [now] = useState(new Date())
  return <p>Дороби мене: {now.toLocaleTimeString('uk-UA')}</p>
}

export default function EffectTask() {
  // getUser імпортовано для TODO 4 — використай його в UserCard
  void getUser
  void useEffect
  return (
    <div>
      <Clock />
    </div>
  )
}
