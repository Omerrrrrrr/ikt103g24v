import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Import screens
import LandingScreen from '../screens/LandingScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import SignInScreen from '../screens/SignInScreen';
import AddProductScreen from '../screens/AddProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import CreateStoreScreen from '../screens/CreateStoreScreen';
import EditStoreScreen from '../screens/EditStoreScreen';
import ProductListScreen from '../screens/ProductListScreen';
import CartScreen from '../screens/CartScreen';
import ProductManagerScreen from '../screens/ProductManagerScreen';

const Stack = createNativeStackNavigator();

// Customer stack (public access)
const CustomerStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Landing" 
      component={LandingScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Product List" 
      component={ProductListScreen}
      options={{ title: 'Products' }}
    />
    <Stack.Screen 
      name="Cart" 
      component={CartScreen}
      options={{ title: 'Shopping Cart' }}
    />
  </Stack.Navigator>
);

// Seller stack (protected)
const SellerStack = () => {
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
    return null; // Or a loading screen
  }

  if (!isAuthenticated) {
    return null; // This will prevent access to the Seller stack
  }

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Seller Dashboard" 
        component={SellerDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Add Product" 
        component={AddProductScreen}
        options={{ title: 'Add New Product' }}
      />
      <Stack.Screen 
        name="Edit Product" 
        component={EditProductScreen}
        options={{ title: 'Edit Product' }}
      />
      <Stack.Screen 
        name="Create Store" 
        component={CreateStoreScreen}
        options={{ title: 'Create New Store' }}
      />
      <Stack.Screen 
        name="EditStore" 
        component={EditStoreScreen}
        options={{ title: 'Edit Store' }}
      />
      <Stack.Screen 
        name="Product Manager" 
        component={ProductManagerScreen}
        options={({ route }) => ({ 
          title: route.params?.storeName || 'Manage Products'
        })}
      />
    </Stack.Navigator>
  );
};

// Auth stack
const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Sign In" 
      component={SignInScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Main navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Customer" component={CustomerStack} />
        <Stack.Screen name="Seller" component={SellerStack} />
        <Stack.Screen name="Auth" component={AuthStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 