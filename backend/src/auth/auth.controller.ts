import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  // 認証はフロントエンドでSupabase Authを直接使用
  // このコントローラーは将来の拡張用に残す

  @Get('health')
  healthCheck() {
    return { status: 'ok', message: 'Auth is handled by Supabase Auth' };
  }
}
