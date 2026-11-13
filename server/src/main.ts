import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configureApp } from './app.setup'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true }) // сире тіло потрібне, щоб перевірити підпис вебхука Stripe
  configureApp(app)
  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  console.log(`API is listening on port ${port} (path /api)`)
}
bootstrap()
