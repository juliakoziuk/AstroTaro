// AI Companion — вибір асистента й чат. Номери — рядки з scripts/app/detections/companion.json.
// Смайли ✨ 🌙 у кінці реплік — частина малюнка (обрізаємо x1); рядки, що не виявились поруч зі світінням, — ручні рамки.
export default {
  dsl: `
@sidebar
9 h1 AI Companion | x0=303 y0=84 y1=133
15 sub Your personal mystical guide, always by your side
- h3.a Mystic Guide | box=417,240,545,264 pol=b
23 small.a Universal answers, life path
26 small.a and inner balance
34 h3.a Tarot Advisor
37 small.a Card meanings, spreads
41 small.a and interpretation
47 h3.a Astrologer
48 small.a Astrological insights
52 small.a and forecasts
60 h3.a Dream Interpreter
- small.a Dream analysis and symbolism | box=419,627,633,646 pol=b
66 h3.a Life Coach
70 small.a Support, motivation
71 small.a and personal growth
20 body.m Hello, I’m your AI Companion | x1=1078 p=b1
25 body.m I can help you with tarot readings, | p=b1
29 body.m astrology, dream analysis, and | p=b1
33 body.m life guidance. What would you like to explore | p=b1
35 body.m today? | p=b1
- small.t 15:42 | box=1163,370,1201,387 pol=b w=400
42 body.m Can you tell me what energy | p=b2
46 body.m the next week will bring? | p=b2
- small.t 15:44 | box=1166,478,1204,495 pol=b w=400
53 body.m Of course! | x1=902 p=b3
56 body.m The next week brings an energy of renewal | p=b3
62 body.m and movement. It’s a good time to finish | p=b3
63 body.m old matters, make clear decisions, and take | p=b3
- body.m a small but confident step toward your goals. | box=813,659,1203,680 pol=b p=b3
67 body.m You may also receive a supportive message | p=b3
69 body.m or meeting that inspires you. | p=b3
- small.t 15:45 | box=1163,726,1201,743 pol=b w=400
@input msg 77 body.m text 372 868 794 54 Type your message…
@hit Back 264 12 58 58 29 back:#/dashboard
@hit Tarot_Advisor 297 346 353 102 24 #/tarot
@hit Astrologer 297 460 353 102 24 #/astrology
@hit Dream_Interpreter 297 575 353 94 24 #/analysis
@clear msg 1187 867 72 57 Send
`,
}
