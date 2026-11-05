// Tarot Reading — розклад із трьох карт і трактування. Номери — рядки з scripts/app/detections/reading.json.
// @erase у кінці: намальовані картки, значки, стрілки й розділювачі рядків списку та кнопки «Зберегти»/«Поділитися»/«Новий розклад» (кнопки малює сторінка: «Поділитися» прибрано). Їх малює сторінка (live/reading.jsx) лише
// для карт, що є в розкладі, тож у коротких розкладах (Так/Ні, Карта дня) зайвих місць і рядків немає.
export default {
  dsl: `
@sidebar
14 h1 Tarot Reading
16 sub Your personalized reading and interpretation
19 h2 Three Cards
24 body.l Past • Present • Future
42 h3.c Past
47 body.c The Moon
43 h3.c Present
48 body.c The Star
44 h3.c Future
49 body.c The Sun
55 h3.r Past
58 body.f A time of uncertainty and inner search.
62 h3.r Present
65 body.f Renewed hope and inspiration.
67 h3.r Future
77 body.f Success, clarity, and new possibilities.
25 h2 Interpretation
29 body.i A period of inner change is coming to an end. | p=interp
33 body.i Clarity, hope, and new opportunities are | p=interp
38 body.i ahead. Trust the process — you’re moving | p=interp
41 body.i toward greater balance and happiness. | p=interp
53 h3.b Save Reading
60 h3.b Share
- h3.b New Spread | box=1181,811,1327,841 pol=d
@hit Back 268 14 56 56 28 back:#/tarot
@erase 356 305 164 208 14
@erase 553 305 162 208 14
@erase 745 305 162 208 14
@erase 346 623 82 82 41
@erase 346 714 82 82 41
@erase 346 807 82 82 41
@erase 876 638 36 44 8
@erase 876 732 36 44 8
@erase 876 824 36 44 8
@erase 336 702 590 12 4
@erase 336 793 590 12 4
@erase 962 582 506 88 44
@erase 962 682 506 88 44
@erase 962 782 506 88 44
`,
}
