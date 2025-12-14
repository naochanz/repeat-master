import { Stack } from 'expo-router';

export default function DashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'fade',
        presentation: 'card',
        animationDuration: 50,
        gestureEnabled: false,
      }}
    />
  );
}
