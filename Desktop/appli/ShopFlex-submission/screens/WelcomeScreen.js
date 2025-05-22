import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const CATEGORIES = [
  { id: 'electronics', name: 'Electronics', icon: 'phone-portrait' },
  { id: 'clothes', name: 'Clothes', icon: 'shirt' },
  { id: 'home', name: 'Home', icon: 'home' },
  { id: 'fashion', name: 'Fashion', icon: 'glasses' },
  { id: 'beauty', name: 'Beauty', icon: 'sparkles' },
  { id: 'food', name: 'Food', icon: 'restaurant' },
];

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStores: 0,
    totalProducts: 0,
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const storesQuery = query(
        collection(db, 'stores'),
        where('userId', '==', user.uid)
      );
      const storesSnapshot = await getDocs(storesQuery);
      const storeIds = storesSnapshot.docs.map(doc => doc.id);

      let totalProducts = 0;
      for (const storeId of storeIds) {
        const productsQuery = query(
          collection(db, 'products'),
          where('storeId', '==', storeId)
        );
        const productsSnapshot = await getDocs(productsQuery);
        totalProducts += productsSnapshot.size;
      }

      setStats({
        totalStores: storesSnapshot.size,
        totalProducts,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('Category', { category });
  };

  const handleSellerPress = () => {
    if (!user) {
      navigation.navigate('Sign In');
    } else {
      navigation.navigate('Seller Dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.sellerButton}
          onPress={handleSellerPress}
        >
          <Ionicons name="business" size={24} color="#007AFF" />
          <Text style={styles.sellerButtonText}>Seller</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>ShopFlex</Text>
          <Text style={styles.heroSubtitle}>Your Gateway to Local Shops Online</Text>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={styles.categoryIconContainer}>
                  <Ionicons name={category.icon} size={32} color="#007AFF" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {user && (
          <View style={styles.sellerStats}>
            <Text style={styles.sectionTitle}>Your Business</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="storefront" size={24} color="#007AFF" />
                <Text style={styles.statNumber}>{stats.totalStores}</Text>
                <Text style={styles.statLabel}>Your Stores</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="cube" size={24} color="#007AFF" />
                <Text style={styles.statNumber}>{stats.totalProducts}</Text>
                <Text style={styles.statLabel}>Total Products</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 24,
  },
  sellerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sellerButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  hero: {
    padding: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  categoriesSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryCard: {
    width: '33.33%',
    padding: 8,
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryName: {
    fontSize: 14,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  sellerStats: {
    padding: 24,
    paddingTop: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});
