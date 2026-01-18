import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import React, { useMemo } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/stores/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showErrorToast } from '@/utils/toast';
import { Mail, Lock } from 'lucide-react-native';

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

  const loginAction = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

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
              source={require('@/assets/images/logo/ロゴ.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>反復学習で確実にマスター</Text>
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
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl * 2,
  },
  logoImage: {
    width: 140,
    height: 140,
    marginBottom: theme.spacing.md,
  },
  tagline: {
    fontSize: theme.typography.fontSizes.base,
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
    marginBottom: theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
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
    marginTop: theme.spacing.xl,
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
});

export default Login;
