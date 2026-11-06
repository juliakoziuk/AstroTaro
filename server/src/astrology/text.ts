// Тексти астрології двома мовами. Розрахунки (astro.ts) віддають англійські ідентифікатори знаків і планет;
// тут вони перетворюються на назви та фрази мовою користувача.
import { Locale, LOCALES } from '../i18n/locale'
import { longitudeOf, MoonEvent, signOf } from './astro'

type T2 = [string, string]
const at = (t: T2, l: Locale) => t[LOCALES.indexOf(l)]

const SIGN_NAMES: Record<string, T2> = {
  Aries: ['Aries', 'Овен'],
  Taurus: ['Taurus', 'Телець'],
  Gemini: ['Gemini', 'Близнюки'],
  Cancer: ['Cancer', 'Рак'],
  Leo: ['Leo', 'Лев'],
  Virgo: ['Virgo', 'Діва'],
  Libra: ['Libra', 'Терези'],
  Scorpio: ['Scorpio', 'Скорпіон'],
  Sagittarius: ['Sagittarius', 'Стрілець'],
  Capricorn: ['Capricorn', 'Козеріг'],
  Aquarius: ['Aquarius', 'Водолій'],
  Pisces: ['Pisces', 'Риби'],
}

const PLANET_NAMES: Record<string, T2> = {
  Sun: ['Sun', 'Сонце'],
  Moon: ['Moon', 'Місяць'],
  Mercury: ['Mercury', 'Меркурій'],
  Venus: ['Venus', 'Венера'],
  Mars: ['Mars', 'Марс'],
  Jupiter: ['Jupiter', 'Юпітер'],
  Saturn: ['Saturn', 'Сатурн'],
  Uranus: ['Uranus', 'Уран'],
  Neptune: ['Neptune', 'Нептун'],
  Pluto: ['Pluto', 'Плутон'],
}

const MOON_EVENTS: Record<MoonEvent['name'], T2> = {
  'New Moon': ['New Moon', 'Новий місяць'],
  'Full Moon': ['Full Moon', 'Повний місяць'],
}

export const signName = (sign: string, locale: Locale) => at(SIGN_NAMES[sign], locale)
export const planetName = (planet: string, locale: Locale) => at(PLANET_NAMES[planet], locale)
export const moonEventName = (name: MoonEvent['name'], locale: Locale) => at(MOON_EVENTS[name], locale)

const IN_SIGN: Record<Locale, (planet: string, sign: string) => string> = {
  en: (p, s) => `${p} in ${s}`,
  uk: (p, s) => `${p}: ${s}`,
}

/** «Mercury in Gemini» за граматикою мови (planet і sign — англійські ідентифікатори). */
export const inSign = (planet: string, sign: string, locale: Locale) => IN_SIGN[locale](planetName(planet, locale), signName(sign, locale))

const MONTHLY_INSIGHT: Record<string, T2> = {
  Aries: ['A time for bold beginnings, courage and trusting your own spark.', 'Час сміливих починань, відваги й довіри до власної іскри.'],
  Taurus: ['A time for grounding, patience and enjoying what you have built.', 'Час для опори на землю, терпіння й насолоди тим, що вже створено.'],
  Gemini: ['A time for curiosity, conversation and new perspectives.', 'Час цікавості, розмов і нових поглядів.'],
  Cancer: ['A time for self-discovery, new perspectives, and inner balance.', 'Час для самопізнання, нових поглядів і внутрішньої рівноваги.'],
  Leo: ['A time for creative expression, warmth and being seen.', 'Час творчого самовираження, тепла й того, щоб тебе помітили.'],
  Virgo: ['A time for order, care of the details and healthy routines.', 'Час порядку, уваги до деталей і здорових звичок.'],
  Libra: ['A time for harmony, fair choices and meaningful connection.', 'Час гармонії, справедливого вибору й змістовного зв’язку.'],
  Scorpio: ['A time for depth, honest endings and quiet transformation.', 'Час глибини, чесних завершень і тихої трансформації.'],
  Sagittarius: ['A time for exploration, big questions and open horizons.', 'Час відкриттів, великих питань і відкритих горизонтів.'],
  Capricorn: ['A time for discipline, long goals and steady progress.', 'Час дисципліни, довгих цілей і сталого поступу.'],
  Aquarius: ['A time for fresh ideas, community and independent thinking.', 'Час свіжих ідей, спільноти й незалежного мислення.'],
  Pisces: ['A time for intuition, compassion and listening to dreams.', 'Час інтуїції, співчуття й прислухання до снів.'],
}

/** Місячний інсайт залежить від знака, у якому зараз Сонце. */
export const monthlyInsight = (now: Date, locale: Locale) => at(MONTHLY_INSIGHT[signOf(longitudeOf('Sun', now)).sign], locale)
