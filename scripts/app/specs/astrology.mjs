// Astrology — натальна карта, планети й дрібні панелі. Номери — рядки з scripts/app/detections/astrology.json.
// Знаки зодіаку праворуч від назв (♋ ♍ …) — частина малюнка: обрізаємо текст за x1. Нижні підписи, що не виявились, — ручні рамки (gridcrop).
export default {
  dsl: `
@sidebar
7 h1 Astrology
- sub Your natal chart, insights, and cosmic guidance | box=301,140,801,166 pol=b
12 h3.s Natal Chart
20 body.f Your cosmic blueprint
30 h3.s Transits
37 body.f Current planetary influences
48 h3.s Compatibility
54 body.f Relationship analysis
64 h3.s Daily Forecast
75 body.f Personal astro guidance
81 h3.s Astro Calendar
88 body.f Important cosmic dates
13 h2.p Planets
22 small.n Sun
23 small.v Cancer | x1=1430
26 small.n Moon
27 small.v Virgo | x1=1431
35 small.n Mercury
31 small.v Gemini | x1=1430
39 small.n Venus
40 small.v Leo | x1=1430
45 small.n Mars
46 small.v Taurus | x1=1431
52 small.n Jupiter
53 small.v Pisces | x1=1430
58 small.n Saturn
59 small.v Aquarius | x1=1432
61 small.n Uranus
62 small.v Taurus | x1=1431
68 small.n Neptune
69 small.v Pisces | x1=1430
77 small.n Pluto
78 small.v Capricorn | x1=1433
- h3.e Your Essentials | box=735,610,863,631 pol=b
- small.e Sun Sign | box=773,650,830,667 pol=b
- small.e Cancer | box=893,650,940,668 pol=b
- small.e Moon Sign | box=773,686,845,705 pol=b
- small.e Virgo | box=904,686,940,705 pol=b
- small.e Ascendant | box=773,725,843,744 pol=b
- small.e Sagittarius | box=871,725,940,744 pol=b
86 h3.e Current Influences
92 small.e Mercury in Gemini
97 small.e Venus in Leo
101 small.e Mars in Taurus | x0=1046
- h3.e Upcoming Events | box=1271,610,1428,632 pol=b
94 small.e New Moon | x0=1305
- small.e Nov 1, 2026 | box=1400,655,1475,673 pol=b
99 small.e Full Moon | x0=1305
- small.e Nov 15, 2026 | box=1392,702,1475,720 pol=b
105 h2.b Get Your Full Astrology Report
110 body.b A detailed analysis of your chart, personality, and life path
108 btn.g Generate Report | x1=1384
@hit Generate_Report 1188 821 259 57 29 #/pricing
`,
}
