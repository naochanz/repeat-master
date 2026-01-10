import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided');
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    // Supabaseクライアントを作成（anon keyを使用）
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );

    // トークンでユーザーを取得（これがトークン検証も兼ねる）
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('Token verification failed:', error?.message);
      throw new UnauthorizedException('Invalid token');
    }

    console.log('User verified:', user.id, user.email);

    // service_role keyでプロファイルを取得（RLSをバイパス）
    const adminSupabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // リクエストにユーザー情報を追加
    request.user = {
      id: user.id,
      email: user.email,
      name: profile?.name,
      goal: profile?.goal,
    };

    return true;
  }
}
