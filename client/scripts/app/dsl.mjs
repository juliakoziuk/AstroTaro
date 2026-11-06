// Формат опису екрана (специфікація). Один рядок = один елемент; # — коментар.
//
//   @sidebar                                     бічна панель: MYSTIQ, 6 пунктів меню + посилання (автопошук у виявлених рядках)
//   <idx> <cls> <текст> [| опції]                живий текст, прив'язаний до виявленого рядка № idx (scripts/app/detections)
//   -     <cls> <текст> | box=x0,y0,x1,y1 [pol=d|b]   текст без привʼязки: рамка задана вручну й уточнюється за пікселями
//        опції: x0= x1= y0= y1= (обрізати тісний bbox), tag= (h1…, span, a), w= (вага), c=#hex (колір), p=<група абзацу>,
//               href= (зробити посиланням)
//   @hit <мітка> <x> <y> <w> <h> <r> <href>      невидима клікабельна зона (hover-сяйво) з міткою для доступності;
//                                                href: #/шлях (перехід) або back:#/запасний (крок назад в історії)
//   @toggle <id> <x> <y> <w> <h> on|off          живий перемикач (стирає намальований)
//   @radio <група> <значення> <cx> <cy> <d> on|off
//   @check <id> <x> <y> <size> on|off
//   @select <id> <idx> <cls> <x> <y> <w> <h> <опція1;опція2;…>   нативний select поверх намальованої таблетки
//   @input <id> <idx> <cls> <type> <x> <y> <w> <h> <placeholder>
//   @reveal <inputId> x y w h                    зона значка «око»: показує/ховає введений пароль
//   @clear <inputId> x y w h [мітка]             зона кнопки «надіслати»: очищає поле (у чаті немає бекенду)
//   @erase <x> <y> <w> <h> [r]                   додаткова ділянка стирання (скруглений прямокутник)
//
// Усі координати — в одиницях макета (1536x1024).
export function parseDsl(src) {
  const out = { sidebar: false, texts: [], hits: [], toggles: [], radios: [], checks: [], selects: [], inputs: [], reveals: [], clears: [], erase: [] }
  const lines = src.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  for (const line of lines) {
    const [main, optStr] = line.split(/\s\|\s/)
    const opts = {}
    if (optStr) {
      for (const kv of optStr.trim().split(/\s+/)) {
        const i = kv.indexOf('=')
        opts[kv.slice(0, i)] = kv.slice(i + 1)
      }
    }
    const tok = main.split(/\s+/)
    if (tok[0] === '@sidebar') out.sidebar = true
    else if (tok[0] === '@hit') {
      const [, label, x, y, w, h, r, href] = tok
      out.hits.push({ label: label.replace(/_/g, ' '), x: +x, y: +y, w: +w, h: +h, r: +r, href })
    } else if (tok[0] === '@toggle') {
      const [, id, x, y, w, h, st] = tok
      out.toggles.push({ id, x: +x, y: +y, w: +w, h: +h, on: st === 'on' })
    } else if (tok[0] === '@radio') {
      const [, group, value, cx, cy, d, st] = tok
      out.radios.push({ group, value, cx: +cx, cy: +cy, d: +d, on: st === 'on' })
    } else if (tok[0] === '@check') {
      const [, id, x, y, size, st] = tok
      out.checks.push({ id, x: +x, y: +y, size: +size, on: st === 'on' })
    } else if (tok[0] === '@select') {
      const [, id, idx, cls, x, y, w, h] = tok
      const options = tok.slice(8).join(' ').split(';')
      out.selects.push({ id, idx: +idx, cls, x: +x, y: +y, w: +w, h: +h, options })
    } else if (tok[0] === '@input') {
      const [, id, idx, cls, type, x, y, w, h] = tok
      out.inputs.push({ id, idx: +idx, cls, type, x: +x, y: +y, w: +w, h: +h, placeholder: tok.slice(9).join(' ') })
    } else if (tok[0] === '@reveal') {
      const [, id, x, y, w, h] = tok
      out.reveals.push({ id, x: +x, y: +y, w: +w, h: +h })
    } else if (tok[0] === '@clear') {
      const [, id, x, y, w, h] = tok
      out.clears.push({ id, x: +x, y: +y, w: +w, h: +h, label: tok.slice(6).join(' ') || undefined })
    } else if (tok[0] === '@erase') {
      const [, x, y, w, h, r] = tok
      out.erase.push({ x: +x, y: +y, w: +w, h: +h, r: +(r ?? 0) })
    } else if (/^\d+$/.test(tok[0]) || tok[0] === '-') {
      // «-» замість номера: рядок без привʼязки до виявлення, потрібна опція box=x0,y0,x1,y1 (напр. темний текст на золотій кнопці)
      out.texts.push({ idx: tok[0] === '-' ? -1 : +tok[0], cls: tok[1], text: tok.slice(2).join(' '), opts })
    } else {
      throw new Error('не розумію рядок специфікації: ' + line)
    }
  }
  return out
}
