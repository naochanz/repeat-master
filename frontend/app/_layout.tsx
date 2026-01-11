import {
  ZenKakuGothicNew_400Regular,
  ZenKakuGothicNew_500Medium,
  ZenKakuGothicNew_700Bold,
  ZenKakuGothicNew_900Black,
} from '@expo-google-fonts/zen-kaku-gothic-new';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Redirect, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/components/useColorScheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { useAuthStore } from '@/stores/authStore';
import { ONBOARDING_COMPLETE_KEY } from './onboarding';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore(state => state.initialize);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const pathname = usePathname();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  const [loaded, error] = useFonts({
    'ZenKaku-Regular': ZenKakuGothicNew_400Regular,
    'ZenKaku-Medium': ZenKakuGothicNew_500Medium,
    'ZenKaku-Bold': ZenKakuGothicNew_700Bold,
    'ZenKaku-Black': ZenKakuGothicNew_900Black,
    ...FontAwesome.font,
  });

  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    initialize();
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      setHasSeenOnboarding(value === 'true');
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setHasSeenOnboarding(true); // エラー時はスキップ
    }
  };

  useEffect(() => {
    if (loaded && !isLoading && hasSeenOnboarding !== null) {
      SplashScreen.hideAsync();
      if (isAuthenticated) {
        fetchQuizBooks();
      }
    }
  }, [loaded, isLoading, isAuthenticated, hasSeenOnboarding]);

  if (!loaded || isLoading || hasSeenOnboarding === null) {
    return null;
  }

  const authRoutes = ['/login', '/signup', '/verify-email'];
  const onboardingRoute = '/onboarding';

  // ✅ オンボーディング未完了かつ認証済みでない場合、オンボーディングへリダイレクト
  if (!hasSeenOnboarding && !isAuthenticated && pathname !== onboardingRoute) {
    return <Redirect href="/onboarding" />;
  }

  // ✅ 未認証の場合、認証画面・オンボーディング画面以外ならログインへリダイレクト
  if (!isAuthenticated && !authRoutes.includes(pathname) && pathname !== onboardingRoute) {
    return <Redirect href="/login" />;
  }

  // ✅ 認証済みの場合、認証画面にいたらホームへリダイレクト（verify-emailは除外）
  if (isAuthenticated && authRoutes.includes(pathname) && pathname !== '/verify-email') {
    return <Redirect href="/(tabs)" />;
  }

  // ✅ 認証済みの場合、オンボーディング画面にいたらホームへリダイレクト
  if (isAuthenticated && pathname === onboardingRoute) {
    return <Redirect href="/(tabs)" />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          presentation: 'card',
          animationDuration: 50,
        }}
      />
      <Toast />
    </ThemeProvider>
  );
}
