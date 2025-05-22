import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export default function CategoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = route.params;
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, [category]);

  const loadStores = async () => {
    try {
      const q = query(
        collection(db, 'stores'),
        where('category', '==', category.id)
      );
      const querySnapshot = await getDocs(q);
      const storeList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStores(storeList);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStorePress = (store) => {
    navigation.navigate('Store Detail', { storeId: store.id });
  };

  const renderStore = ({ item }) => (
    <TouchableOpacity
      style={styles.storeCard}
      onPress={() => handleStorePress(item)}
    >
      {item.logoUrl ? (
        <Image
          source={{ uri: item.logoUrl }}
          style={styles.storeLogo}
        />
      ) : (
        <View style={[styles.storeLogo, styles.placeholderLogo]}>
          <Ionicons name="storefront" size={32} color="#666" />
        </View>
      )}
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.storeName}</Text>
        <Text style={styles.storeDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name={category.icon} size={24} color="#007AFF" />
          <Text style={styles.title}>{category.name}</Text>
        </View>
      </View>

      <FlatList
        data={stores}
        renderItem={renderStore}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.storeList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No stores found</Text>
            <Text style={styles.emptySubtext}>
              Check back later for stores in this category
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 8,
  },
  storeList: {
    padding: 16,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  storeLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  placeholderLogo: {
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
}); 