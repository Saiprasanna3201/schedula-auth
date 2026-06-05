import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, users } from '../common/types';

export const JWT_SECRET = process.env.JWT_SECRET || 'schedula_super_secret_key';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    const user = users.find((u) => u.id === payload.sub);
    if (!user) throw new UnauthorizedException('User no longer exists');
    // Attach to request as req.user
    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }
}
