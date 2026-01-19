import { Stack } from 'expo-router';

export default function DashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'fade',
        animationDuration: 250,
        gestureEnabled: false,
        headerTitleAlign: 'center',
      }}
    />
  );
}
