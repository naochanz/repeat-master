import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private supabaseService: SupabaseService) {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET environment variable is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    // Supabaseからユーザー情報を取得
    const supabase = this.supabaseService.getClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !profile) {
      throw new UnauthorizedException('User not found');
    }

    // リクエストに渡すユーザーオブジェクト
    return {
      id: payload.sub,
      email: payload.email,
      name: profile.name,
      goal: profile.goal,
    };
  }
}
