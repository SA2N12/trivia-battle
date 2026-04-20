import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}
