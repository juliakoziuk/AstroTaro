/** Перша літера імені для кружечка-аватара; перший символ беремо за кодовими точками, щоб емодзі не ламалося. */
export const initialOf = (name) => (Array.from(String(name ?? '').trim())[0] ?? '').toUpperCase()
