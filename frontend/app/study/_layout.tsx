import { Stack } from 'expo-router';

export default function StudyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'fade',
        animationDuration: 250,
        headerBackTitle: '',
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        headerTitleAlign: 'center',
      }}
    />
  );
}