import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { SignupDto, LoginDto } from './auth.dto';
import { users } from '../common/types';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // ── Signup ────────────────────────────────────────────────────────────────

  async signup(dto: SignupDto) {
    const exists = users.find((u) => u.email === dto.email);
    if (exists) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = {
      id: uuidv4(),
      name: dto.name,
      email: dto.email,
      password: hashed,
      role: dto.role,
    };

    users.push(user);

    const token = this.signToken(user.id, user.email, user.role);

    return {
      message: 'Signup successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      access_token: token,
    };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = users.find((u) => u.email === dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user.id, user.email, user.role);

    return {
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      access_token: token,
    };
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private signToken(sub: string, email: string, role: string): string {
    return this.jwtService.sign({ sub, email, role });
  }
}
