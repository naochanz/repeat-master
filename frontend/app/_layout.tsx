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
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { useAuthStore } from '@/stores/authStore';

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
  const loadToken = useAuthStore(state => state.loadToken);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const pathname = usePathname();
  
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
    loadToken();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      if (isAuthenticated) {
        fetchQuizBooks(); // ✅ 認証済みの場合のみデータ取得
      }
    }
  }, [loaded, isAuthenticated]); // ✅ isAuthenticated を依存配列に追加

  if (!loaded) {
    return null;
  }

  const authRoutes = ['/login', '/signup'];
  
  // ✅ 未認証の場合、認証画面以外ならログインへリダイレクト
  if (!isAuthenticated && !authRoutes.includes(pathname)) {
    return <Redirect href="/login" />;
  }

  // ✅ 認証済みの場合、認証画面にいたらホームへリダイレクト
  if (isAuthenticated && authRoutes.includes(pathname)) {
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
    </ThemeProvider>
  );
}
