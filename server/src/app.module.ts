import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'
import { AstrologyModule, Report } from './astrology/astrology'
import { AuthModule } from './auth/auth.module'
import { BillingModule } from './billing/billing'
import { MailModule } from './mail/mail'
import { flagOn } from './common/flags'
import { CompanionModule } from './companion/companion'
import { CosmosModule } from './cosmos/cosmos'
import { DashboardModule } from './dashboard/dashboard.module'
import { PlansModule } from './plans/plans'
import { ProfileModule } from './profile/profile'
import { TarotModule } from './tarot/tarot'
import { DreamsModule } from './dreams/dreams'
import { JournalModule } from './journal/journal'
import { MessagesModule } from './messages/messages'
import { SpreadsModule } from './spreads/spreads'
import { Dream } from './dreams/dream.model'
import { JournalEntry } from './journal/journal.model'
import { Message } from './messages/message.model'
import { Spread } from './spreads/spread.model'
import { User } from './users/user.model'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        dialect: 'postgres',
        host: cfg.get('DB_HOST', 'localhost'),
        port: Number(cfg.get('DB_PORT', 5432)),
        username: cfg.get('DB_USER'),
        password: cfg.get('DB_PASS'),
        database: cfg.get('DB_NAME'),
        models: [User, Dream, JournalEntry, Spread, Message, Report],
        // Схема в продакшені змінюється лише міграціями (npm run migrate). Автосинхронізація з моделей, що додає
        // колонки й змінює таблиці, вмикається явно для локальної розробки: DB_SYNC=true у .env.
        autoLoadModels: true, // реєструє моделі з forFeature; саму схему це не змінює
        synchronize: flagOn(cfg.get('DB_SYNC')),
        sync: { alter: true },
        logging: false,
      }),
    }),
    MailModule,
    AuthModule,
    DreamsModule,
    JournalModule,
    SpreadsModule,
    MessagesModule,
    TarotModule,
    AstrologyModule,
    CompanionModule,
    DashboardModule,
    ProfileModule,
    PlansModule,
    BillingModule,
    CosmosModule,
  ],
})
export class AppModule {}
