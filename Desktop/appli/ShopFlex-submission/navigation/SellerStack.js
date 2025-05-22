import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import CreateStoreScreen from '../screens/CreateStoreScreen';
import EditStoreScreen from '../screens/EditStoreScreen';
import ProductManagerScreen from '../screens/ProductManagerScreen';
import AddProductScreen from '../screens/AddProductScreen';
import EditProductScreen from '../screens/EditProductScreen';

const Stack = createStackNavigator();

export default function SellerStack() {
  console.log('SellerStack: Rendering navigation stack');
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Seller Dashboard" 
        component={SellerDashboardScreen}
        options={{
          title: 'My Stores',
        }}
      />
      <Stack.Screen 
        name="Create Store" 
        component={CreateStoreScreen}
        options={{
          title: 'Create New Store',
        }}
      />
      <Stack.Screen 
        name="EditStore" 
        component={EditStoreScreen}
        options={{
          title: 'Edit Store',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="Product Manager" 
        component={ProductManagerScreen}
      />
      <Stack.Screen 
        name="Add Product" 
        component={AddProductScreen}
        options={{
          title: 'Add New Product',
        }}
      />
      <Stack.Screen 
        name="Edit Product" 
        component={EditProductScreen}
        options={{
          title: 'Edit Product',
        }}
      />
    </Stack.Navigator>
  );
} 