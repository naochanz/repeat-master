import { Stack } from 'expo-router';
import { CardStyleInterpolators } from '@react-navigation/stack';

export default function DashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'fade',
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
        },
        gestureEnabled: true,
      }}
    />
  );
}
