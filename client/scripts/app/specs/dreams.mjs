// Dream Journal — список снів і відкритий запис. Номери — рядки з scripts/app/detections/dreams.json.
// Підзаголовок над хмарами не виявився — рамка вручну; рядок дати виділеного запису теж (сяйво під ним).
export default {
  dsl: `
@sidebar
7 h1 Dream Journal
- sub Record, analyze and uncover the meaning of your dreams | box=346,141,931,167 pol=b
17 h2 My Dreams
19 body.n New Entry | x0=764
25 h3.s The Old House
27 body.f A mysterious house from my childhood…
- small.d Oct 28, 2026 | box=781,336,871,354 pol=b
32 h3.s The Forest
38 body.f I was walking through a dark forest…
35 small.d Oct 25, 2026
44 h3.s The Flying Whale
50 body.f A huge whale was flying in the sky…
45 small.d Oct 21, 2026
54 h3.s The Unknown Person
57 body.f I met someone I didn’t recognize…
55 small.d Oct 18, 2026
60 h3.s The Stairs
65 body.f I was climbing a long staircase…
61 small.d Oct 15, 2026
12 h2.d The Old House
21 small.d Oct 28, 2026 | x0=998
22 small.d Dream | x0=1176
39 h3.u My Dream
42 body.p I was in an old house from my childhood. The rooms | p=dream
43 body.p were familiar, but something had changed. I was | p=dream
48 body.p looking for a certain room, and when I found it, there | p=dream
51 body.p was a bright light inside. | p=dream
52 h3.u Interpretation | x0=1002 x1=1162
56 body.q This dream may symbolize a return to your | p=interp
58 body.q roots, inner exploration, and the discovery | p=interp
59 body.q of an important part of yourself. | p=interp
64 h3.u Tags | x0=1002
- body.c Childhood | box=989,886,1069,906 pol=b
- body.c House | box=1137,886,1187,906 pol=b
- body.c Search | box=1257,886,1314,906 pol=b
- body.c Light | box=1380,886,1422,906 pol=b
@hit Back 281 24 54 54 27 back:#/dashboard
@hit The_Old_House 291 309 600 106 22 #/analysis
@hit The_Forest 291 430 600 106 22 #/analysis
@hit The_Flying_Whale 291 551 600 106 22 #/analysis
@hit The_Unknown_Person 291 672 600 106 22 #/analysis
@hit The_Stairs 291 794 600 106 22 #/analysis
`,
}
