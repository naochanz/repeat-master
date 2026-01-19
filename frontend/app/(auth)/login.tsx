import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import React, { useMemo, useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/stores/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showErrorToast } from '@/utils/toast';
import { Mail, Lock } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('正しいメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードは必須です')
    .min(8, 'パスワードは8文字以上で入力してください'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  const loginAction = useAuthStore((state) => state.login);
  const signInWithApple = useAuthStore((state) => state.signInWithApple);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    const checkAppleAuth = async () => {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAppleAuthAvailable(available);
    };
    checkAppleAuth();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginAction(data.email, data.password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || 'ログインに失敗しました';
      showErrorToast(errorMessage, 'ログインエラー');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        const errorMessage = error.message || 'Appleでのログインに失敗しました';
        showErrorToast(errorMessage, 'ログインエラー');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>学習スタイルを変えず、効率を最大化する</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>ログイン</Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={theme.colors.secondary[400]} style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="メールアドレス"
                      style={styles.input}
                      placeholderTextColor={theme.colors.secondary[400]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  )}
                />
              </View>
              {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color={theme.colors.secondary[400]} style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="パスワード"
                      style={styles.input}
                      secureTextEntry
                      placeholderTextColor={theme.colors.secondary[400]}
                      autoComplete="password"
                    />
                  )}
                />
              </View>
              {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{isLoading ? 'ログイン中...' : 'ログイン'}</Text>
            </TouchableOpacity>

            {/* Divider */}
            {isAppleAuthAvailable && (
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>または</Text>
                <View style={styles.divider} />
              </View>
            )}

            {/* Apple Sign In */}
            {isAppleAuthAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={theme.borderRadius.lg}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}

            {/* Signup Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>アカウントをお持ちでない方</Text>
              <TouchableOpacity onPress={() => router.replace('/signup')}>
                <Text style={styles.signupLink}>新規登録</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Regular',
  },
  formContainer: {
    flex: 1,
  },
  formTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    paddingHorizontal: theme.spacing.md,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[900],
  },
  error: {
    color: theme.colors.error[600],
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Regular',
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    ...theme.shadows.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  signupText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Regular',
  },
  signupLink: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary[600],
    fontFamily: 'ZenKaku-Bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.secondary[200],
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[400],
    fontFamily: 'ZenKaku-Regular',
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
});

export default Login;
