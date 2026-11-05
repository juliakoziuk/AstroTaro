import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator'
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger'
import { ApiAuthed, ApiOwnedNotFound } from '../common/api-docs'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OwnedService } from '../common/owned.service'
import { JournalEntry } from './journal.model'

class LinkDto {
  @ApiProperty({ enum: ['dream', 'spread'] }) @IsIn(['dream', 'spread']) type: 'dream' | 'spread'
  @ApiProperty({ description: 'id сну або розкладу' }) @IsString() @MaxLength(64) id: string
}

export class CreateEntryDto {
  @ApiPropertyOptional({ format: 'date-time', description: 'За замовчуванням — зараз' }) @IsOptional() @IsDateString() date?: string
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) mood: number
  @ApiProperty({ maxLength: 10000 }) @IsString() @MinLength(1) @MaxLength(10000) text: string
  @ApiPropertyOptional({ type: [LinkDto], maxItems: 20 }) @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => LinkDto) links?: LinkDto[]
}

export class UpdateEntryDto {
  @ApiPropertyOptional({ format: 'date-time', description: 'За замовчуванням — зараз' }) @IsOptional() @IsDateString() date?: string
  @ApiPropertyOptional({ minimum: 1, maximum: 5 }) @IsOptional() @IsInt() @Min(1) @Max(5) mood?: number
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(10000) text?: string
  @ApiPropertyOptional({ type: [LinkDto], maxItems: 20 }) @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => LinkDto) links?: LinkDto[]
}

@Injectable()
export class JournalService extends OwnedService<JournalEntry> {
  constructor(@InjectModel(JournalEntry) model: typeof JournalEntry) {
    super(model)
  }
}

@ApiTags('journal')
@ApiAuthed()
@UseGuards(JwtAuthGuard)
@Controller('journal')
export class JournalController {
  constructor(private s: JournalService) {}

  @ApiOperation({ summary: 'Список записів користувача' }) @ApiOkResponse({ type: [JournalEntry] })
  @Get() list(@CurrentUser() u) { return this.s.list(u.id) }
  @ApiOperation({ summary: 'Створити запис' }) @ApiCreatedResponse({ type: JournalEntry })
  @Post() create(@CurrentUser() u, @Body() dto: CreateEntryDto) { return this.s.create(u.id, { ...dto }) }
  @ApiOperation({ summary: 'Один запис за id' }) @ApiOkResponse({ type: JournalEntry }) @ApiOwnedNotFound()
  @Get(':id') get(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) { return this.s.get(u.id, id) }
  @ApiOperation({ summary: 'Змінити запис (лише передані поля)' }) @ApiOkResponse({ type: JournalEntry }) @ApiOwnedNotFound()
  @Patch(':id') update(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEntryDto) { return this.s.update(u.id, id, { ...dto }) }
  @ApiOperation({ summary: 'Видалити запис' }) @ApiNoContentResponse({ description: 'Видалено' }) @ApiOwnedNotFound()
  @Delete(':id') @HttpCode(204) remove(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) { return this.s.remove(u.id, id) }
}

@Module({
  imports: [SequelizeModule.forFeature([JournalEntry])],
  controllers: [JournalController],
  providers: [JournalService],
})
export class JournalModule {}
