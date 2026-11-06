// ЗАВДАННЯ: зроби з даних user картку профілю.
// Редагуй цей файл — результат одразу видно на сторінці уроку в блоці «Твоє завдання».
//
// TODO 1. Заголовок <h2> з іменем і картинка <img> (src = avatarUrl, не забудь alt).
// TODO 2. Кружечок <span> зі style: зелений, якщо isOnline, інакше сірий (тернарний оператор),
//         поруч текст «онлайн» / «офлайн».
// TODO 3. Рядок «Досвід: 8 років, FullStack Developer» — дані з workingExperience[0] і [1].
// TODO 4. Рядок «Хобі: Reading, Snowboard, Computer Games» — підказка: hobbies.join(', ').
// TODO 5. Три рядки навичок (html, css, js). Під кожною — смужка <div> зі style,
//         де width = рівень * 20 + '%' (максимум 5 → 100%). Висота та колір — на твій смак.
// TODO 6. Посилання на пошту: <a href=...> з mailto: і текстом email.
//         (підказка: шаблонний рядок `mailto:${user.email}`)
// TODO 7. Якщо рівень js >= 4.5 — покажи бейдж «JS Pro» (через &&).
// TODO 8. Додай свій коментар у JSX, що пояснює якийсь блок (як правильно писати коментар?).
// БОНУС. <label> + <input> «Повідомлення» зі зв'язком через htmlFor/id.

export default function ProfileCardTask() {
  const user = {
    name: 'Vitalii',
    avatarUrl: '/favicon.svg',
    isOnline: true,
    hobbies: ['Reading', 'Snowboard', 'Computer Games'],
    workingExperience: [8, 'FullStack Developer'],
    skills: { html: 4, css: 4, js: 4.5 },
    email: 'some-fake@email.ua',
  }

  return (
    <article className="profile">
      <p>Почни тут: заміни цей рядок на картку профілю для {user.name}.</p>
    </article>
  )
}
