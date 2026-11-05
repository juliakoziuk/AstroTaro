// Dashboard — «Good evening, Julia». Номери — рядки з scripts/app/detections/dashboard.json (див. node_modules/.cache/app-build/dashboard.det.png).
export default {
  dsl: `
@sidebar
12 h1 Good evening,
20 h1 Julia
24 sub Your personal space for insight and balance
30 h3 Tarot
40 body Get a reading
31 h3 Dreams
41 body Log a dream
54 h3 Astrology
60 body Explore your chart
55 h3 Journal
61 body Write and reflect
69 h3 AI Companion
76 body Ask anything
70 h3 Progress
77 body Track your growth
10 h3.c Your Monthly Insight
16 small.p A time for self-discovery, new | p=insight
22 small.p perspectives, and inner balance. | p=insight
38 h3.c Your Activity
43 small Tarot readings
44 num.a 12
50 small Dreams logged
51 num.a 5
56 small Journal entries
57 num.a 8
63 small AI chats
64 num.a 24
71 h3.c Your Progress | x0=1168
78 small Personal growth this month
79 num.b 72%
@hit Tarot 283 272 370 140 26 #/tarot
@hit Dreams 683 272 370 140 26 #/dreams
@hit Astrology 283 436 370 125 26 #/astrology
@hit Journal 683 436 370 125 26 #/dreams
@hit AI_Companion 283 585 370 124 26 #/companion
@hit Progress 683 585 370 124 26 #/profile
@hit Monthly_Insight 1083 55 418 218 26 #/astrology
@hit Your_Activity 1085 298 416 264 26 #/profile
@hit Your_Progress 1085 588 416 209 26 #/profile
@erase 436 126 66 54 10
`,
}
