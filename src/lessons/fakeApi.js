// Навчальний «сервер» без мережі: усе працює офлайн, затримки та помилки — як у справжніх запитах.

const USERS = [
  { id: 1, name: 'Олена Коваль', city: 'Київ', email: 'olena@example.com', posts: 12 },
  { id: 2, name: 'Максим Бойко', city: 'Львів', email: 'maksym@example.com', posts: 7 },
  { id: 3, name: 'Ірина Шевчук', city: 'Одеса', email: 'iryna@example.com', posts: 21 },
  { id: 4, name: 'Андрій Мельник', city: 'Харків', email: 'andrii@example.com', posts: 3 },
]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Імітація fetch: НЕ кидає помилку на 404/500, а повертає відповідь із ok: false — як справжній fetch.
export async function fakeFetch(url, { delay = 600, fail = false } = {}) {
  await wait(delay)
  if (fail) throw new TypeError('Failed to fetch') // мережа недоступна
  const [, resource, id] = url.split('/')
  const makeResponse = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })

  if (resource === 'users' && id === undefined) return makeResponse(200, USERS)
  if (resource === 'users') {
    const user = USERS.find((u) => u.id === Number(id))
    return user ? makeResponse(200, user) : makeResponse(404, { error: 'Not found' })
  }
  return makeResponse(404, { error: 'Not found' })
}

// Зручні функції «API»
export async function getUsers({ delay = 600, fail = false } = {}) {
  await wait(delay)
  if (fail) throw new Error('Не вдалося завантажити користувачів')
  return USERS
}

// Різні затримки для різних id — щоб відтворити «гонку запитів»
export async function getUser(id, { fail = false } = {}) {
  await wait(id === 1 ? 1500 : 300)
  if (fail) throw new Error('Не вдалося завантажити користувача')
  const user = USERS.find((u) => u.id === id)
  if (!user) throw new Error('Користувача не знайдено')
  return user
}

export async function getPosts(userId, { delay = 500 } = {}) {
  await wait(delay)
  return Array.from({ length: 3 }, (_, i) => ({
    id: userId * 10 + i,
    userId,
    title: `Допис ${i + 1} від користувача ${userId}`,
  }))
}

export { USERS, wait }
