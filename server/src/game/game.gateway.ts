import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { RoomsService } from '../rooms/rooms.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  roomCode?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('GameGateway');

  // Track timers per game
  private questionTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private gameService: GameService,
    private roomsService: RoomsService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.username = payload.username;
      this.logger.log(`Client connected: ${client.username} (${client.id})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.roomCode) {
      this.server.to(client.roomCode).emit('playerLeft', {
        userId: client.userId,
        username: client.username,
      });
    }
    this.logger.log(`Client disconnected: ${client.username ?? client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { code: string },
  ) {
    const code = data.code.toUpperCase();
    try {
      const room = await this.roomsService.findByCode(code);
      client.join(code);
      client.roomCode = code;

      this.server.to(code).emit('playerJoined', {
        userId: client.userId,
        username: client.username,
        players: room.players.map((p) => ({
          userId: p.user.id,
          username: p.user.username,
        })),
      });

      client.emit('roomState', {
        room: {
          id: room.id,
          code: room.code,
          hostId: room.hostId,
          status: room.status,
        },
        players: room.players.map((p) => ({
          userId: p.user.id,
          username: p.user.username,
        })),
      });
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('startGame')
  async handleStartGame(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const room = await this.roomsService.findById(data.roomId);
      if (!room || room.hostId !== client.userId) {
        client.emit('error', { message: 'Only the host can start the game' });
        return;
      }

      const game = await this.gameService.startGame(data.roomId);

      this.server.to(client.roomCode!).emit('gameStarted', {
        gameId: game.id,
      });

      // Send first question after a short delay
      setTimeout(() => this.sendQuestion(client.roomCode!, game.id), 3000);
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { gameId: string; questionId: string; answer: number | null; timeMs: number },
  ) {
    try {
      const result = await this.gameService.submitAnswer(
        data.gameId,
        client.userId!,
        data.questionId,
        data.answer,
        data.timeMs,
      );

      // Send result back to the player
      client.emit('answerResult', {
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        points: result.points,
      });

      // Broadcast live scores to everyone in the room
      const liveScores = await this.gameService.getLiveScores(data.gameId);
      this.server.to(client.roomCode!).emit('liveScores', liveScores);
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }

  private async sendQuestion(roomCode: string, gameId: string) {
    const questionData = await this.gameService.getCurrentQuestion(gameId);

    if (!questionData) {
      // No more questions, finish game
      const result = await this.gameService.finishGame(gameId);
      const scores = await this.gameService.getGameScores(gameId);
      this.server.to(roomCode).emit('gameFinished', { scores });
      return;
    }

    this.server.to(roomCode).emit('newQuestion', {
      ...questionData,
      timeLimit: 10000,
    });

    // Start countdown — auto-advance after 10s + 3s for results
    const timer = setTimeout(async () => {
      // Send correct answer reveal
      const question = await this.gameService.getCurrentQuestion(gameId);
      if (question) {
        const liveScores = await this.gameService.getLiveScores(gameId);
        this.server.to(roomCode).emit('questionTimeout', { liveScores });
      }

      // Wait 3s then advance
      setTimeout(async () => {
        const result = await this.gameService.advanceQuestion(gameId);
        if (result.finished) {
          const scores = await this.gameService.getGameScores(gameId);
          this.server.to(roomCode).emit('gameFinished', { scores });
        } else {
          this.sendQuestion(roomCode, gameId);
        }
      }, 3000);
    }, 10000);

    this.questionTimers.set(gameId, timer);
  }
}
