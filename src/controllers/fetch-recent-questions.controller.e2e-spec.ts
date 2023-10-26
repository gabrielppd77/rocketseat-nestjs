import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

describe('Fetch recent questions (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);

    await app.init();
  });

  test('[GET] /questions', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: '123456',
      },
    });
    const accessToken = jwt.sign({ sub: user.id });

    await prisma.question.createMany({
      data: [
        {
          title: 'New question1',
          content: 'question content1',
          authorId: user.id,
          slug: 'New question1',
        },
        {
          title: 'New question2',
          content: 'question content2',
          authorId: user.id,
          slug: 'New question2',
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/questions')
      .set('Authorization', 'Bearer ' + accessToken);

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body).toEqual({
      questions: [
        expect.objectContaining({ title: 'New question1' }),
        expect.objectContaining({ title: 'New question2' }),
      ],
    });
  });
});
