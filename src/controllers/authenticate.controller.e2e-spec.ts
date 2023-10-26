import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';

describe('Authenticate (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    prisma = moduleRef.get(PrismaService);

    await app.init();
  });

  test('[POST] /sessions', async () => {
    const passwordAccount = '123456';
    const accountToCreate = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: await hash(passwordAccount, 8),
    };

    await prisma.user.create({
      data: accountToCreate,
    });

    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: accountToCreate.email,
      password: passwordAccount,
    });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body).toEqual({
      access_token: expect.any(String),
    });
  });
});
