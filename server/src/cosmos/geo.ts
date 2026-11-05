export interface Place {
  name: string
  lat: number
  lon: number
  country: string | null // ISO 3166-1 alpha-2, великими літерами
}

interface NominatimRow {
  display_name: string
  lat: string
  lon: string
  address?: { country_code?: string }
}

/** Відповідь Nominatim → наш формат; рядки з нечисловими координатами відкидаємо. */
export function parseNominatim(rows: NominatimRow[]): Place[] {
  return rows
    .map((r) => ({
      name: r.display_name,
      lat: Number(r.lat),
      lon: Number(r.lon),
      country: r.address?.country_code ? r.address.country_code.toUpperCase() : null,
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
}
