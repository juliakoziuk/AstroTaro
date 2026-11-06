import { useEffect, useState } from 'react'
import { getUsers, getPosts } from '../fakeApi.js'

// ЗАВДАННЯ: екран «Користувачі й дописи».
// Пиши прямо в цьому файлі, результат одразу видно на сторінці уроку.
//
// TODO 1. Завантаж список користувачів (getUsers) при появі екрана. Стани: loading / error / success.
//         Зроби це ОДНИМ state-об’єктом { status, data, error }, не трьома окремими булевими.
// TODO 2. loading — «Завантаження…», error — повідомлення + кнопка «Спробувати ще раз»,
//         success без користувачів — «Нікого немає».
// TODO 3. Клік по користувачу вантажить його дописи (getPosts(user.id)) під списком,
//         теж зі станами loading/error/success і БЕЗ гонки запитів (ignore у cleanup).
// TODO 4. Чекбокс «Імітувати помилку» (getUsers({ fail })) — перевір, що екран помилки працює.
// БОНУС 1. Винеси логіку в власний хук useAsync(fn, deps) → { status, data, error, reload }.
// БОНУС 2. Заміни fakeApi на справжній fetch('https://jsonplaceholder.typicode.com/users')
//          (не забудь перевірити res.ok і спіймати помилку).

export default function DataTask() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    let ignore = false
    getUsers().then((data) => {
      if (!ignore) setUsers(data)
    })
    return () => {
      ignore = true
    }
  }, [])

  void getPosts // використай у TODO 3

  return (
    <div>
      <p>Зараз завантажено користувачів: {users.length}. Додай стани loading / error і дописи.</p>
    </div>
  )
}
