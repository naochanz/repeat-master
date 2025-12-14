import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import React from 'react'
import AppName from '../_compornents/Header';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';

const signupSchema = z.object({
    name: z
        .string()
        .min(1, "ユーザーネームを入力してください"),
    email: z
        .string()
        .min(1, "メールアドレスは必須です")
        .email("正しいメールアドレスを入力してください"),

    password: z
        .string()
        .min(1, "パスワードは必須です")
        .min(8, "パスワードは8文字以上で入力してください"),

    confirmPassword: z
        .string()
        .min(1, "パスワード確認は必須です")
}).refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

const signup = () => {
    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema)
    });

    const onSubmit = (data: SignupFormData) => {
        console.log("サインアップデータ", data);
        router.replace('/(tabs)');
    };

    return (
        <>
            <View>
                <AppName />
            </View>

            <View style={styles.container}>
                <View style={styles.loginContainer}>
                    <Text style={styles.loginContainerText}>ログイン情報を登録してください</Text>
                </View>

                <View style={styles.formContainer}>
                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.nameContainer}>
                                <View>
                                    <Text style={styles.nameText}>ユーザーネーム：</Text>
                                    <TextInput
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="山田　太郎"
                                        style={styles.name}
                                        placeholderTextColor={theme.colors.secondary[400]}
                                    />
                                    {errors.name && <Text style={styles.error}>{errors.name.message}</Text>}
                                </View>
                            </View>
                        )}
                    />

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

                    {/* Confirm Password */}
                    <Controller
                        control={control}
                        name="confirmPassword"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.passContainer}>
                                <Text style={styles.passText}>パスワード(確認用)：</Text>
                                <TextInput
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="確認用パスワードを入力してください"
                                    style={styles.password}
                                    secureTextEntry={true}
                                    placeholderTextColor={theme.colors.secondary[400]}
                                />
                                {errors.confirmPassword && (
                                    <Text style={styles.error}>{errors.confirmPassword.message}</Text>
                                )}
                            </View>
                        )}
                    />

                    <TouchableOpacity style={styles.signupButton} onPress={handleSubmit(onSubmit)}>
                        <Text style={styles.buttonText}>新規登録</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
                        <Text style={[styles.buttonText, { color: theme.colors.secondary[700] }]}>ログイン画面へ戻る</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 0,
        flex: 1,
        padding: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.neutral[50],
    },
    loginContainer: {
        flex: 0.1,
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
    nameContainer:{
        marginBottom: theme.spacing.sm,
    },
    nameText: {
        color: theme.colors.secondary[700],
        paddingVertical: theme.spacing.xs,
        fontFamily: 'ZenKaku-Medium',
        fontSize: theme.typography.fontSizes.base,
    },
    name:{
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderRadius: theme.borderRadius.md,
        borderColor: theme.colors.secondary[300],
        width: '100%',
        backgroundColor: theme.colors.neutral.white,
        fontSize: theme.typography.fontSizes.base,
        fontFamily: 'ZenKaku-Regular',
    },
    mailContainer: {
        marginBottom: theme.spacing.sm,
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
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
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
    signupButton: {
        padding: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: theme.colors.primary[600],
        marginTop: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.md,
    },
    loginButton: {
        padding: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: theme.colors.secondary[200],
        marginVertical: theme.spacing.md,
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

export default signup;