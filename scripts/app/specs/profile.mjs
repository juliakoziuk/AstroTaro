// Profile — картка користувача, активність і налаштування акаунта. Номери — рядки з scripts/app/detections/profile.json.
export default {
  dsl: `
@sidebar
8 h1 Profile
- sub Manage your account, preferences, and personal information | box=284,138,865,163 pol=b
15 h2.d Yullia
24 body.e yuliia@example.com
30 body.e Jun 22, 2004 | x0=548
22 btn.e Edit Profile
33 h2.p Your Activity
47 num.s 24
48 num.s 18
49 num.s 5
54 small.s Readings
53 small.s Dreams
55 small.s Reports
66 h3.l Saved Readings
74 h3.l Favorites
77 h3.l History
83 h3.l My Reports
34 h2.p Account Settings
38 h3.k Email
39 body.v yuliia@example.com
51 h3.k Password
59 h3.k Notifications
@toggle notif 1385 598 60 32 on
62 h3.k Language
@select lang 63 body.v 1330 652 124 40 English;Ukrainian;Spanish
70 h3.k Theme
@select theme 71 body.v 1352 712 100 40 Dark;Light;Auto
81 h3.b Log Out
@hit Back 270 13 55 55 27 back:#/dashboard
@hit Edit_Profile 1219 266 209 54 27 #/settings
@hit Readings 297 473 174 138 18 #/reading
@hit Dreams 486 473 174 138 18 #/dreams
@hit Reports 674 473 174 138 18 #/astrology
@hit Saved_Readings 300 655 560 57 14 #/reading
@hit My_Reports 300 832 560 56 14 #/astrology
@hit Email 898 478 572 50 14 #/settings
@hit Password 898 534 572 50 14 #/settings
@hit Log_Out 898 815 572 62 31 #/login
`,
}
