import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getGlobalLeaderboard(limit = 20) {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        totalScore: true,
        gamesPlayed: true,
        gamesWon: true,
      },
      orderBy: { totalScore: 'desc' },
      take: Math.min(limit, 100),
    });
  }
}
