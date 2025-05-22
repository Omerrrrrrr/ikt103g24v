import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import Toast from 'react-native-toast-message';

export default function SellerDashboard() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        fetchUserStores(user.uid);
      } else {
        console.log('User not authenticated');
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserStores = async (userId) => {
    try {
      setLoading(true);
      
      // Fetch user's stores
      const storesQuery = query(
        collection(db, 'stores'),
        where('userId', '==', userId)
      );
      
      const storesSnapshot = await getDocs(storesQuery);
      const storesList = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Fetched ${storesList.length} stores for user`);
      setStores(storesList);
    } catch (error) {
      console.error('Error in dashboard:', error);
      Toast.show({
        type: 'error',
        text1: 'Error loading stores',
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToCreateStore = () => {
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }
    router.push('/create-store');
  };

  const navigateToStoreDetail = (storeId) => {
    router.push(`/store-detail?id=${storeId}`);
  };

  const navigateToOrdersList = () => {
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }
    router.push('/orders');
  };

  const navigateToSignIn = () => {
    router.push('/signin');
  };

  const renderStoreItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.storeCard}
      onPress={() => navigateToStoreDetail(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.storeImageContainer}>
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.storeImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="storefront-outline" size={50} color="#ccc" />
            <Text style={styles.storeInitial}>
              {item.name ? item.name.charAt(0).toUpperCase() : "S"}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.storeInfo}>
        <Text style={styles.storeName} numberOfLines={1}>
          {item.name || 'Unnamed Store'}
        </Text>
        <Text style={styles.storeDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>
        
        <View style={styles.storeFooter}>
          <View style={styles.editButton}>
            <Ionicons name="create-outline" size={16} color="#007AFF" />
            <Text style={styles.editButtonText}>Edit Store</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyStoresList = () => (
    <View style={styles.emptyState}>
      <Ionicons name="storefront-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Stores Yet</Text>
      <Text style={styles.emptyText}>Create your first store to start selling products</Text>
      <TouchableOpacity 
        style={styles.createStoreButton}
        onPress={navigateToCreateStore}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.createStoreButtonText}>Create New Store</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your stores...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>ShopFlex</Text>
            <Text style={styles.title}>Seller Dashboard</Text>
          </View>
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>Please sign in to access your seller dashboard</Text>
          <TouchableOpacity 
            style={styles.createStoreButton}
            onPress={navigateToSignIn}
            activeOpacity={0.7}
          >
            <Ionicons name="log-in" size={20} color="#fff" />
            <Text style={styles.createStoreButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>ShopFlex</Text>
          <Text style={styles.title}>Seller Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={styles.ordersButton}
          onPress={navigateToOrdersList}
          activeOpacity={0.7}
        >
          <Ionicons name="list" size={20} color="#555" />
          <Text style={styles.ordersButtonText}>Orders</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>
          Welcome{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!
        </Text>
        <Text style={styles.welcomeSubText}>
          {stores.length > 0 
            ? 'Manage your stores and products below'
            : 'Get started by creating your first store'}
        </Text>
      </View>
      
      {stores.length > 0 ? (
        <>
          <View style={styles.storesHeader}>
            <Text style={styles.sectionTitle}>Your Stores</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={navigateToCreateStore}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
              <Text style={styles.addButtonText}>Add Store</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={stores}
            renderItem={renderStoreItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <EmptyStoresList />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  ordersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    minHeight: 40,
  },
  ordersButtonText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  welcomeSubText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  storesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    height: 120,
  },
  storeImageContainer: {
    width: 120,
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storeInitial: {
    position: 'absolute',
    fontSize: 30,
    fontWeight: 'bold',
    color: '#999',
  },
  storeInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  storeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    maxWidth: 300,
  },
  createStoreButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minHeight: 48,
  },
  createStoreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

