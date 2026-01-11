import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import AppName from '../_compornents/Header';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const VerifyEmail = () => {
    const { email } = useLocalSearchParams<{ email: string }>();

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <AppName />

            <View style={styles.container}>
                <View style={styles.iconContainer}>
                    <Ionicons name="mail-outline" size={80} color={theme.colors.primary[600]} />
                </View>

                <Text style={styles.title}>確認メールを送信しました</Text>

                <Text style={styles.description}>
                    {email ? `${email} に` : ''}確認メールを送信しました。{'\n'}
                    メール内のリンクをクリックして{'\n'}
                    アカウントを有効化してください。
                </Text>

                <View style={styles.noteContainer}>
                    <Text style={styles.noteTitle}>メールが届かない場合</Text>
                    <Text style={styles.noteText}>
                        ・迷惑メールフォルダをご確認ください{'\n'}
                        ・メールアドレスが正しいかご確認ください{'\n'}
                        ・数分待ってから再度ご確認ください
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.replace('/login')}
                >
                    <Text style={styles.buttonText}>ログイン画面へ</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.neutral[50],
    },
    container: {
        flex: 1,
        padding: theme.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.neutral[50],
    },
    iconContainer: {
        marginBottom: theme.spacing.xl,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.primary[50],
        borderRadius: 100,
    },
    title: {
        fontSize: theme.typography.fontSizes['2xl'],
        color: theme.colors.secondary[900],
        fontFamily: 'ZenKaku-Bold',
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    description: {
        fontSize: theme.typography.fontSizes.base,
        color: theme.colors.secondary[700],
        fontFamily: 'ZenKaku-Regular',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: theme.spacing.xl,
    },
    noteContainer: {
        backgroundColor: theme.colors.neutral[100],
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        width: '100%',
        marginBottom: theme.spacing.xl,
    },
    noteTitle: {
        fontSize: theme.typography.fontSizes.sm,
        color: theme.colors.secondary[900],
        fontFamily: 'ZenKaku-Bold',
        marginBottom: theme.spacing.sm,
    },
    noteText: {
        fontSize: theme.typography.fontSizes.sm,
        color: theme.colors.secondary[600],
        fontFamily: 'ZenKaku-Regular',
        lineHeight: 22,
    },
    loginButton: {
        padding: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: theme.colors.primary[600],
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.md,
    },
    buttonText: {
        fontWeight: theme.typography.fontWeights.bold as any,
        color: theme.colors.neutral.white,
        fontFamily: 'ZenKaku-Bold',
        fontSize: theme.typography.fontSizes.base,
    },
});

export default VerifyEmail;
