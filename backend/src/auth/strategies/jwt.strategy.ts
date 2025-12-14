import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    });
    console.log('✅ JwtStrategy initialized'); // ✅ 追加
  }

  async validate(payload: any) {
    console.log('🔍 JWT payload:', payload); // ✅ 追加
    const user = await this.usersService.findById(payload.sub);
    console.log('👤 User found:', user ? 'Yes' : 'No'); // ✅ 追加
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}