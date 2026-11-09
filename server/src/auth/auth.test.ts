import 'reflect-metadata'
import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { HttpException } from '@nestjs/common'
import { validate } from 'class-validator'
import { flagOn } from '../common/flags'
import { runWithLocale } from '../i18n/locale'
import { canChoosePlan } from '../plans/plans'
import { RegisterDto } from './auth.dto'
import { AuthThrottle, RateLimiter } from './rate-limit'

const status = (fn: () => void) => {
  try {
    fn()
  } catch (e) {
    return e instanceof HttpException ? e.getStatus() : -1
  }
  return 0
}

test('the limiter blocks after max events and frees the key when the window ends', () => {
  let t = 1000
  const limiter = new RateLimiter(3, 60_000, () => t)
  strictEqual(limiter.record('a'), false)
  strictEqual(limiter.record('a'), false)
  strictEqual(limiter.record('a'), true)
  strictEqual(limiter.blockedFor('a'), 60)
  strictEqual(limiter.blockedFor('b'), 0, 'other keys are not affected')
  t += 30_000
  strictEqual(limiter.blockedFor('a'), 30)
  t += 30_000
  strictEqual(limiter.blockedFor('a'), 0)
  strictEqual(limiter.record('a'), false, 'a new window starts from zero')
})

test('eight failed logins for one address and email lock that pair, not other emails or addresses', () => {
  const throttle = new AuthThrottle()
  for (let i = 0; i < 8; i++) {
    throttle.beforeLogin('1.1.1.1', 'Anna@Example.com')
    throttle.loginFailed('1.1.1.1', 'anna@example.com')
  }
  strictEqual(status(() => throttle.beforeLogin('1.1.1.1', 'anna@example.com')), 429)
  strictEqual(status(() => throttle.beforeLogin('1.1.1.1', 'other@example.com')), 0)
  strictEqual(status(() => throttle.beforeLogin('2.2.2.2', 'anna@example.com')), 0, 'someone else cannot lock the account from another address')
})

test('a successful login clears the failures', () => {
  const throttle = new AuthThrottle()
  for (let i = 0; i < 7; i++) throttle.loginFailed('1.1.1.1', 'a@b.co')
  throttle.loginSucceeded('1.1.1.1', 'a@b.co')
  for (let i = 0; i < 7; i++) throttle.loginFailed('1.1.1.1', 'a@b.co')
  strictEqual(status(() => throttle.beforeLogin('1.1.1.1', 'a@b.co')), 0)
})

test('one address cannot try more than 30 logins or create more than 10 accounts in the window', () => {
  const throttle = new AuthThrottle()
  for (let i = 0; i < 30; i++) throttle.beforeLogin('3.3.3.3', `u${i}@example.com`)
  strictEqual(status(() => throttle.beforeLogin('3.3.3.3', 'next@example.com')), 429)
  for (let i = 0; i < 10; i++) throttle.beforeRegister('4.4.4.4')
  strictEqual(status(() => throttle.beforeRegister('4.4.4.4')), 429)
  strictEqual(status(() => throttle.beforeRegister('5.5.5.5')), 0)
})

test('the lock message is in the language of the request and says how long to wait', () => {
  const throttle = new AuthThrottle()
  for (let i = 0; i < 10; i++) throttle.beforeRegister('6.6.6.6')
  const text = (locale: 'en' | 'uk') =>
    runWithLocale(locale, () => {
      try {
        throttle.beforeRegister('6.6.6.6')
      } catch (e) {
        return JSON.stringify((e as HttpException).getResponse())
      }
      return ''
    })
  ok(text('en').includes('Too many attempts') && text('en').includes('60 min'))
  ok(text('uk').includes('Забагато спроб'))
})

test('a password is limited to 72 bytes: what bcrypt actually reads', async () => {
  const dto = (password: string) => Object.assign(new RegisterDto(), { name: 'A', email: 'a@b.co', password })
  const bad = async (password: string) => (await validate(dto(password))).flatMap((e) => Object.keys(e.constraints ?? {}))
  deepStrictEqual(await bad('a'.repeat(72)), [])
  deepStrictEqual(await bad('a'.repeat(73)), ['maxBytes'])
  deepStrictEqual(await bad('Я'.repeat(36)), [], '36 Cyrillic letters are 72 bytes')
  deepStrictEqual(await bad('Я'.repeat(37)), ['maxBytes'])
  deepStrictEqual(await bad('short'), ['minLength'])
})

test('without payment only the free plan can be chosen, unless the demo switch is on', () => {
  strictEqual(canChoosePlan('free', false), true)
  strictEqual(canChoosePlan('pro', false), false)
  strictEqual(canChoosePlan('premium', false), false)
  strictEqual(canChoosePlan('premium', true), true)
})

test('a switch from .env is on only when it is explicitly true', () => {
  for (const v of ['true', 'TRUE', ' 1 ', 'yes', 'on']) strictEqual(flagOn(v), true, v)
  for (const v of [undefined, '', 'false', '0', 'no', 'off', 'maybe']) strictEqual(flagOn(v), false, String(v))
})
