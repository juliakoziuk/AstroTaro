import { BadGatewayException, Controller, Get, Module, Query, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { IsString, Length, MinLength } from 'class-validator'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { User } from '../users/user.model'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { apodFromLibrary, dailyIndex, isRealApod, LIBRARY_SEARCH_URL, LibraryItem } from './apod'
import { artQuery } from './art'
import { Place, parseNominatim } from './geo'
import { Holiday, upcomingHolidays } from './holidays'
import { cached, fetchJson, throttled, TtlCache } from './http'
import { zoneAt } from './timezone'

const HOUR = 3600_000
const places = new TtlCache<Place[]>(24 * HOUR)
const apodCache = new TtlCache<unknown>(6 * HOUR)
const quoteCache = new TtlCache<unknown>(6 * HOUR)
const sunCache = new TtlCache<unknown>(HOUR)
const holidayCache = new TtlCache<Holiday[]>(24 * HOUR)
const artCache = new TtlCache<unknown>(24 * HOUR)
const nominatimSlot = throttled(1100) // політика Nominatim: не частіше 1 запиту на секунду

/** Збій стороннього сервісу — це 502, а не помилка нашого сервера. */
async function upstream<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    const key = / 429$/.test((e as Error).message) ? 'rateLimited' : 'upstreamDown'
    throw new BadGatewayException(msg(currentLocale(), key, { name }))
  }
}

class GeoQuery {
  @IsString() @MinLength(2) q: string
}

class CountryQuery {
  @IsString() @Length(2, 2) country: string
}

@ApiTags('cosmos')
@ApiAuthed()
@UseGuards(JwtAuthGuard)
@Controller('cosmos')
export class CosmosController {
  constructor(@InjectModel(User) private users: typeof User) {}

  @ApiOperation({ summary: 'Пошук міста (Nominatim / OpenStreetMap)', description: 'Для місця народження: назва, широта, довгота й код країни.' })
  @ApiOkResponse({ description: '[{ name, lat, lon, country }]' })
  @Get('geo')
  geo(@Query() { q }: GeoQuery) {
    const locale = currentLocale()
    const key = `${locale}:${q.trim().toLowerCase()}`
    return upstream('Геокодування', () =>
      cached(places, key, () =>
        nominatimSlot(async () =>
          parseNominatim(await fetchJson(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&accept-language=${locale}&q=${encodeURIComponent(q)}`)),
        ),
      ),
    )
  }

  @ApiOperation({ summary: 'Космічне фото дня (NASA APOD)' })
  @ApiOkResponse({ description: '{ date, title, explanation, mediaType, url, copyright }' })
  @Get('apod')
  apod() {
    const key = process.env.NASA_API_KEY ?? 'DEMO_KEY'
    return upstream('NASA APOD', () =>
      cached(apodCache, 'today', async () => {
        const load = (date = '') => fetchJson<Record<string, string>>(`https://api.nasa.gov/planetary/apod?api_key=${key}${date && `&date=${date}`}`)
        // «Сьогоднішня» картинка інколи ще не опублікована або дає збій на боці NASA: тоді беремо вчорашню
        const d = await load().catch(() => load(new Date(Date.now() - 864e5).toISOString().slice(0, 10)))
        if (isRealApod(d)) return { date: d.date, title: d.title, explanation: d.explanation, mediaType: d.media_type, url: d.url, copyright: d.copyright?.trim() ?? null }
        // APOD віддав заглушку: показуємо знімок із NASA Image Library (той самий на весь день)
        const today = new Date().toISOString().slice(0, 10)
        const { collection } = await fetchJson<{ collection: { items: LibraryItem[] } }>(LIBRARY_SEARCH_URL)
        const withImage = collection.items.filter((i) => i.links?.[0]?.href)
        return apodFromLibrary(withImage[dailyIndex(today, withImage.length)], today)
      }),
    )
  }

  @ApiOperation({ summary: 'Цитата дня (ZenQuotes)', description: 'За умовами ZenQuotes поруч із цитатою треба показувати посилання на zenquotes.io.' })
  @ApiOkResponse({ description: '{ text, author, source }' })
  @Get('quote')
  quote() {
    return upstream('ZenQuotes', () =>
      cached(quoteCache, 'today', async () => {
        const [q] = await fetchJson<{ q: string; a: string }[]>('https://zenquotes.io/api/today')
        return { text: q.q, author: q.a, source: 'https://zenquotes.io' }
      }),
    )
  }

  @ApiOperation({ summary: 'Схід і захід сонця (sunrise-sunset.org)' })
  @ApiQuery({ name: 'lat', example: 50.45 })
  @ApiQuery({ name: 'lon', example: 30.52 })
  @ApiOkResponse({ description: '{ sunrise, sunset, solarNoon, timeZone } — ISO-час у UTC і IANA-зона точки' })
  @Get('sun')
  sun(@Query('lat') lat: string, @Query('lon') lon: string) {
    const [la, lo] = [Number(lat), Number(lon)]
    if (!(Math.abs(la) <= 90) || !(Math.abs(lo) <= 180) || lat === undefined || lon === undefined) throw new BadGatewayException(msg(currentLocale(), 'badCoords'))
    const key = `${la.toFixed(2)},${lo.toFixed(2)},${new Date().toISOString().slice(0, 10)}`
    return upstream('Sunrise-Sunset', () =>
      cached(sunCache, key, async () => {
        const { results: r } = await fetchJson<{ results: Record<string, string> }>(`https://api.sunrise-sunset.org/json?lat=${la}&lng=${lo}&formatted=0`)
        return { sunrise: r.sunrise, sunset: r.sunset, solarNoon: r.solar_noon, timeZone: zoneAt(la, lo) }
      }),
    )
  }

  @ApiOperation({ summary: 'Найближчі державні свята країни (Nager.Date)', description: 'Країна береться з параметра ?country=UA або з місця народження користувача.' })
  @ApiQuery({ name: 'country', required: false, example: 'UA' })
  @ApiOkResponse({ description: '{ country, holidays: [{ date, localName, name }] }' })
  @Get('holidays')
  async holidays(@CurrentUser() u: { id: string }, @Query() q: Partial<CountryQuery>) {
    const country = (q.country ?? (await this.users.findByPk(u.id)).country ?? '').toUpperCase()
    if (country.length !== 2) return { country: null, holidays: [] }
    const year = new Date().getFullYear()
    const all = await upstream('Nager.Date', async () => {
      const load = (y: number) => cached(holidayCache, `${country}-${y}`, () => fetchJson<Holiday[]>(`https://date.nager.at/api/v3/PublicHolidays/${y}/${country}`))
      return [...(await load(year)), ...(await load(year + 1))]
    })
    const today = new Date().toISOString().slice(0, 10)
    return { country, holidays: upcomingHolidays(all, today, 5).map((h) => ({ date: h.date, localName: h.localName, name: h.name })) }
  }

  @ApiOperation({ summary: 'Картина до символу сну (Met Museum, суспільне надбання)' })
  @ApiQuery({ name: 'symbol', example: 'Water' })
  @ApiOkResponse({ description: '{ title, artist, year, image, url, source } або null' })
  @Get('art')
  art(@Query('symbol') symbol = '') {
    const q = artQuery(symbol)
    return upstream('Met Museum', () => cached(artCache, q, () => findArt(q)))
  }
}

const MET = 'https://collectionapi.metmuseum.org/public/collection'

async function findArt(q: string) {
  // спершу відомі картини (highlights), потім будь-які картини, потім усе суспільне надбання
  for (const filter of ['&isHighlight=true&medium=Paintings', '&medium=Paintings', '&isHighlight=true', '']) {
    const found = await fetchJson<{ objectIDs: number[] | null }>(`${MET}/v1.1/search?hasImages=true&isPublicDomain=true${filter}&q=${encodeURIComponent(q)}`)
    for (const id of (found.objectIDs ?? []).slice(0, 6)) {
      const o = await fetchJson<Record<string, string | boolean>>(`${MET}/v1/objects/${id}`)
      if (o.isPublicDomain && o.primaryImageSmall) {
        return { title: o.title, artist: o.artistDisplayName || 'Unknown artist', year: o.objectDate, image: o.primaryImageSmall, url: o.objectURL, source: 'The Met (public domain)' }
      }
    }
  }
  return null
}

@Module({ imports: [SequelizeModule.forFeature([User])], controllers: [CosmosController] })
export class CosmosModule {}
