import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { signOut } from 'firebase/auth';

export default function SellerDashboardScreen({ navigation }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (!user) {
        console.log('No authenticated user found, redirecting to landing');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Customer' }],
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch stores only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const storesQuery = query(
      collection(db, 'stores'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribeStores = onSnapshot(storesQuery, (snapshot) => {
      const storesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStores(storesList);
      setLoading(false);
    });

    return () => unsubscribeStores();
  }, [isAuthenticated]);

  const handleAddStore = () => {
    navigation.navigate('Create Store');
  };

  const handleDeleteStore = async (store) => {
    Alert.alert(
      'Delete Store',
      `Are you sure you want to delete "${store.name}"? This will also delete all products in this store.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'stores', store.id));
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Store deleted successfully'
              });
            } catch (error) {
              console.error('Error deleting store:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete store'
              });
            }
          }
        }
      ]
    );
  };

  const handleStorePress = (store) => {
    navigation.navigate('Product Manager', {
      storeId: store.id,
      storeName: store.name
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const renderStoreItem = ({ item }) => (
    <View style={styles.storeCard}>
      <TouchableOpacity 
        style={styles.storeInfo}
        onPress={() => navigation.navigate('Product Manager', {
          storeId: item.id,
          storeName: item.storeName
        })}
      >
        {item.logoUrl ? (
          <Image 
            source={{ uri: item.logoUrl }} 
            style={styles.storeLogo}
          />
        ) : (
          <View style={styles.storeLogoPlaceholder}>
            <Ionicons name="storefront" size={32} color="#666" />
          </View>
        )}
        <View style={styles.storeDetails}>
          <Text style={styles.storeName}>{item.storeName}</Text>
          <Text style={styles.storeCategory}>{item.category}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.storeActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            console.log('Navigation object:', navigation);
            console.log('Available routes:', navigation.getState().routes);
            console.log('Navigating to EditStore with store:', item);
            try {
              navigation.navigate('EditStore', { store: item });
            } catch (error) {
              console.error('Navigation error:', error);
            }
          }}
        >
          <Ionicons name="pencil" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteStore(item)}
        >
          <Ionicons name="trash" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading stores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome, {auth.currentUser?.email}
          </Text>
          <Text style={styles.subtitle}>Manage your stores and products</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleAddStore}
          >
            <Ionicons name="add-circle" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Add Store</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { marginLeft: 8 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={24} color="#FF3B30" />
            <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.storesSection}>
          <Text style={styles.sectionTitle}>Your Stores</Text>
          {stores.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color="#666" />
              <Text style={styles.emptyStateText}>
                You haven't created any stores yet
              </Text>
              <TouchableOpacity 
                style={styles.createStoreButton}
                onPress={handleAddStore}
              >
                <Text style={styles.createStoreButtonText}>Create Your First Store</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={stores}
              renderItem={renderStoreItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  storesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  storeCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  storeLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeDetails: {
    flex: 1,
    marginLeft: 12,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  storeCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  storeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  createStoreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createStoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
}); 