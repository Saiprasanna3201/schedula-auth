import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { SignupDto, LoginDto } from './auth.dto';
import { User } from '../user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── Signup ─────────────────────────────────────────────────────────────────
  async signup(dto: SignupDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
      role: dto.role,
    });
    const saved = await this.userRepo.save(user);

    const token = this.signToken(saved.id, saved.email, saved.role);
    return {
      message: 'Signup successful',
      user: { id: saved.id, name: saved.name, email: saved.email, role: saved.role },
      access_token: token,
    };
  }

  // ─── Login ──────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
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

  // ─── Helper ─────────────────────────────────────────────────────────────────
  private signToken(sub: string, email: string, role: string): string {
    return this.jwtService.sign({ sub, email, role });
  }
}