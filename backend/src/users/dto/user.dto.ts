// import { UserRole } from '@prisma/client';


export interface UserDto {
  id:             string;
  email:          string;
  username?:      string;
  avatarUrl?:     string;
  profileComplete: boolean;
  role:           string;
  name?:          string;
  followedLounges?: string[];
}
