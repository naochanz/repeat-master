import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('🛡️ JwtAuthGuard.canActivate called');
    const request = context.switchToHttp().getRequest();
    console.log('🔑 Authorization header:', request.headers.authorization);
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('🔍 JwtAuthGuard.handleRequest');
    console.log('❌ Error:', err);
    console.log('👤 User:', user); // ✅ 変更：全体を出力
    console.log('ℹ️ Info:', info);
    
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user; // ✅ これが重要
  }
}