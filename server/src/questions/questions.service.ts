import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface SeedQuestion {
  category: string;
  difficulty: Difficulty;
  text: string;
  options: string[];
  correctAnswer: number;
}

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async getRandomQuestions(count: number, category?: string) {
    const where = category ? { category } : {};
    const total = await this.prisma.question.count({ where });

    if (total === 0) return [];

    // Get random questions using a simple approach
    const questions = await this.prisma.question.findMany({
      where,
      take: Math.min(count, total),
    });

    // Shuffle
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return questions.slice(0, count);
  }

  async getCategories() {
    const categories = await this.prisma.question.groupBy({
      by: ['category'],
      _count: { id: true },
    });
    return categories.map((c) => ({
      name: c.category,
      count: c._count.id,
    }));
  }

  async seedQuestions(reset = false) {
    if (reset) {
      await this.prisma.question.deleteMany({});
    }

    const count = await this.prisma.question.count();
    if (count > 0) return { message: `Already ${count} questions in DB` };

    const questions = loadQuestionsFromFile() ?? getSampleQuestions();
    await this.prisma.question.createMany({ data: questions });
    return { message: `Seeded ${questions.length} questions` };
  }
}

function loadQuestionsFromFile() {
  const candidates = [
    path.join(process.cwd(), 'prisma', 'data', 'questions.json'),
    path.join(process.cwd(), 'server', 'prisma', 'data', 'questions.json'),
    path.join(__dirname, '..', '..', 'prisma', 'data', 'questions.json'),
  ];

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as SeedQuestion[];
      return parsed.map((q) => ({
        category: q.category,
        difficulty: q.difficulty,
        text: q.text,
        options: JSON.stringify(q.options),
        correctAnswer: q.correctAnswer,
      }));
    } catch {
      // try next path
    }
  }
  return null;
}

function getSampleQuestions() {
  return [
    {
      category: 'Science',
      difficulty: 'EASY' as const,
      text: 'Quelle planète est surnommée la planète rouge ?',
      options: JSON.stringify(['Vénus', 'Mars', 'Jupiter', 'Saturne']),
      correctAnswer: 1,
    },
    {
      category: 'Science',
      difficulty: 'MEDIUM' as const,
      text: 'Quel est le symbole chimique de l\'or ?',
      options: JSON.stringify(['Go', 'Gd', 'Au', 'Ag']),
      correctAnswer: 2,
    },
    {
      category: 'Science',
      difficulty: 'HARD' as const,
      text: 'Quel est le gaz le plus abondant dans l\'atmosphère terrestre ?',
      options: JSON.stringify(['Oxygène', 'Dioxyde de carbone', 'Azote', 'Hydrogène']),
      correctAnswer: 2,
    },
    {
      category: 'Histoire',
      difficulty: 'EASY' as const,
      text: 'En quelle année la Seconde Guerre mondiale s\'est-elle terminée ?',
      options: JSON.stringify(['1943', '1944', '1945', '1946']),
      correctAnswer: 2,
    },
    {
      category: 'Histoire',
      difficulty: 'MEDIUM' as const,
      text: 'Qui fut le premier empereur de Rome ?',
      options: JSON.stringify(['Jules César', 'Auguste', 'Néron', 'Caligula']),
      correctAnswer: 1,
    },
    {
      category: 'Histoire',
      difficulty: 'HARD' as const,
      text: 'La Magna Carta a été signée en quelle année ?',
      options: JSON.stringify(['1066', '1215', '1348', '1492']),
      correctAnswer: 1,
    },
    {
      category: 'Géographie',
      difficulty: 'EASY' as const,
      text: 'Quelle est la capitale de l\'Australie ?',
      options: JSON.stringify(['Sydney', 'Melbourne', 'Canberra', 'Brisbane']),
      correctAnswer: 2,
    },
    {
      category: 'Géographie',
      difficulty: 'MEDIUM' as const,
      text: 'Quel est le plus long fleuve du monde ?',
      options: JSON.stringify(['Amazone', 'Nil', 'Yangtsé', 'Mississippi']),
      correctAnswer: 1,
    },
    {
      category: 'Géographie',
      difficulty: 'HARD' as const,
      text: 'Quel est le plus petit pays du monde par superficie ?',
      options: JSON.stringify(['Monaco', 'Nauru', 'Vatican', 'Saint-Marin']),
      correctAnswer: 2,
    },
    {
      category: 'Divertissement',
      difficulty: 'EASY' as const,
      text: 'Qui a réalisé le film Titanic ?',
      options: JSON.stringify(['Steven Spielberg', 'James Cameron', 'Ridley Scott', 'Peter Jackson']),
      correctAnswer: 1,
    },
    {
      category: 'Divertissement',
      difficulty: 'MEDIUM' as const,
      text: 'Quel groupe a sorti l\'album « Abbey Road » ?',
      options: JSON.stringify(['The Rolling Stones', 'The Beatles', 'Led Zeppelin', 'Pink Floyd']),
      correctAnswer: 1,
    },
    {
      category: 'Divertissement',
      difficulty: 'HARD' as const,
      text: 'En quelle année le premier épisode des « Simpsons » a-t-il été diffusé ?',
      options: JSON.stringify(['1987', '1988', '1989', '1990']),
      correctAnswer: 2,
    },
    {
      category: 'Sports',
      difficulty: 'EASY' as const,
      text: 'Combien de joueurs composent une équipe de football sur le terrain ?',
      options: JSON.stringify(['9', '10', '11', '12']),
      correctAnswer: 2,
    },
    {
      category: 'Sports',
      difficulty: 'MEDIUM' as const,
      text: 'Quel pays a remporté la Coupe du monde FIFA 2018 ?',
      options: JSON.stringify(['Brésil', 'Allemagne', 'France', 'Croatie']),
      correctAnswer: 2,
    },
    {
      category: 'Sports',
      difficulty: 'HARD' as const,
      text: 'En quelle année ont eu lieu les premiers Jeux olympiques modernes ?',
      options: JSON.stringify(['1896', '1900', '1904', '1892']),
      correctAnswer: 0,
    },
    {
      category: 'Technologie',
      difficulty: 'EASY' as const,
      text: 'Que signifie « HTML » ?',
      options: JSON.stringify(['HyperText Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language']),
      correctAnswer: 0,
    },
    {
      category: 'Technologie',
      difficulty: 'MEDIUM' as const,
      text: 'Qui est le cofondateur d\'Apple Inc. ?',
      options: JSON.stringify(['Bill Gates', 'Steve Jobs', 'Mark Zuckerberg', 'Jeff Bezos']),
      correctAnswer: 1,
    },
    {
      category: 'Technologie',
      difficulty: 'HARD' as const,
      text: 'En quelle année le premier iPhone est-il sorti ?',
      options: JSON.stringify(['2005', '2006', '2007', '2008']),
      correctAnswer: 2,
    },
    {
      category: 'Science',
      difficulty: 'MEDIUM' as const,
      text: 'Combien d\'os compte le corps humain adulte ?',
      options: JSON.stringify(['186', '196', '206', '216']),
      correctAnswer: 2,
    },
    {
      category: 'Science',
      difficulty: 'EASY' as const,
      text: 'Quel est le point d\'ébullition de l\'eau en degrés Celsius ?',
      options: JSON.stringify(['90 °C', '100 °C', '110 °C', '120 °C']),
      correctAnswer: 1,
    },
  ];
}
