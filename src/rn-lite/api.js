// Симулятор React Native (навчальний): не-компонентні API.

export const Platform = {
  OS: 'ios',
  select: (spec) => spec.ios ?? spec.native ?? spec.default,
}

export const Alert = {
  alert: (title, message) => window.alert(message ? `${title}\n\n${message}` : title),
}

// Розмір «екрана» телефону в рамці уроків
export function useWindowDimensions() {
  return { width: 340, height: 600, scale: 2, fontScale: 1 }
}
