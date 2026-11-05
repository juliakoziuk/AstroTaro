import { useEffect, useRef, useState } from 'react'

// ЗАВДАННЯ: п’ять компонентів із useRef.
// Пиши прямо в цьому файлі, результат одразу видно на сторінці уроку.
//
// TODO 1. AutoFocusField: поле автоматично отримує фокус при появі (useRef + useEffect).
//         Кнопка «Очистити» очищає текст і повертає фокус у поле.
// TODO 2. ScrollBox: висока колонка (300 рядків «Рядок N») у блоці height: 150 із прокруткою,
//         кнопки «Вгору» і «Вниз» прокручують блок (ref + scrollTo).
// TODO 3. ClickCounter: рахує кліки у useRef (без перерендерів). Окрема кнопка «Показати»
//         кладе поточне значення ref у state й показує його. Поясни собі різницю зі useState.
// TODO 4. Previous: показує поточне й попереднє значення лічильника «було 3, стало 4».
//         Підказка: зберігай попереднє значення в ref, оновлюючи його в обробнику кліку.
// TODO 5. PlayPauseTimer: таймер з кнопкою «Пауза/Продовжити». id інтервалу — в ref, cleanup при зникненні.
// БОНУС. «Скопіювати»: кнопка бере значення поля через ref (без state) і показує його поруч.

function AutoFocusField() {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current.focus()
  }, [])

  return (
    <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Дороби мене" />
  )
}

export default function RefTask() {
  return (
    <div>
      <AutoFocusField />
    </div>
  )
}
