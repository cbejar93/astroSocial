import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLoungeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
