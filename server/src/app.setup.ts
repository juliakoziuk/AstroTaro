import { BadRequestException, INestApplication, ValidationError, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { NextFunction, Request, Response } from 'express'
import { currentLocale, parseLocale, runWithLocale } from './i18n/locale'
import { validationMessage } from './i18n/messages'

/** Помилки class-validator мовою запиту: ключ обмеження → фраза, число (довжина тощо) беремо з англійського тексту. */
function localizedErrors(errors: ValidationError[], locale = currentLocale()): string[] {
  return errors.flatMap((e) => [
    ...Object.entries(e.constraints ?? {}).map(([key, text]) => validationMessage(locale, key, e.property, text.match(/\d+/g) ?? [])),
    ...localizedErrors(e.children ?? [], locale),
  ])
}

/** Усе, що відрізняє працюючий сервер від голого AppModule: префікс, заголовки, мова, валідація, CORS, Swagger. Спільне для main.ts і наскрізних тестів. */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api')
  // Заголовки безпеки (nosniff, HSTS, без X-Powered-By тощо). CSP вимкнена: API віддає JSON, а її типові правила ламають Swagger UI.
  // Клієнт живе на іншому origin, тож ресурси API мають бути доступними з нього.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }))
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
  app.enableCors({ origin: (process.env.CORS_ORIGIN ?? '').split(',').filter(Boolean), exposedHeaders: ['X-Total-Count'] })
  const docs = new DocumentBuilder()
    .setTitle('AstroTarot API')
    .setDescription('Таро, сни, щоденник і AI-компаньйон. Захищені ендпоїнти потребують Bearer-токена з /auth/login. Мова відповідей — заголовок Accept-Language (en, uk).')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, docs))
}
