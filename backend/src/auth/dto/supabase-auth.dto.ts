import { IsString } from 'class-validator';

export class SupabaseAuthDto {
  @IsString()
  accessToken!: string;
}
