// Tarot Studio — вибір розкладу й режиму (колода одна, тож вибору колоди немає). Номери — рядки з scripts/app/detections/tarot.json.
// Намальована картка «Select a deck» лишається на макеті: після збірки плити запускайте node scripts/app/lift-tarot.mjs, він її прибирає
// й піднімає картку режиму та кнопку на її місце (разом із текстами, радіо й зоною кнопки).
export default {
  dsl: `
@sidebar
9 h1 Tarot Studio
17 sub Choose a spread and get your reading
23 h2 Spreads
32 h3.s Daily Card
39 h3.s Three Cards
47 h3.s Relationship
59 h3.s Career
64 h3.s Life Purpose
72 h3.s Yes / No
42 h2 Reading mode
@radio mode quick 864 530 36 on
@radio mode detailed 864 590 36 off
@radio mode depth 864 650 36 off
49 body.l Quick
54 body.l Detailed
62 body.l In depth
- btn.s Start Reading | box=930,757,1121,787 pol=d
@hit Daily_Card 366 311 384 82 18 #/daily
@hit Three_Cards 366 397 384 82 18 #/reading
@hit Relationship 366 483 384 82 18 #/reading
@hit Career 366 567 384 82 18 #/reading
@hit Life_Purpose 366 651 384 82 18 #/reading
@hit Yes_/_No 366 735 384 82 18 #/reading
@hit Start_Reading 816 733 440 76 38 #/reading
@erase 1134 750 50 44 8
`,
}
