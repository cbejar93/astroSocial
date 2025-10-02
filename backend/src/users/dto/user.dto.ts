// import { UserRole } from '@prisma/client';

export interface UserDto {
  id: string;
  username?: string;
  avatarUrl?: string;
  profileComplete: boolean;
  role: string;
  temperature: 'C' | 'F';
  name?: string;
  followedLounges?: string[];
  followers?: string[];
  following?: string[];
}
