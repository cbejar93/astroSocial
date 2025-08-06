// import { UserRole } from '@prisma/client';


export interface UserDto {
  id:             string;
  email:          string;
  username?:      string;
  avatarUrl?:     string;
  profileComplete: boolean;
  followedLounges: string[];
  // role:           string;
  name?:          string;
}