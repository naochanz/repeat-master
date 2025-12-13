import { Stack } from 'expo-router';

export default function StudyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'fade',
        presentation: 'card',
        animationDuration: 50,
        headerBackTitle: '',
        gestureEnabled: true,
        fullScreenGestureEnabled: false,
      }}
    />
  );
}