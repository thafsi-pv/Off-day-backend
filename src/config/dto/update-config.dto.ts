import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Shift, WeekRange } from '../../shared/types';

export class ShiftDto implements Shift {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  slots: number;
}

export class UpdateConfigDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  disabledDays?: number[];

  @IsOptional()
  @IsEnum(['1_WEEK', '2_WEEKS', '1_MONTH'])
  weekRange?: WeekRange;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  shifts?: ShiftDto[];
}
