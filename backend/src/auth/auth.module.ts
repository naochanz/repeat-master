import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

console.log('🔐 JWT_SECRET (module):', JWT_SECRET);

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }), // ✅ 修正
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, PassportModule, JwtStrategy],
})
export class AuthModule {}