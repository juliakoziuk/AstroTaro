// Tarot Studio — вибір розкладу, колоди й режиму. Номери — рядки з scripts/app/detections/tarot.json.
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
24 h2 Select a deck
@select deck 29 body.l 835 311 399 64 Classic Tarot;Rider-Waite;Thoth;Marseille
42 h2 Reading mode
@radio mode quick 864 530 36 on
@radio mode detailed 864 590 36 off
@radio mode depth 864 650 36 off
49 body.l Quick
54 body.l Detailed
62 body.l In depth
- btn.s Start Reading | box=930,757,1121,787 pol=d
@hit Daily_Card 366 311 384 82 18 #/reading
@hit Three_Cards 366 397 384 82 18 #/reading
@hit Relationship 366 483 384 82 18 #/reading
@hit Career 366 567 384 82 18 #/reading
@hit Life_Purpose 366 651 384 82 18 #/reading
@hit Yes_/_No 366 735 384 82 18 #/reading
@hit Start_Reading 816 733 440 76 38 #/reading
@erase 1134 750 50 44 8
`,
}
