import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private supabaseService: SupabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET || 'fallback-secret',
    });
  }

  async validate(payload: any) {
    console.log('JWT validate called with payload:', JSON.stringify(payload, null, 2));

    if (!payload.sub) {
      console.log('Invalid token: no sub');
      throw new UnauthorizedException('Invalid token');
    }

    // Supabaseからユーザー情報を取得
    const supabase = this.supabaseService.getClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payload.sub)
      .single();

    console.log('Profile fetch result:', { profile, error });

    if (error || !profile) {
      console.log('User not found in profiles table');
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
