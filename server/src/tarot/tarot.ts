import { UsageModule, UsageService } from '../plans/usage'
import { BadRequestException, Body, Controller, Get, Module, Post, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { Spread } from '../spreads/spread.model'
import { User } from '../users/user.model'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { attachNarrative } from './ai'
import { CARD_COUNT, cardOf } from './cards'
import { presentSpread } from './present'
import { chosen, DECKS, draw, Mode, MODES, SPREAD_IDS, spreadsFor } from './readings'

class PickedCardDto {
  @ApiProperty({ minimum: 0, maximum: 77, description: 'Номер карти колоди (0–77)' }) @IsInt() @Min(0) @Max(77) id: number
  @ApiProperty({ description: 'Перевернута карта' }) @IsBoolean() reversed: boolean
}

export class DrawDto {
  @ApiProperty({ enum: SPREAD_IDS, example: 'three' }) @IsIn(SPREAD_IDS) spreadId: string
  @ApiProperty({ enum: DECKS, example: 'Classic Tarot' }) @IsIn(DECKS) deck: string
  @ApiProperty({ enum: MODES, example: 'quick' }) @IsOptional() @IsIn(MODES as unknown as string[]) mode: Mode = 'quick'
  @ApiPropertyOptional({ maxLength: 500 }) @IsOptional() @IsString() @MaxLength(500) question?: string
  @ApiPropertyOptional({ type: [PickedCardDto], description: 'Карти, які людина витягнула сама: по одній різній на кожну позицію. Без цього поля карти обирає сервер.' })
  @IsOptional() @IsArray() @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => PickedCardDto) cards?: PickedCardDto[]
}

@ApiTags('tarot')
@Controller('tarot')
export class TarotController {
  constructor(@InjectModel(Spread) private spreads: typeof Spread, @InjectModel(User) private users: typeof User, private usage: UsageService) {}

  @ApiOperation({ summary: 'Типи розкладів і назви позицій (публічно)' })
  @ApiOkResponse({ description: '[{ id, name, positions[] }]' })
  @Get('spreads')
  listSpreads() {
    return spreadsFor(currentLocale())
  }

  @ApiOperation({ summary: 'Колоди та режими читання (публічно)' })
  @ApiOkResponse({ description: '{ decks[], modes[] }' })
  @Get('decks')
  listDecks() {
    return { decks: DECKS, modes: MODES }
  }

  @ApiOperation({ summary: 'Усі 78 карт мовою запиту (публічно)' })
  @ApiOkResponse({ description: '[{ id, name }] у порядку колоди; потрібно, щоб людина могла ввести карти зі своєї колоди' })
  @Get('cards')
  listCards() {
    return Array.from({ length: CARD_COUNT }, (_, id) => ({ id, name: cardOf(id, currentLocale()).name }))
  }

  @ApiOperation({
    summary: 'Створити розклад і отримати тлумачення',
    description: 'Якщо передано cards — це карти, які людина витягнула сама (по одній різній на позицію); інакше сервер тасує колоду й обирає їх сам. Розклад зберігається в історії (saved: false).',
  })
  @ApiCreatedResponse({ type: Spread })
  @ApiAuthed()
  @UseGuards(JwtAuthGuard)
  @Post('readings')
  async create(@CurrentUser() u: { id: string }, @Body() dto: DrawDto) {
    let cards
    try {
      cards = dto.cards ? chosen(dto.spreadId, dto.cards) : draw(dto.spreadId)
    } catch {
      throw new BadRequestException(msg(currentLocale(), 'badCards'))
    }
    const user = await this.users.findByPk(u.id)
    await this.usage.accept(u.id, 'reading', dto.mode ?? 'quick')
    const persist = user.settings?.autosave !== false
    const values = {
      userId: u.id,
      spreadId: dto.spreadId,
      deck: dto.deck,
      mode: dto.mode,
      question: dto.question ?? '',
      cards,
    }
    const row = persist ? await this.spreads.create(values as any) : this.spreads.build(values as any)
    await attachNarrative(row, currentLocale(), process.env, fetch, persist)
    return { ...presentSpread(row, currentLocale()), temporary: !persist }
  }
}

@Module({ imports: [UsageModule, SequelizeModule.forFeature([Spread, User])], controllers: [TarotController] })
export class TarotModule {}
