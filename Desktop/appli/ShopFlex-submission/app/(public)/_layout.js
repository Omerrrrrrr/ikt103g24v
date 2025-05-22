import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="store/[id]"
        options={{
          title: "Store Details",
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTintColor: '#007AFF',
          presentation: 'card',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="cart"
        options={{
          title: "Shopping Cart",
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTintColor: '#007AFF',
          presentation: 'card',
          headerShown: false,
        }}
      />
    </Stack>
  );
} 