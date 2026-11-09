import { Global, Injectable, Logger, Module } from '@nestjs/common'
import { createTransport, Transporter } from 'nodemailer'

export interface Mail {
  to: string
  subject: string
  text: string
}

/**
 * Відправка листів. Із SMTP_URL (наприклад smtps://user:pass@smtp.example.com) шле справжні; без нього лист лише друкується
 * в консолі сервера разом з посиланням — для розробки цього досить. MAIL_FROM — адреса відправника.
 * У тестах (NODE_ENV=test) листи складаються в outbox, щоб тест міг дістати посилання.
 */
@Injectable()
export class MailService {
  private log = new Logger('Mail')
  private transport: Transporter | null = process.env.SMTP_URL ? createTransport(process.env.SMTP_URL) : null
  readonly outbox: Mail[] = []

  async send(mail: Mail) {
    if (process.env.NODE_ENV === 'test') {
      this.outbox.push(mail)
      return
    }
    if (!this.transport) {
      this.log.log(`SMTP_URL is not set, the email is not sent. To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}`)
      return
    }
    await this.transport.sendMail({ from: process.env.MAIL_FROM ?? 'MYSTIQ <no-reply@localhost>', ...mail })
  }
}

@Global()
@Module({ providers: [MailService], exports: [MailService] })
export class MailModule {}
