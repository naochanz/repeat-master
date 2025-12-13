import { Stack } from 'expo-router';

export default function StudyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'fade',
        presentation: 'card',
        animationDuration: 200,
        headerBackTitle: '',
        gestureEnabled: true,
        fullScreenGestureEnabled: false,
      }}
    />
  );
}