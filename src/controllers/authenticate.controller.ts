import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

import { ZodValidationPipe } from '@/pipes/zod-validation.pipe';
import { z } from 'zod';
import { compare } from 'bcryptjs';

const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>;

@Controller('/sessions')
export class AuthenticateController {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body(new ZodValidationPipe(authenticateBodySchema))
    body: AuthenticateBodySchema,
  ) {
    const { email, password } = body;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return new UnauthorizedException('User credentials dot not match.');
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return new UnauthorizedException('User credentials dot not match.');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
    });

    return { access_token: accessToken };
  }
}
