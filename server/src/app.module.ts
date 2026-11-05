import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'
import { AstrologyModule, Report } from './astrology/astrology'
import { AuthModule } from './auth/auth.module'
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
        // Поки що схема створюється з моделей; перед продакшеном замінити на міграції.
        autoLoadModels: true,
        synchronize: true,
        // alter: додає нові колонки до вже створених таблиць
        sync: { alter: true },
        logging: false,
      }),
    }),
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
    CosmosModule,
  ],
})
export class AppModule {}
