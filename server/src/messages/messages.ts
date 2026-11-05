import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, Post, Query, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator'
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ApiAuthed, ApiOwnedNotFound } from '../common/api-docs'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OwnedService } from '../common/owned.service'
import { Message } from './message.model'

export class CreateMessageDto {
  @ApiProperty({ enum: ['user', 'ai'] }) @IsIn(['user', 'ai']) role: 'user' | 'ai'
  @ApiProperty({ maxLength: 4000 }) @IsString() @MinLength(1) @MaxLength(4000) text: string
}

// Історія розмови з AI-супутником. Відповіді AI поки формує фронт і зберігає сюди як role: 'ai'.
@Injectable()
export class MessagesService extends OwnedService<Message> {
  constructor(@InjectModel(Message) private msgs: typeof Message) {
    super(msgs, [['createdAt', 'ASC']])
  }

  clear(userId: string) {
    return this.msgs.destroy({ where: { userId } })
  }
}

@ApiTags('messages')
@ApiAuthed()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private s: MessagesService) {}

  @ApiOperation({ summary: 'Уся історія розмови (від старих до нових)' }) @ApiOkResponse({ type: [Message] })
  @ApiQuery({ name: 'persona', required: false, description: 'Лише розмова з цією персоною' })
  @Get() list(@CurrentUser() u, @Query('persona') persona?: string) { return this.s.list(u.id, persona ? { persona } : {}) }
  @ApiOperation({ summary: 'Додати повідомлення', description: 'Відповіді AI поки формує фронт і зберігає сюди з role: ai.' }) @ApiCreatedResponse({ type: Message })
  @Post() create(@CurrentUser() u, @Body() dto: CreateMessageDto) { return this.s.create(u.id, { ...dto }) }
  @ApiOperation({ summary: 'Очистити всю історію' }) @ApiNoContentResponse({ description: 'Історію видалено' })
  @Delete() @HttpCode(204) async clear(@CurrentUser() u) { await this.s.clear(u.id) }
}

@Module({
  imports: [SequelizeModule.forFeature([Message])],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
