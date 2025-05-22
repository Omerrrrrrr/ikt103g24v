// app/(tabs)/_layout.js
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { CartProvider } from '../context/CartContext';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <CartProvider>
      <Stack 
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={isAuthenticated ? "(tabs)" : "(public)"}
      >
        <Stack.Screen 
          name="(public)" 
          options={{ 
            headerShown: false,
            href: null
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            href: null
          }} 
        />
        <Stack.Screen 
          name="signin" 
          options={{ 
            headerShown: false,
            href: null
          }} 
        />
        <Stack.Screen 
          name="auth" 
          options={{ 
            headerShown: false,
            href: null
          }} 
        />
      </Stack>
      <Toast />
    </CartProvider>
  );
}
