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
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function ProductManagerScreen({ navigation, route }) {
  const { storeId: initialStoreId, storeName: initialStoreName } = route.params || {};
  const [products, setProducts] = useState([]);
  const [myStores, setMyStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState(initialStoreId);
  const [selectedStoreName, setSelectedStoreName] = useState(initialStoreName);
  const [showStoreModal, setShowStoreModal] = useState(false);

  // Strict authentication guard
  useEffect(() => {
    if (!auth.currentUser) {
      console.log('No authenticated user found, redirecting to landing');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Customer' }],
      });
      return;
    }

    // Fetch all stores owned by the current user
    const storesQuery = query(
      collection(db, 'stores'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribeStores = onSnapshot(storesQuery, (snapshot) => {
      const storesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMyStores(storesList);

      // If no store is selected and we have stores, select the first one
      if (!selectedStoreId && storesList.length > 0) {
        setSelectedStoreId(storesList[0].id);
        setSelectedStoreName(storesList[0].storeName);
      }
    });

    return () => unsubscribeStores();
  }, []);

  // Fetch products for the selected store
  useEffect(() => {
    if (!selectedStoreId || !auth.currentUser) return;

    const productsQuery = query(
      collection(db, 'products'),
      where('storeId', '==', selectedStoreId),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsList);
      setLoading(false);
    });

    return () => unsubscribeProducts();
  }, [selectedStoreId]);

  const handleAddProduct = () => {
    if (!selectedStoreId) {
      Toast.show({
        type: 'error',
        text1: 'No Store Selected',
        text2: 'Please select a store first'
      });
      return;
    }

    navigation.navigate('Add Product', {
      storeId: selectedStoreId,
      storeName: selectedStoreName
    });
  };

  const handleEditProduct = (product) => {
    if (!selectedStoreId) return;

    navigation.navigate('Edit Product', {
      productId: product.id,
      storeId: selectedStoreId,
      storeName: selectedStoreName,
      productData: product
    });
  };

  const handleStoreSelect = (store) => {
    setSelectedStoreId(store.id);
    setSelectedStoreName(store.storeName);
    setShowStoreModal(false);
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productItem}
      onPress={() => handleEditProduct(item)}
    >
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.productImage}
        />
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price}</Text>
        <Text style={styles.productStock}>Stock: {item.stock}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  const renderStoreItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.storeItem,
        item.id === selectedStoreId && styles.selectedStore
      ]}
      onPress={() => handleStoreSelect(item)}
    >
      {item.logoUrl && (
        <Image 
          source={{ uri: item.logoUrl }} 
          style={styles.storeLogo}
        />
      )}
      <Text style={styles.storeName}>{item.storeName}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Store Selection Header */}
      <View style={styles.storeHeader}>
        <TouchableOpacity 
          style={styles.storeSelector}
          onPress={() => setShowStoreModal(true)}
        >
          <Text style={styles.storeSelectorText}>
            {selectedStoreName || 'Select Store'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Products Section */}
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Products</Text>
          <TouchableOpacity 
            style={[
              styles.addButton,
              !selectedStoreId && styles.addButtonDisabled
            ]}
            onPress={handleAddProduct}
            disabled={!selectedStoreId}
          >
            <Ionicons name="add-circle" size={24} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#666" />
              <Text style={styles.emptyStateText}>
                {selectedStoreId 
                  ? 'No products in this store yet'
                  : 'Select a store to view products'}
              </Text>
              {selectedStoreId && (
                <TouchableOpacity 
                  style={styles.addFirstButton}
                  onPress={handleAddProduct}
                >
                  <Text style={styles.addFirstButtonText}>Add Your First Product</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>

      {/* Store Selection Modal */}
      <Modal
        visible={showStoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStoreModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStoreModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Store</Text>
              <TouchableOpacity
                onPress={() => setShowStoreModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={myStores}
              renderItem={renderStoreItem}
              keyExtractor={item => item.id}
              style={styles.storesList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  storeHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  storeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  storeSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productsSection: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#007AFF',
    marginLeft: 4,
    fontSize: 16,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  addFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  storesList: {
    maxHeight: 400,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedStore: {
    backgroundColor: '#e3f2fd',
  },
  storeLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  storeName: {
    fontSize: 16,
    color: '#333',
  },
}); 