import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface CachedUser {
  id: string;
  email: string;
  name?: string;
  goal?: string;
  expiresAt: number;
}

// トークンキャッシュ（5分間有効）
const tokenCache = new Map<string, CachedUser>();
const CACHE_TTL = 5 * 60 * 1000; // 5分

// 定期的に期限切れキャッシュを削除
setInterval(() => {
  const now = Date.now();
  for (const [token, cached] of tokenCache.entries()) {
    if (cached.expiresAt < now) {
      tokenCache.delete(token);
    }
  }
}, 60 * 1000); // 1分ごとにクリーンアップ

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    // キャッシュをチェック
    const cached = tokenCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      request.user = {
        id: cached.id,
        email: cached.email,
        name: cached.name,
        goal: cached.goal,
      };
      return true;
    }

    // キャッシュになければSupabaseで検証
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid token');
    }

    // プロファイルを取得
    const adminSupabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const userInfo = {
      id: user.id,
      email: user.email || '',
      name: profile?.name,
      goal: profile?.goal,
    };

    // キャッシュに保存
    tokenCache.set(token, {
      ...userInfo,
      expiresAt: Date.now() + CACHE_TTL,
    });

    request.user = userInfo;
    return true;
  }
}
