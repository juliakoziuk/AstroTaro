// Settings — меню розділів і загальні налаштування. Номери — рядки з scripts/app/detections/settings.json.
// У цьому макеті активний пункт сайдбара — Settings (пілюля намальована в плиті).
export default {
  dsl: `
@sidebar
10 h1 Settings
12 sub Customize your experience in MYSTIQ
19 h3.m General
25 h3.m Notifications
32 h3.m Appearance
40 h3.m Language
48 h3.m Privacy & Security
56 h3.m Data & Storage
62 h3.m About
14 h2 General
20 body.s Basic app preferences
23 h3.k Show daily insights
28 body.f Get a short astrological update every day
@toggle insights 1377 336 65 35 on
33 h3.k Auto-save conversations
36 body.f Automatically save your chats and readings
@toggle autosave 1377 419 65 35 on
41 h3.k Use AI Companion
44 body.f Enable your personal mystical assistant
@toggle companion 1377 497 65 35 on
52 h3.k Default reading type
@select reading 54 body.v 1207 584 240 48 Astrology;Tarot;Dreams
58 h3.k Time format
@select time 60 body.v 1207 656 240 49 24-hour;12-hour
64 h3.k Date format
@select date 66 body.v 1207 728 240 49 DD/MM/YYYY;MM/DD/YYYY;YYYY-MM-DD
@hit Back 271 13 56 56 28 back:#/profile
`,
}
