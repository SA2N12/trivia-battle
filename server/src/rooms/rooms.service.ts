import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import * as crypto from 'crypto';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(hostId: string, dto: CreateRoomDto) {
    const code = generateRoomCode();

    const room = await this.prisma.room.create({
      data: {
        code,
        hostId,
        isPrivate: dto.isPrivate ?? false,
        category: dto.category,
      },
      include: { host: { select: { id: true, username: true } } },
    });

    // Auto-join host as player
    await this.prisma.roomPlayer.create({
      data: { roomId: room.id, userId: hostId },
    });

    return room;
  }

  async join(userId: string, code: string) {
    const room = await this.prisma.room.findUnique({
      where: { code },
      include: { players: true },
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.status !== 'WAITING') throw new BadRequestException('Game already started');
    if (room.players.length >= room.maxPlayers) throw new BadRequestException('Room is full');

    const alreadyJoined = room.players.find((p) => p.userId === userId);
    if (alreadyJoined) return this.findByCode(code);

    await this.prisma.roomPlayer.create({
      data: { roomId: room.id, userId },
    });

    return this.findByCode(code);
  }

  async findByCode(code: string) {
    const room = await this.prisma.room.findUnique({
      where: { code },
      include: {
        host: { select: { id: true, username: true } },
        players: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async findById(id: string) {
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, username: true } },
        players: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });
  }

  async leave(userId: string, code: string) {
    const room = await this.prisma.room.findUnique({ where: { code } });
    if (!room) throw new NotFoundException('Room not found');

    await this.prisma.roomPlayer.deleteMany({
      where: { roomId: room.id, userId },
    });

    return { message: 'Left room' };
  }
}
