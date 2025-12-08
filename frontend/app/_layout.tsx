import {
  ZenKakuGothicNew_400Regular,
  ZenKakuGothicNew_500Medium,
  ZenKakuGothicNew_700Bold,
  ZenKakuGothicNew_900Black,
} from '@expo-google-fonts/zen-kaku-gothic-new';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useQuizBookStore } from '@/stores/quizBookStore';

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
  const [loaded, error] = useFonts({
    'ZenKaku-Regular': ZenKakuGothicNew_400Regular,
    'ZenKaku-Medium': ZenKakuGothicNew_500Medium,
    'ZenKaku-Bold': ZenKakuGothicNew_700Bold,
    'ZenKaku-Black': ZenKakuGothicNew_900Black,
    ...FontAwesome.font,
  });

  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      fetchQuizBooks();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
    </ThemeProvider>
  );
}
