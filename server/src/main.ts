import 'reflect-metadata'
import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { NextFunction, Request, Response } from 'express'
import { AppModule } from './app.module'
import { currentLocale, parseLocale, runWithLocale } from './i18n/locale'
import { validationMessage } from './i18n/messages'

/** Помилки class-validator мовою запиту: ключ обмеження → фраза, число (довжина тощо) беремо з англійського тексту. */
function localizedErrors(errors: ValidationError[], locale = currentLocale()): string[] {
  return errors.flatMap((e) => [
    ...Object.entries(e.constraints ?? {}).map(([key, text]) => validationMessage(locale, key, e.property, text.match(/\d+/g) ?? [])),
    ...localizedErrors(e.children ?? [], locale),
  ])
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  // мова запиту (заголовок Accept-Language) доступна всьому коду запиту через currentLocale()
  app.use((req: Request, _res: Response, next: NextFunction) => runWithLocale(parseLocale(req.headers['accept-language']), next))
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(localizedErrors(errors)),
    }),
  )
  app.enableCors({ origin: (process.env.CORS_ORIGIN ?? '').split(',').filter(Boolean) })
  const docs = new DocumentBuilder()
    .setTitle('AstroTarot API')
    .setDescription('Таро, сни, щоденник і AI-компаньйон. Захищені ендпоїнти потребують Bearer-токена з /auth/login. Мова відповідей — заголовок Accept-Language (en, uk, es).')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, docs))
  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  console.log(`MYSTIQ API: http://localhost:${port}/api`)
}
bootstrap()
