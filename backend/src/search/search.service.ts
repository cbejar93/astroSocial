import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string) {
    if (!query || !query.trim()) {
      return { users: [], lounges: [] };
    }

    const [users, lounges] = await Promise.all([
      this.prisma.user.findMany({
        where: { username: { contains: query, mode: 'insensitive' } },
        select: { id: true, username: true, avatarUrl: true },
        take: 20,
      }),
      this.prisma.lounge.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        select: { id: true, name: true, profileUrl: true, bannerUrl: true },
        take: 20,
      }),
    ]);

    return { users, lounges };
  }
}
