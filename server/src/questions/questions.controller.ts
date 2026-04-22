import { Controller, Get, Post, Query } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get('categories')
  getCategories() {
    return this.questionsService.getCategories();
  }

  @Post('seed')
  seed(@Query('reset') reset?: string) {
    return this.questionsService.seedQuestions(reset === 'true');
  }
}
