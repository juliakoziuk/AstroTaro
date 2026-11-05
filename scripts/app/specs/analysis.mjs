// Dream Analysis — список снів і розбір обраного. Номери — рядки з scripts/app/detections/analysis.json.
export default {
  dsl: `
@sidebar
10 h1 Dream Analysis
- sub Deep insights into the meaning of your dreams | box=342,141,832,167 pol=b
18 h2 My Dreams
20 body.n Add Dream | x0=698
29 h3.s Flying in the Sky
31 body.f I was flying above the clouds…
27 small.d Oct 28, 2026
36 h3.s Water and the Ocean
42 body.f I was standing by a vast ocean…
39 small.d Oct 25, 2026
47 h3.s The Lost City
56 body.f I discovered an ancient city…
48 small.d Oct 21, 2026
64 h3.s A Mysterious Door
67 body.f There was a door in a dark room…
65 small.d Oct 18, 2026
70 h3.s Meeting a Stranger
77 body.f I met a person I didn’t know…
71 small.d Oct 15, 2026
14 h2.d Flying in the Sky
23 small.d Oct 28, 2026 | x0=940
24 small.d Lucid Dream | x0=1128
30 h3.u Dream Summary | x0=946
32 body.p I was flying above the clouds, feeling light and free. The sky | p=sum
35 body.p was clear, and I could see a beautiful sunrise on the horizon. | p=sum
41 h3.u Analysis | x0=946 x1=1046
43 body.q Flying in a dream often symbolizes | p=an
46 body.q freedom, personal growth, and | p=an
49 body.q transcending limitations. It may indicate | p=an
55 body.q that you are gaining confidence, letting | p=an
60 body.q go of old fears, and moving toward | p=an
63 body.q new opportunities. | p=an
68 h3.u Key Meanings | x0=946 x1=1112
- body.c Freedom | box=964,823,1044,845 pol=b
- body.c Growth | box=1142,823,1208,845 pol=b
- body.c New opportunities | box=1307,823,1472,845 pol=b
@hit Back 281 24 54 54 27 back:#/dreams
@hit Add_Dream 640 234 190 52 26 #/dreams
`,
}
