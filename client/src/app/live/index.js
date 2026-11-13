// Реєстр «живих» екранів: для кожного — прив’язка текстів макета до даних API, завантаження, дії та оверлеї.
// Екран без запису тут лишається статичним (лендінг, логін — власні компоненти).
import { astrology } from './astrology.jsx'
import { analysis, dreams } from './dreams.jsx'
import { profile, settings } from './profile.jsx'
import { reading } from './reading.jsx'
import { dashboard, pricing, registerScreen, tarot } from './simple.jsx'

export const LIVE = { register: registerScreen, pricing, dashboard, tarot, reading, dreams, analysis, astrology, profile, settings }
