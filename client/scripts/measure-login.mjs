// Вимір геометрії елементів референсу Login (1535x1024): bbox яскравих штрихів у зонах.
import sharp from 'sharp'
const SRC = '../assets/reference/login.webp'
const { data: lum, info } = await sharp(SRC).greyscale().raw().toBuffer({ resolveWithObject: true })
const med = await sharp(SRC).greyscale().median(25).raw().toBuffer()
const W = info.width
const ZONES = {
  sbCrest: [70, 30, 135, 90], sbWord: [70, 118, 135, 40],
  pill: [40, 220, 200, 78], navHomeIcon: [70, 240, 45, 42], navHomeLabel: [118, 245, 80, 32],
  chatIcon: [70, 318, 45, 38], chatLabel: [118, 322, 80, 30],
  analyticsIcon: [70, 388, 45, 38], analyticsLabel: [118, 390, 110, 32],
  accessIcon: [70, 456, 45, 40], accessLabel: [118, 460, 100, 32],
  settingsIcon: [70, 524, 45, 40], settingsLabel: [118, 528, 100, 32],
  helpIcon: [70, 592, 45, 40], helpLabel: [118, 596, 80, 32],
  sbDivider: [60, 826, 160, 24], toggle: [58, 852, 160, 58], toggleSun: [76, 866, 34, 30], toggleKnob: [112, 862, 52, 38], toggleMoon: [168, 866, 30, 30],
  cardCrest: [850, 70, 150, 110], cardWord: [820, 182, 210, 54], cardDivider: [690, 244, 470, 28],
  welcome: [760, 296, 330, 60], subtitle: [740, 356, 370, 36],
  emailBox: [650, 412, 550, 84], emailIcon: [676, 436, 46, 38], emailText: [730, 438, 170, 34],
  passBox: [650, 498, 550, 84], passIcon: [676, 520, 46, 44], passText: [730, 524, 130, 34], eyeIcon: [1130, 520, 50, 40],
  checkbox: [652, 590, 40, 38], remember: [694, 594, 140, 30], forgot: [1040, 594, 160, 30],
  signBtn: [650, 644, 550, 82], signStar: [858, 664, 40, 42], signText: [900, 668, 100, 36],
  orLine: [650, 738, 550, 28], orText: [912, 740, 28, 26],
  googleBtn: [650, 778, 550, 78], googleG: [798, 796, 44, 44], googleText: [846, 800, 215, 34],
  footerText: [770, 868, 215, 34], footerLink: [988, 868, 80, 34],
}
const T = Number(process.env.T || 16)
for (const [name, [x, y, w, h]] of Object.entries(ZONES)) {
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    if (lum[j * W + i] - med[j * W + i] > T) {
      n++
      if (i < x0) x0 = i
      if (i > x1) x1 = i
      if (j < y0) y0 = j
      if (j > y1) y1 = j
    }
  }
  console.log(name.padEnd(14), n ? `x ${x0}..${x1} (w ${x1 - x0 + 1})  y ${y0}..${y1} (h ${y1 - y0 + 1})  c ${((x0 + x1) / 2).toFixed(1)},${((y0 + y1) / 2).toFixed(1)}  px ${n}` : 'none')
}
