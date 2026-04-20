import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get()
  getLeaderboard(@Query('limit') limit?: string) {
    return this.leaderboardService.getGlobalLeaderboard(
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
