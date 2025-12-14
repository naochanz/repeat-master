import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    console.log('🛡️ JwtAuthGuard.canActivate called');
    console.log('🔑 Authorization header:', request.headers.authorization);
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('🔍 JwtAuthGuard.handleRequest');
    console.log('❌ Error:', err);
    console.log('👤 User:', user ? 'Found' : 'Not found');
    console.log('ℹ️ Info:', info);

    if (err || !user) {
      console.log('🚫 Authentication failed');
      throw err || new Error('Unauthorized');
    }
    return user;
  }
}