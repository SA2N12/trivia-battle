import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionsService } from '../questions/questions.service';

const QUESTIONS_PER_GAME = 10;
const POINTS_BASE = 1000;
const TIME_LIMIT_MS = 10000;

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private questionsService: QuestionsService,
  ) {}

  async startGame(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { players: true },
    });

    if (!room) throw new Error('Room not found');
    if (room.status !== 'WAITING') throw new Error('Game already started');

    // Get random questions
    const questions = await this.questionsService.getRandomQuestions(
      QUESTIONS_PER_GAME,
      room.category ?? undefined,
    );

    if (questions.length < QUESTIONS_PER_GAME) {
      throw new Error(`Not enough questions. Found ${questions.length}, need ${QUESTIONS_PER_GAME}`);
    }

    // Create game and link questions
    const game = await this.prisma.game.create({
      data: {
        roomId,
        status: 'IN_PROGRESS',
        gameQuestions: {
          create: questions.map((q, i) => ({
            questionId: q.id,
            order: i,
          })),
        },
      },
      include: {
        gameQuestions: {
          include: { question: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    // Update room status
    await this.prisma.room.update({
      where: { id: roomId },
      data: { status: 'IN_GAME' },
    });

    return game;
  }

  async getCurrentQuestion(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        gameQuestions: {
          include: { question: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!game) return null;

    const gq = game.gameQuestions[game.currentQuestionIndex];
    if (!gq) return null;

    return {
      gameId: game.id,
      questionIndex: game.currentQuestionIndex,
      totalQuestions: game.gameQuestions.length,
      question: {
        id: gq.question.id,
        text: gq.question.text,
        options: gq.question.options,
        category: gq.question.category,
        difficulty: gq.question.difficulty,
      },
    };
  }

  async submitAnswer(
    gameId: string,
    userId: string,
    questionId: string,
    answer: number | null,
    timeMs: number,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new Error('Question not found');

    const isCorrect = answer === question.correctAnswer;

    // Points: faster = more points. Max 1000, min 100 if correct
    let points = 0;
    if (isCorrect && answer !== null) {
      const timeFactor = Math.max(0, 1 - timeMs / TIME_LIMIT_MS);
      points = Math.round(POINTS_BASE * (0.1 + 0.9 * timeFactor));
    }

    const playerAnswer = await this.prisma.playerAnswer.upsert({
      where: {
        gameId_userId_questionId: { gameId, userId, questionId },
      },
      create: {
        gameId,
        userId,
        questionId,
        answer,
        isCorrect,
        timeMs: Math.min(timeMs, TIME_LIMIT_MS),
        points,
      },
      update: {},
    });

    return { ...playerAnswer, correctAnswer: question.correctAnswer };
  }

  async advanceQuestion(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { gameQuestions: true },
    });
    if (!game) throw new Error('Game not found');

    const nextIndex = game.currentQuestionIndex + 1;

    if (nextIndex >= game.gameQuestions.length) {
      // Game over
      return this.finishGame(gameId);
    }

    await this.prisma.game.update({
      where: { id: gameId },
      data: { currentQuestionIndex: nextIndex },
    });

    return { finished: false, nextIndex };
  }

  async finishGame(gameId: string) {
    // Calculate final scores
    const answers = await this.prisma.playerAnswer.groupBy({
      by: ['userId'],
      where: { gameId },
      _sum: { points: true },
      _count: { id: true },
    });

    const correctCounts = await this.prisma.playerAnswer.groupBy({
      by: ['userId'],
      where: { gameId, isCorrect: true },
      _count: { id: true },
    });

    const correctMap = new Map(correctCounts.map((c) => [c.userId, c._count.id]));

    // Sort by points desc
    const sorted = answers.sort(
      (a, b) => (b._sum.points ?? 0) - (a._sum.points ?? 0),
    );

    // Create score records
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      await this.prisma.score.upsert({
        where: { gameId_userId: { gameId, userId: entry.userId } },
        create: {
          gameId,
          userId: entry.userId,
          totalPoints: entry._sum.points ?? 0,
          correctAnswers: correctMap.get(entry.userId) ?? 0,
          rank: i + 1,
        },
        update: {
          totalPoints: entry._sum.points ?? 0,
          correctAnswers: correctMap.get(entry.userId) ?? 0,
          rank: i + 1,
        },
      });

      // Update user stats
      await this.prisma.user.update({
        where: { id: entry.userId },
        data: {
          totalScore: { increment: entry._sum.points ?? 0 },
          gamesPlayed: { increment: 1 },
          ...(i === 0 ? { gamesWon: { increment: 1 } } : {}),
        },
      });
    }

    // Mark game finished
    await this.prisma.game.update({
      where: { id: gameId },
      data: { status: 'FINISHED', finishedAt: new Date() },
    });

    await this.prisma.room.update({
      where: { id: (await this.prisma.game.findUnique({ where: { id: gameId } }))!.roomId },
      data: { status: 'FINISHED' },
    });

    return { finished: true, scores: sorted };
  }

  async getGameScores(gameId: string) {
    return this.prisma.score.findMany({
      where: { gameId },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { rank: 'asc' },
    });
  }

  async getLiveScores(gameId: string) {
    const answers = await this.prisma.playerAnswer.groupBy({
      by: ['userId'],
      where: { gameId },
      _sum: { points: true },
    });

    const userIds = answers.map((a) => a.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.username]));

    return answers
      .map((a) => ({
        userId: a.userId,
        username: userMap.get(a.userId) ?? 'Unknown',
        points: a._sum.points ?? 0,
      }))
      .sort((a, b) => b.points - a.points);
  }
}
