// Тексти астрології трьома мовами. Розрахунки (astro.ts) віддають англійські ідентифікатори знаків і планет;
// тут вони перетворюються на назви та фрази мовою користувача.
import { Locale, LOCALES } from '../i18n/locale'
import { longitudeOf, MoonEvent, signOf } from './astro'

type T3 = [string, string, string]
const at = (t: T3, l: Locale) => t[LOCALES.indexOf(l)]

const SIGN_NAMES: Record<string, T3> = {
  Aries: ['Aries', 'Овен', 'Aries'],
  Taurus: ['Taurus', 'Телець', 'Tauro'],
  Gemini: ['Gemini', 'Близнюки', 'Géminis'],
  Cancer: ['Cancer', 'Рак', 'Cáncer'],
  Leo: ['Leo', 'Лев', 'Leo'],
  Virgo: ['Virgo', 'Діва', 'Virgo'],
  Libra: ['Libra', 'Терези', 'Libra'],
  Scorpio: ['Scorpio', 'Скорпіон', 'Escorpio'],
  Sagittarius: ['Sagittarius', 'Стрілець', 'Sagitario'],
  Capricorn: ['Capricorn', 'Козеріг', 'Capricornio'],
  Aquarius: ['Aquarius', 'Водолій', 'Acuario'],
  Pisces: ['Pisces', 'Риби', 'Piscis'],
}

const PLANET_NAMES: Record<string, T3> = {
  Sun: ['Sun', 'Сонце', 'Sol'],
  Moon: ['Moon', 'Місяць', 'Luna'],
  Mercury: ['Mercury', 'Меркурій', 'Mercurio'],
  Venus: ['Venus', 'Венера', 'Venus'],
  Mars: ['Mars', 'Марс', 'Marte'],
  Jupiter: ['Jupiter', 'Юпітер', 'Júpiter'],
  Saturn: ['Saturn', 'Сатурн', 'Saturno'],
  Uranus: ['Uranus', 'Уран', 'Urano'],
  Neptune: ['Neptune', 'Нептун', 'Neptuno'],
  Pluto: ['Pluto', 'Плутон', 'Plutón'],
}

const MOON_EVENTS: Record<MoonEvent['name'], T3> = {
  'New Moon': ['New Moon', 'Новий місяць', 'Luna nueva'],
  'Full Moon': ['Full Moon', 'Повний місяць', 'Luna llena'],
}

export const signName = (sign: string, locale: Locale) => at(SIGN_NAMES[sign], locale)
export const planetName = (planet: string, locale: Locale) => at(PLANET_NAMES[planet], locale)
export const moonEventName = (name: MoonEvent['name'], locale: Locale) => at(MOON_EVENTS[name], locale)

const IN_SIGN: Record<Locale, (planet: string, sign: string) => string> = {
  en: (p, s) => `${p} in ${s}`,
  uk: (p, s) => `${p}: ${s}`,
  es: (p, s) => `${p} en ${s}`,
}

/** «Mercury in Gemini» за граматикою мови (planet і sign — англійські ідентифікатори). */
export const inSign = (planet: string, sign: string, locale: Locale) => IN_SIGN[locale](planetName(planet, locale), signName(sign, locale))

const MONTHLY_INSIGHT: Record<string, T3> = {
  Aries: ['A time for bold beginnings, courage and trusting your own spark.', 'Час сміливих починань, відваги й довіри до власної іскри.', 'Un tiempo de comienzos audaces, valentía y confianza en tu propia chispa.'],
  Taurus: ['A time for grounding, patience and enjoying what you have built.', 'Час для опори на землю, терпіння й насолоди тим, що вже створено.', 'Un tiempo para echar raíces, tener paciencia y disfrutar lo que has construido.'],
  Gemini: ['A time for curiosity, conversation and new perspectives.', 'Час цікавості, розмов і нових поглядів.', 'Un tiempo de curiosidad, conversación y nuevas perspectivas.'],
  Cancer: ['A time for self-discovery, new perspectives, and inner balance.', 'Час для самопізнання, нових поглядів і внутрішньої рівноваги.', 'Un tiempo de autodescubrimiento, nuevas perspectivas y equilibrio interior.'],
  Leo: ['A time for creative expression, warmth and being seen.', 'Час творчого самовираження, тепла й того, щоб тебе помітили.', 'Un tiempo de expresión creativa, calidez y de dejarte ver.'],
  Virgo: ['A time for order, care of the details and healthy routines.', 'Час порядку, уваги до деталей і здорових звичок.', 'Un tiempo de orden, cuidado de los detalles y rutinas saludables.'],
  Libra: ['A time for harmony, fair choices and meaningful connection.', 'Час гармонії, справедливого вибору й змістовного зв’язку.', 'Un tiempo de armonía, decisiones justas y conexiones significativas.'],
  Scorpio: ['A time for depth, honest endings and quiet transformation.', 'Час глибини, чесних завершень і тихої трансформації.', 'Un tiempo de profundidad, finales honestos y transformación silenciosa.'],
  Sagittarius: ['A time for exploration, big questions and open horizons.', 'Час відкриттів, великих питань і відкритих горизонтів.', 'Un tiempo de exploración, grandes preguntas y horizontes abiertos.'],
  Capricorn: ['A time for discipline, long goals and steady progress.', 'Час дисципліни, довгих цілей і сталого поступу.', 'Un tiempo de disciplina, metas a largo plazo y progreso constante.'],
  Aquarius: ['A time for fresh ideas, community and independent thinking.', 'Час свіжих ідей, спільноти й незалежного мислення.', 'Un tiempo de ideas frescas, comunidad y pensamiento independiente.'],
  Pisces: ['A time for intuition, compassion and listening to dreams.', 'Час інтуїції, співчуття й прислухання до снів.', 'Un tiempo de intuición, compasión y de escuchar a los sueños.'],
}

/** Місячний інсайт залежить від знака, у якому зараз Сонце. */
export const monthlyInsight = (now: Date, locale: Locale) => at(MONTHLY_INSIGHT[signOf(longitudeOf('Sun', now)).sign], locale)
