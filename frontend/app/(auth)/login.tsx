import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import AppName from '../_compornents/Header';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const loginSchema = z.object({
    email: z
        .string()
        .min(1, "メールアドレスは必須です")
        .email("正しいメールアドレスを入力してください"),

    password: z
        .string()
        .min(1, "パスワードは必須です")
        .min(8, "パスワードは8文字以上で入力してください"),
});

type loginFormData = z.infer<typeof loginSchema>;

const Login = () => {
    const loginAction = useAuthStore(state => state.login);
    const isLoading = useAuthStore(state => state.isLoading);

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<loginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: loginFormData) => {
        try {
            await loginAction(data.email, data.password);
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Login error:', error);
            Alert.alert(
                'エラー',
                error.message || error.response?.data?.message || 'ログインに失敗しました'
            );
        }
    };

    return (
        <>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <AppName />

                <View style={styles.container}>
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginContainerText}>ログイン情報を入力してください</Text>
                    </View>

                    <View style={styles.formContainer}>

                        {/* Email */}
                        <View style={styles.mailContainer}>
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, value } }) => (
                                    <View>
                                        <Text style={styles.mailText}>メールアドレス：</Text>
                                        <TextInput
                                            value={value}
                                            onChangeText={onChange}
                                            placeholder="example@e-mail.com"
                                            style={styles.email}
                                            placeholderTextColor={theme.colors.secondary[400]}
                                        />
                                        {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
                                    </View>
                                )}
                            />
                        </View>

                        {/* Password */}
                        <Controller
                            control={control}
                            name="password"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.passContainer}>
                                    <Text style={styles.passText}>パスワード：</Text>
                                    <TextInput
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="パスワードを入力してください"
                                        style={styles.password}
                                        secureTextEntry={true}
                                        placeholderTextColor={theme.colors.secondary[400]}
                                    />
                                    {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
                                </View>
                            )}
                        />

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleSubmit(onSubmit)}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'ログイン中...' : 'ログイン'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.signupButton} onPress={() => router.replace('/signup')}>
                            <Text style={[styles.buttonText, { color: theme.colors.secondary[700] }]}>新規登録</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </SafeAreaView>
        </>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.neutral[50],
    },
    container: {
        margin: 0,
        flex: 1,
        padding: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.neutral[50],
    },
    loginContainer: {
        flex: 0.2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginContainerText: {
        fontSize: theme.typography.fontSizes.xl,
        color: theme.colors.secondary[900],
        fontFamily: 'ZenKaku-Bold',
    },
    formContainer: {
        flex: 1,
        width: '100%',
        padding: theme.spacing.md,
    },
    mailContainer: {
        marginBottom: theme.spacing.md,
    },
    mailText: {
        color: theme.colors.secondary[700],
        paddingVertical: theme.spacing.xs,
        fontFamily: 'ZenKaku-Medium',
        fontSize: theme.typography.fontSizes.base,
    },
    email: {
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderRadius: theme.borderRadius.md,
        borderColor: theme.colors.secondary[300],
        width: '100%',
        backgroundColor: theme.colors.neutral.white,
        fontSize: theme.typography.fontSizes.base,
        fontFamily: 'ZenKaku-Regular',
    },
    passContainer: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    passText: {
        color: theme.colors.secondary[700],
        paddingVertical: theme.spacing.xs,
        fontFamily: 'ZenKaku-Medium',
        fontSize: theme.typography.fontSizes.base,
    },
    password: {
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderRadius: theme.borderRadius.md,
        borderColor: theme.colors.secondary[300],
        width: '100%',
        backgroundColor: theme.colors.neutral.white,
        fontSize: theme.typography.fontSizes.base,
        fontFamily: 'ZenKaku-Regular',
    },
    loginButton: {
        padding: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: theme.colors.primary[600],
        marginTop: theme.spacing.xl * 2,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.md,
    },
    signupButton: {
        padding: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: theme.colors.secondary[200],
        marginVertical: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
    },
    buttonText: {
        fontWeight: theme.typography.fontWeights.bold as any,
        color: theme.colors.neutral.white,
        fontFamily: 'ZenKaku-Bold',
        fontSize: theme.typography.fontSizes.base,
    },
    error: {
        color: theme.colors.error[600],
        fontSize: theme.typography.fontSizes.sm,
        fontFamily: 'ZenKaku-Regular',
        marginTop: theme.spacing.xs,
    },
});

export default Login;