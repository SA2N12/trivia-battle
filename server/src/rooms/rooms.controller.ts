import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':code/join')
  join(@Request() req: any, @Param('code') code: string) {
    return this.roomsService.join(req.user.id, code.toUpperCase());
  }

  @UseGuards(JwtAuthGuard)
  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.roomsService.findByCode(code.toUpperCase());
  }

  @UseGuards(JwtAuthGuard)
  @Post(':code/leave')
  leave(@Request() req: any, @Param('code') code: string) {
    return this.roomsService.leave(req.user.id, code.toUpperCase());
  }
}
