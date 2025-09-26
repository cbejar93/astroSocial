import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from './dto/user.dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersService {
  private static readonly USERNAME_PATTERN = /^[a-z0-9._]+$/i;
  private static readonly USERNAME_MIN_LENGTH = 3;
  private static readonly USERNAME_MAX_LENGTH = 20;

  constructor(
    @Inject('SUPABASE_CLIENT') private supabase: SupabaseClient,
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(UsersService.name);
  /**
   * Fetch a user by their ID.
   */
  async findById(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        profileComplete: true, // ← add this
        role: true,
        followedLounges: { select: { id: true } },
        followers: { select: { id: true } },
        following: { select: { id: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return this.toDto(user);
  }
  /**
   * Update the current user's profile.
   * Marks profileComplete = true once username is set.
   */
  async updateProfile(
    userId: string,
    username: string,
    avatarUrl?: string,
  ): Promise<UserDto> {
    const trimmed = username.trim();

    if (!trimmed) {
      throw new BadRequestException('Username is required');
    }

    if (
      trimmed.length < UsersService.USERNAME_MIN_LENGTH ||
      trimmed.length > UsersService.USERNAME_MAX_LENGTH
    ) {
      throw new BadRequestException(
        `Username must be between ${UsersService.USERNAME_MIN_LENGTH} and ${UsersService.USERNAME_MAX_LENGTH} characters long`,
      );
    }

    if (!UsersService.USERNAME_PATTERN.test(trimmed)) {
      throw new BadRequestException(
        'Username may only contain letters, numbers, periods, and underscores',
      );
    }

    const data: Record<string, any> = {
      username: trimmed,
      profileComplete: true,
    };
    if (avatarUrl) {
      data.avatarUrl = avatarUrl;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        followedLounges: { select: { id: true } },
        followers: { select: { id: true } },
        following: { select: { id: true } },
      },
    });
    return this.toDto(user);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const existingAvatarPath = this.getAvatarStoragePath(currentUser.avatarUrl);

    if (existingAvatarPath) {
      try {
        await this.storage.deleteFile('avatars', existingAvatarPath);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);
        this.logger.error(
          `Failed to delete existing avatar for user ${userId}`,
          message,
        );
        throw error;
      }
    }

    const uploadPath = `${userId}/${file.originalname}`;
    const publicUrl = await this.storage.uploadFile(
      'avatars',
      uploadPath,
      file,
    );

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
      include: {
        _count: { select: { comments: true } },
        lounge: { select: { name: true } },
        originalAuthor: { select: { username: true, avatarUrl: true } },
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, avatarUrl: true },
    });

    return posts.map((p) => ({
      id: p.id,
      authorId: userId,
      username: p.originalAuthor?.username || user?.username || '',
      avatarUrl: p.originalAuthor?.avatarUrl || user?.avatarUrl || '',
      ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}),
      caption: p.body,
      title: p.title,
      loungeId: p.loungeId || undefined,
      loungeName: p.lounge?.name,
      timestamp: p.createdAt.toISOString(),
      stars: p.likes,
      comments: p._count.comments,
      shares: p.shares,
      likedByMe: false,
      ...(p.originalAuthorId && p.originalAuthorId !== p.authorId
        ? { repostedBy: user?.username || '' }
        : {}),
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

    return comments.map((c) => ({
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

  async findByUsername(username: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        profileComplete: true,
        role: true,
        followedLounges: { select: { id: true } },
        followers: { select: { id: true } },
        following: { select: { id: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.toDto(user);
  }

  async getPostsByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, avatarUrl: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const posts = await this.prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { comments: true } },
        lounge: { select: { name: true } },
        originalAuthor: { select: { username: true, avatarUrl: true } },
      },
    });

    return posts.map((p) => ({
      id: p.id,
      authorId: user.id,
      username: p.originalAuthor?.username || user.username || '',
      avatarUrl: p.originalAuthor?.avatarUrl || user.avatarUrl || '',
      ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}),
      caption: p.body,
      title: p.title,
      loungeId: p.loungeId || undefined,
      loungeName: p.lounge?.name,
      timestamp: p.createdAt.toISOString(),
      stars: p.likes,
      comments: p._count.comments,
      shares: p.shares,
      likedByMe: false,
      ...(p.originalAuthorId && p.originalAuthorId !== p.authorId
        ? { repostedBy: user.username || '' }
        : {}),
    }));
  }

  async getCommentsByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, avatarUrl: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const comments = await this.prisma.comment.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return comments.map((c) => ({
      id: c.id,
      text: c.text,
      authorId: user.id,
      username: user.username || '',
      avatarUrl: user.avatarUrl || '',
      timestamp: c.createdAt.toISOString(),
      likes: c.likes,
      likedByMe: false,
    }));
  }

  async followUser(targetUserId: string, followerId: string) {
    this.logger.log(`User ${followerId} following user ${targetUserId}`);
    return this.prisma.user.update({
      where: { id: followerId },
      data: {
        following: {
          connect: { id: targetUserId },
        },
      },
    });
  }

  async unfollowUser(targetUserId: string, followerId: string) {
    this.logger.log(`User ${followerId} unfollowing user ${targetUserId}`);
    return this.prisma.user.update({
      where: { id: followerId },
      data: {
        following: {
          disconnect: { id: targetUserId },
        },
      },
    });
  }

  async searchUsers(
    query: string,
    page = 1,
    limit = 20,
  ): Promise<{
    results: {
      id: string;
      username: string | null;
      avatarUrl: string | null;
    }[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { username: { contains: query, mode: 'insensitive' } },
        select: { id: true, username: true, avatarUrl: true },
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: { username: { contains: query, mode: 'insensitive' } },
      }),
    ]);

    return {
      results: items.map((u) => ({
        id: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
      })),
      total,
      page,
      limit,
    };
  }

  async getFollowers(userId: string): Promise<UserDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        followers: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            profileComplete: true,
            role: true,
            followedLounges: { select: { id: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user.followers.map((u) => this.toDto(u));
  }

  async getFollowing(userId: string): Promise<UserDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            profileComplete: true,
            role: true,
            followedLounges: { select: { id: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user.following.map((u) => this.toDto(u));
  }

  async deleteUser(userId: string) {
    await this.prisma.$transaction([
      this.prisma.commentLike.deleteMany({
        where: { OR: [{ userId }, { comment: { authorId: userId } }] },
      }),
      this.prisma.postInteraction.deleteMany({
        where: { OR: [{ userId }, { post: { authorId: userId } }] },
      }),
      this.prisma.notification.deleteMany({
        where: { OR: [{ userId }, { actorId: userId }] },
      }),
      this.prisma.comment.deleteMany({ where: { authorId: userId } }),
      this.prisma.post.deleteMany({ where: { authorId: userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
  }

  private toDto(user: {
    id: string;
    username?: string | null;
    avatarUrl?: string | null;
    profileComplete: boolean;
    role: string;
    followedLounges?: { id: string }[];
    followers?: { id: string }[];
    following?: { id: string }[];
  }): UserDto {
    return {
      id: user.id,
      username: user.username ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      profileComplete: user.profileComplete,
      role: user.role,
      followedLounges: user.followedLounges?.map((l) => l.id),
      followers: user.followers?.map((u) => u.id),
      following: user.following?.map((u) => u.id),
    };
  }

  private getAvatarStoragePath(avatarUrl?: string | null): string | null {
    if (!avatarUrl) return null;

    try {
      const parsedUrl = new URL(avatarUrl);
      const decodedPath = decodeURIComponent(parsedUrl.pathname);
      const match = decodedPath.match(/\/avatars\/(.+)$/);
      if (match?.[1]) {
        return match[1];
      }
    } catch {
      // Ignore parsing errors and fall through to the string checks below.
    }

    const stringMatch = avatarUrl.match(/(?:^|\/)avatars\/(.+)$/);
    if (stringMatch?.[1]) {
      return stringMatch[1];
    }

    if (!avatarUrl.includes('://')) {
      return avatarUrl.replace(/^avatars\//, '').replace(/^\/+/, '') || null;
    }

    return null;
  }
}
