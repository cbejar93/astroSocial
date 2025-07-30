import { Injectable, BadRequestException, NotFoundException, Inject, InternalServerErrorException,  Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from './dto/user.dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class UsersService {
  constructor( @Inject('SUPABASE_CLIENT') private supabase: SupabaseClient,private readonly storage: StorageService,private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(UsersService.name);
  /**
   * Fetch a user by their ID.
   */
  async findById(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        profileComplete: true,     // ← add this
      },
    });
  
    if (!user) throw new NotFoundException('User not found');
    return this.toDto(user);
  }

   clean = (s: string) => s.replace(/\u0000/g, '');


  /**
   * Update the current user's profile.
   * Marks profileComplete = true once username is set.
   */
  async updateProfile(
    userId: string,
    username: string,
    avatarUrl?: string,
  ): Promise<UserDto> {
    if (!username.trim()) {
      throw new BadRequestException('Username is required');
    }

    

    const data: Record<string, any> = {
      username,
      profileComplete: true,
    };
    if (avatarUrl) {
      data.avatarUrl = avatarUrl;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.toDto(user);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    // const filePath = `${userId}/${file.originalname}`;
  
    // // 1) Upload
    // const { data: uploadData, error: uploadError } = await this.supabase
    //   .storage
    //   .from('avatars')
    //   .upload(filePath, file.buffer, {
    //     cacheControl: '3600',
    //     upsert: true,
    //     contentType: file.mimetype,
    //   });

      const publicUrl = await this.storage.uploadFile(
        'avatars',
        `${userId}/${file.originalname}`,
        file,
      )
  
    // if (uploadError || !uploadData) {
    //   this.logger.error(`Supabase upload error: ${uploadError?.message}`);
    //   throw new InternalServerErrorException('Failed to upload avatar');
    // }
  
    // 2) Get the public URL (no error to check here)
    // const { data: urlData } = this.supabase
    //   .storage
    //   .from('avatars')
    //   .getPublicUrl(uploadData.path);
  
    // const publicUrl = urlData.publicUrl;
  
    // 3) Save to your database
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrl, profileComplete: true },
    });
  
    return publicUrl;
  }

  async getPostsByUser(userId: string) {
    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { comments: true } } },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, avatarUrl: true },
    });

    return posts.map(p => ({
      id: p.id,
      authorId: userId,
      username: user?.username || '',
      avatarUrl: user?.avatarUrl || '',
      imageUrl: p.imageUrl ?? '',
      caption: p.body,
      timestamp: p.createdAt.toISOString(),
      stars: p.likes,
      comments: p._count.comments,
      shares: p.shares,
      likedByMe: false,
    }));
  }

  async getCommentsByUser(userId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { likedBy: { where: { userId }, select: { id: true } } },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, avatarUrl: true },
    });

    return comments.map(c => ({
      id: c.id,
      text: c.text,
      authorId: userId,
      username: user?.username || '',
      avatarUrl: user?.avatarUrl || '',
      timestamp: c.createdAt.toISOString(),
      likes: c.likes,
      likedByMe: c.likedBy.length > 0,
    }));
  }

  async deleteUser(userId: string) {
    await this.prisma.$transaction([
      this.prisma.commentLike.deleteMany({ where: { OR: [{ userId }, { comment: { authorId: userId } }] } }),
      this.prisma.postInteraction.deleteMany({ where: { OR: [{ userId }, { post: { authorId: userId } }] } }),
      this.prisma.notification.deleteMany({ where: { OR: [{ userId }, { actorId: userId }] } }),
      this.prisma.comment.deleteMany({ where: { authorId: userId } }),
      this.prisma.post.deleteMany({ where: { authorId: userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
  }
  

  private toDto(user: {
    id: string;
    email: string;
    username?: string | null;
    avatarUrl?: string | null;
    profileComplete: boolean;
  }): UserDto {
    return {
      id:              user.id,
      email:           user.email,
      username:        user.username ?? undefined,
      avatarUrl:       user.avatarUrl ?? undefined,
      profileComplete: user.profileComplete,
    };
  }
}
