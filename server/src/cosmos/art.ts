// Символ сну → слово для пошуку картини в колекції музею (Met Museum, суспільне надбання).
const QUERY: Record<string, string> = {
  House: 'house',
  Childhood: 'children',
  Light: 'sunrise',
  Search: 'path',
  Forest: 'forest',
  Water: 'sea',
  Flying: 'clouds',
  Stairs: 'staircase',
  Door: 'doorway',
  City: 'city',
  Animal: 'whale',
  Stranger: 'portrait',
  Falling: 'storm',
}

export const artQuery = (symbol: string) => QUERY[symbol] ?? 'night sky'
