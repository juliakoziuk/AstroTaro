// Pricing — «Choose your plan». Ціна «$9.99 /mo» ділиться на число (serif) і «/mo» (sans) за x.
export default {
  dsl: `
@sidebar
13 brand.c MYSTIQ
16 h1 Choose your plan
20 sub Unlock the full MYSTIQ experience
26 h2 Free
32 body.s Basic access
37 num.p $0 | x1=565
37 body.m /mo | x0=566
46 body.f Limited readings
55 body.f Basic insights
62 body.f Daily tarot card
69 btn Get Started
24 h2 Pro
33 body.s Most popular
38 num.p $9.99 | x1=916
38 body.m /mo | x0=917
43 body.f Unlimited readings
51 body.f Full astrology
58 body.f Dream analysis
64 body.f AI Companion
71 btn Upgrade
27 h2 Premium
34 body.s For deep explorers
39 num.p $19.99 | x1=1242
39 body.m /mo | x0=1243
47 body.f Everything in Pro
53 body.f Priority access
60 body.f Advanced reports
66 body.f Early features
73 btn Choose
@hit Get_Started 504 735 234 54 27 #/register
@hit Upgrade 803 734 238 56 28 #/dashboard
@hit Choose 1107 735 225 54 27 #/dashboard
`,
}
