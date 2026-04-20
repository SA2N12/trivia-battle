import { Controller, Get, Post } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get('categories')
  getCategories() {
    return this.questionsService.getCategories();
  }

  @Post('seed')
  seed() {
    return this.questionsService.seedQuestions();
  }
}
