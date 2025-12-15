import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { JWT_SECRET } from '../auth.module';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
    console.log('✅ JwtStrategy initialized');
    console.log('🔐 JWT_SECRET (strategy):', JWT_SECRET);
  }

  async validate(payload: any) {
    console.log('🔍 JWT payload:', payload);
    const user = await this.usersService.findById(payload.sub);
    console.log('👤 User found:', user ? 'Yes' : 'No');
    if (!user) {
      throw new UnauthorizedException();
    }
    return user; // ✅ これが req.user になる
  }
}