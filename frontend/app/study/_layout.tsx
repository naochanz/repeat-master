import { Stack } from 'expo-router';

export default function StudyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'default',
        headerBackTitle: '',
        gestureEnabled: false, // ✅ スワイプバックを有効化
        fullScreenGestureEnabled: false, // iOS専用
      }}
    />
  );
}