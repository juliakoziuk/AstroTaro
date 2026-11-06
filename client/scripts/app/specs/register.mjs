// Register — «Create your account». Номери — рядки з scripts/app/detections/register.json.
// Рядки «I agree to the Terms of Service» / «and Privacy Policy» різнобарвні: ділимо за x на дві частини з одного виявленого рядка.
export default {
  dsl: `
@sidebar
13 brand.c MYSTIQ
19 h1 Create your account
22 sub Join MYSTIQ and start your journey
@input fullname 29 body text 651 353 544 59 Full name
@input email 35 body email 651 423 544 60 Email address
@input password 42 body password 651 494 544 60 Password
@input confirm 49 body password 651 565 544 60 Confirm password
@check terms 674 650 28 off
55 body.t I agree to the | x1=868
55 body.t Terms of Service | x0=872
58 body.t and | x1=773
58 body.t Privacy Policy | x0=776
64 btn Create Account
65 body.f Already have an account?
66 body.f Sign In | w=600 href=#/login
@hit Create_Account 653 740 545 64 32 #/dashboard
@reveal password 1128 508 52 34
@reveal confirm 1128 580 52 34
`,
}
