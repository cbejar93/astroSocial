// import { UserRole } from '@prisma/client';

export interface UserDto {
  id: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  profileComplete: boolean;
  role: string;
  temperature: 'C' | 'F';
  accent?: 'BRAND' | 'OCEAN' | 'MINT';
  name?: string;
  followedLounges?: string[];
  followers?: string[];
  following?: string[];
}
