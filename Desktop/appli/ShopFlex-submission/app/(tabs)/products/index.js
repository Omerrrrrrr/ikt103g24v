import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../../services/firebaseConfig';
import Toast from 'react-native-toast-message';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [userProducts, setUserProducts] = useState([]);
  
  useEffect(() => {
    fetchUserStores();
    fetchUserProducts();
  }, []);

  useEffect(() => {
    if (selectedStoreId === 'all') {
      setProducts(userProducts);
    } else {
      const filtered = userProducts.filter(product => product.storeId === selectedStoreId);
      setProducts(filtered);
    }
  }, [selectedStoreId, userProducts]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setDisplayedProducts(products);
    } else {
      const filtered = products.filter(product => product.category === selectedCategory);
      setDisplayedProducts(filtered);
    }
  }, [selectedCategory, products]);

  const fetchUserStores = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('User not authenticated');
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'Please sign in to view your products'
        });
        router.push('/signin');
        return;
      }

      const storesQuery = query(
        collection(db, 'stores'),
        where('userId', '==', currentUser.uid)
      );
      
      const storesSnapshot = await getDocs(storesQuery);
      const storeList = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setStores(storeList);
      console.log(`Fetched ${storeList.length} stores owned by user`);
    } catch (error) {
      console.error('Error fetching stores:', error);
      Toast.show({
        type: 'error',
        text1: 'Error loading stores',
        text2: error.message
      });
    }
  };

  const fetchUserProducts = async () => {
    try {
      setLoading(true);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('User not authenticated');
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'Please sign in to view your products'
        });
        router.push('/signin');
        setLoading(false);
        return;
      }

      // Query all products owned by the current user
      const productsQuery = query(
        collection(db, 'products'),
        where('userId', '==', currentUser.uid)
      );

      const productsSnapshot = await getDocs(productsQuery);
      const productList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Extract unique categories from products
      const uniqueCategories = [...new Set(productList
        .map(product => product.category)
        .filter(Boolean))]; // Filter out undefined/null values
      
      setCategories(uniqueCategories);
      setUserProducts(productList);
      setProducts(productList);
      setDisplayedProducts(productList);
      console.log(`Fetched ${productList.length} products owned by user`);
    } catch (error) {
      console.error('Error fetching products:', error);
      Toast.show({
        type: 'error',
        text1: 'Error loading products',
        text2: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToProductDetail = (productId) => {
    router.push(`/product-detail?id=${productId}`);
  };

  const navigateToAddProduct = () => {
    router.push('/add-product');
  };

  const renderProduct = ({ item }) => {
    // Find store name for this product
    const store = stores.find(s => s.id === item.storeId);
    const storeName = store ? store.name : 'Unknown Store';
    
    return (
      <Pressable 
        style={styles.productCard} 
        onPress={() => navigateToProductDetail(item.id)}
      >
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="cube-outline" size={50} color="#ccc" />
            </View>
          )}
          
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name || 'Unnamed Product'}
          </Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>
              {item.price ? `$${parseFloat(item.price).toFixed(2)}` : 'No price'}
            </Text>
            
            {item.stock && (
              <View style={styles.stockContainer}>
                <Text style={styles.stockText}>
                  Stock: {item.stock}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.productFooter}>
            <View style={styles.storeContainer}>
              <Ionicons name="storefront-outline" size={14} color="#666" />
              <Text style={styles.storeText} numberOfLines={1}>
                {storeName}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/update-product?id=${item.id}`);
              }}
            >
              <Ionicons name="create-outline" size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Products Yet</Text>
      <Text style={styles.emptyText}>
        {stores.length > 0 
          ? "Your store is empty. Add your first product!" 
          : "Create a store first, then add products to it."}
      </Text>
      {stores.length > 0 ? (
        <TouchableOpacity 
          style={styles.addProductButton}
          onPress={navigateToAddProduct}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.addProductButtonText}>Add New Product</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.addProductButton}
          onPress={() => router.push('/create-store')}
          activeOpacity={0.7}
        >
          <Ionicons name="storefront" size={20} color="#fff" />
          <Text style={styles.addProductButtonText}>Create Store</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStoreFilter = () => (
    <View style={styles.storeFilter}>
      <Text style={styles.filterLabel}>Filter by store:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storeFilterScroll}
      >
        <TouchableOpacity
          style={[
            styles.storeFilterButton,
            selectedStoreId === 'all' && styles.selectedStoreFilter
          ]}
          onPress={() => setSelectedStoreId('all')}
        >
          <Text 
            style={[
              styles.storeFilterText,
              selectedStoreId === 'all' && styles.selectedStoreFilterText
            ]}
          >
            All Stores
          </Text>
        </TouchableOpacity>
        
        {stores.map(store => (
          <TouchableOpacity
            key={store.id}
            style={[
              styles.storeFilterButton,
              selectedStoreId === store.id && styles.selectedStoreFilter
            ]}
            onPress={() => setSelectedStoreId(store.id)}
          >
            <Text 
              style={[
                styles.storeFilterText,
                selectedStoreId === store.id && styles.selectedStoreFilterText
              ]}
            >
              {store.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCategoryFilter = () => {
    if (categories.length === 0) return null;
    
    return (
      <View style={styles.categoryFilterContainer}>
        <Text style={styles.filterTitle}>Categories</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollView}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && styles.selectedCategoryButton
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text 
              style={[
                styles.categoryButtonText,
                selectedCategory === 'all' && styles.selectedCategoryText
              ]}
            >
              All Categories
            </Text>
          </TouchableOpacity>
          
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text 
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.selectedCategoryText
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={navigateToAddProduct}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {stores.length > 0 && renderStoreFilter()}
      
      {categories.length > 0 && renderCategoryFilter()}
      
      {displayedProducts.length > 0 ? (
        <FlatList
          data={displayedProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyList()
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  storeFilter: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  storeFilterScroll: {
    paddingVertical: 4,
    paddingRight: 16,
  },
  storeFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  selectedStoreFilter: {
    backgroundColor: '#E3EFFD',
  },
  storeFilterText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedStoreFilterText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  productList: {
    padding: 8,
    paddingBottom: 80,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    maxWidth: '47%',
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  stockContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 12,
    color: '#666',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  storeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '80%',
  },
  storeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  editButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  addProductButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minHeight: 48,
  },
  addProductButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryFilterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  categoriesScrollView: {
    paddingBottom: 6,
    paddingTop: 2,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  selectedCategoryButton: {
    backgroundColor: '#E3EFFD',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#555',
  },
  selectedCategoryText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  productsList: {
    padding: 8,
    paddingBottom: 80,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});
