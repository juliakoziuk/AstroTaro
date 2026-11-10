// Єдина модель меню застосунку: які розділи є, куди вони ведуть і яким сторінкам належать. Її використовують усі бічні панелі
// (намальовані екрани, «Draw»/«History», «Settings»), тож розділи й підсвітка поточного розділу скрізь однакові.
// `routes` — сторінки розділу (підсвічується пункт, у розділі якого людина зараз); кожна сторінка належить рівно одному пункту.
export const NAV = [
  { id: 'home', label: 'Home', path: '/dashboard', routes: ['/dashboard'] },
  { id: 'tarot', label: 'Tarot', path: '/tarot', routes: ['/tarot', '/reading', '/draw'] },
  { id: 'history', label: 'History', path: '/history', routes: ['/history'] },
  { id: 'dreams', label: 'Dreams', path: '/dreams', routes: ['/dreams'] },
  { id: 'astrology', label: 'Astrology', path: '/astrology', routes: ['/astrology', '/today'] },
  { id: 'analytics', label: 'Analytics', path: '/analysis', routes: ['/analysis'] },
  { id: 'access', label: 'Access', path: '/pricing', routes: ['/pricing'] },
  { id: 'settings', label: 'Settings', path: '/settings', routes: ['/settings'] },
  { id: 'help', label: 'Help', path: '/settings', routes: [] }, // довідка живе у вкладці «About» налаштувань
]

/** Який пункт меню підсвічувати на сторінці `route`; null, якщо сторінки немає в меню (напр. профіль). */
export const activeNav = (route) => NAV.find((n) => n.routes.includes(route))?.id ?? null
