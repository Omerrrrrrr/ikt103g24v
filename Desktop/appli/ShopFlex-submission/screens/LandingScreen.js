import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { CATEGORIES, getCategoryLabel } from '../constants/categories';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const numColumns = 2;
const tileSize = width / numColumns - 24;

// Brand colors
const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  accent: '#FF2D55',
};

// Static image requires
const storeLogos = {
  europe: require('../assets/store-logos/boysofeurope.jpg'),
  elkjop: require('../assets/store-logos/elkjop.png'),
  placeholder: require('../assets/store-logos/placeholder-store.png'),
};

const getStoreImage = (store) => {
  const storeName = (store.name || store.storeName || '').toLowerCase();
  console.log('Store data:', {
    id: store.id,
    name: store.name,
    storeName: store.storeName,
    finalName: storeName
  });
  
  if (storeName.includes('europe')) return storeLogos.europe;
  if (storeName.includes('elkjop')) return storeLogos.elkjop;
  return storeLogos.placeholder;
};

// Promotional content
const PROMO_TILES = [
  {
    id: 'promo1',
    title: 'Sell More With ShopFlex',
    description: 'Create your store in minutes and start selling today',
    icon: 'trending-up',
  },
  {
    id: 'promo2',
    title: 'Easy Store Management',
    description: 'Manage your products and orders from anywhere',
    icon: 'storefront',
  },
  {
    id: 'promo3',
    title: 'Reach More Customers',
    description: 'Get discovered by shoppers looking for your products',
    icon: 'people',
  },
  {
    id: 'promo4',
    title: 'Start Your Journey',
    description: 'Join our growing community of successful sellers',
    icon: 'rocket',
  },
];

export default function LandingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    filterStores();
  }, [selectedCategory, searchQuery, stores]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const storesQuery = query(collection(db, 'stores'));
      const storesSnapshot = await getDocs(storesQuery);
      const storesList = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        storeName: doc.data().storeName || doc.data().name || 'Unnamed Store',
      }));
      
      // Log store data for debugging
      console.log('Fetched stores:', storesList.map(store => ({
        id: store.id,
        name: store.name,
        imageUrl: store.imageUrl,
        logoUrl: store.logoUrl
      })));
      
      setStores(storesList);
      setFilteredStores(storesList);
    } catch (error) {
      console.error('Error fetching stores:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load stores'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStores();
  };

  const filterStores = () => {
    let filtered = [...stores];
    
    if (selectedCategory) {
      filtered = filtered.filter(store => 
        store.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(store =>
        (store.storeName || store.name || '').toLowerCase().includes(query) ||
        store.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredStores(filtered);
  };

  const handleStorePress = (store) => {
    navigation.navigate('Product List', { store });
  };

  const handleSellerPress = () => {
    if (!isAuthenticated) {
      // Not authenticated, navigate to Sign In with callback
      navigation.navigate('Auth', {
        screen: 'Sign In',
        params: {
          onLoginSuccess: () => {
            // After successful login, navigate to Seller Dashboard
            navigation.navigate('Seller', {
              screen: 'Seller Dashboard'
            });
          }
        }
      });
      return;
    }

    // Only proceed if authenticated
    navigation.navigate('Seller', {
      screen: 'Seller Dashboard'
    });
  };

  const renderPromoTile = ({ item }) => (
    <View style={styles.promoTile}>
      <Ionicons name={item.icon} size={32} color={COLORS.primary} />
      <Text style={styles.promoTitle}>{item.title}</Text>
      <Text style={styles.promoDescription}>{item.description}</Text>
    </View>
  );

  const renderStoreItem = ({ item }) => (
    <TouchableOpacity
      style={styles.storeCard}
      onPress={() => handleStorePress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ 
          uri: item.logoUrl || item.imageUrl || 'https://via.placeholder.com/50'
        }}
        style={styles.storeImage}
        defaultSource={require('../assets/store-logos/placeholder-store.png')}
      />
      <View style={styles.storeInfo}>
        <Text style={styles.storeName} numberOfLines={1}>
          {item.storeName || item.name || 'Unnamed Store'}
        </Text>
        <View style={styles.storeMeta}>
          <Text style={styles.storeCategory} numberOfLines={1}>
            {getCategoryLabel(item.category || 'Uncategorized')}
          </Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        {item.description && (
          <Text style={styles.storeDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading stores...</Text>
        </View>
      );
    }

    // If no stores exist, show all promo tiles
    if (stores.length === 0) {
      return (
        <FlatList
          data={PROMO_TILES}
          renderItem={renderPromoTile}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          contentContainerStyle={styles.promoList}
        />
      );
    }

    // If stores exist, show stores and remaining promo tiles
    const remainingPromos = PROMO_TILES.slice(0, Math.max(0, 6 - filteredStores.length));
    const combinedData = [...filteredStores, ...remainingPromos];

    return (
      <FlatList
        data={combinedData}
        renderItem={({ item }) => 
          item.id?.startsWith('promo') 
            ? renderPromoTile({ item }) 
            : renderStoreItem({ item })
        }
        keyExtractor={item => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.storesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>
              {searchQuery || selectedCategory
                ? 'No stores match your search'
                : 'No stores found'}
            </Text>
            {(searchQuery || selectedCategory) && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stores..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textSecondary}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <Ionicons name="filter" size={20} color={COLORS.primary} />
          <Text style={styles.categoryButtonText}>
            {selectedCategory ? getCategoryLabel(selectedCategory) : 'All Categories'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome to ShopFlex</Text>
        <Text style={styles.welcomeText}>
          A modern marketplace for discovering stores and browsing products by category. 
          Find what you love, from fashion to electronics.
        </Text>
      </View>

      {renderContent()}

      <TouchableOpacity
        style={[
          styles.sellerButton,
          { top: insets.top + 10 }
        ]}
        onPress={handleSellerPress}
      >
        <Ionicons name="storefront" size={32} color={COLORS.primary} />
      </TouchableOpacity>

      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[
                styles.categoryItem,
                !selectedCategory && styles.selectedCategory
              ]}
              onPress={() => {
                setSelectedCategory('');
                setShowCategoryModal(false);
              }}
            >
              <Text style={[
                styles.categoryItemText,
                !selectedCategory && styles.selectedCategoryText
              ]}>
                All Categories
              </Text>
            </TouchableOpacity>
            
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryItem,
                  selectedCategory === category && styles.selectedCategory
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={[
                  styles.categoryItemText,
                  selectedCategory === category && styles.selectedCategoryText
                ]}>
                  {getCategoryLabel(category)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: COLORS.text,
  },
  clearButton: {
    padding: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
  },
  categoryButtonText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  welcomeContainer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
  storesList: {
    padding: 12,
  },
  storeCard: {
    width: tileSize,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  storeImage: {
    width: '100%',
    height: tileSize,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  storeInfo: {
    padding: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  storeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  storeCategory: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  storeDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sellerButton: {
    position: 'absolute',
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selectedCategory: {
    backgroundColor: '#e3f2fd',
  },
  categoryItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectedCategoryText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  promoTile: {
    width: tileSize,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    margin: 6,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  promoDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  promoList: {
    padding: 12,
  },
}); 