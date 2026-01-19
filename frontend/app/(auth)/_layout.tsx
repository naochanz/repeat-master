// app/(auth)/_layout.tsx（既存）
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './login';
import SignUpScreen from './signup';
import HomeScreen from '../(tabs)/index';

// ここにタブナビゲーターも追加
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// タブナビゲーター作成
function MainTabs() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Home" component={HomeScreen} />
        </Tab.Navigator>
    );
}

export default function AuthLayout() {
    return (
        <Stack.Navigator
            initialRouteName='login'
            screenOptions={{
                headerShown: false,
                animation: 'fade',
                animationDuration: 250,
            }}
        >
            <Stack.Screen name='login' component={LoginScreen} />
            <Stack.Screen name='signup' component={SignUpScreen} />
            <Stack.Screen name='app' component={MainTabs} />
        </Stack.Navigator>
    );
}