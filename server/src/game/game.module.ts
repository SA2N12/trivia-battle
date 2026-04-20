import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { RoomsModule } from '../rooms/rooms.module';
import { QuestionsModule } from '../questions/questions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RoomsModule, QuestionsModule, AuthModule],
  providers: [GameGateway, GameService],
  exports: [GameService],
})
export class GameModule {}
