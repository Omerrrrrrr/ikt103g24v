import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  ActivityIndicator, 
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Array of beautiful gradient color pairs for store cards
const CARD_GRADIENTS = [
  ['#FF9966', '#FF5E62'],
  ['#56CCF2', '#2F80ED'],
  ['#4776E6', '#8E54E9'],
  ['#00B09B', '#96C93D'],
  ['#FDC830', '#F37335'],
  ['#667EEA', '#764BA2'],
  ['#FF416C', '#FF4B2B'],
  ['#7F7FD5', '#91EAE4'],
];

// Store categories for filter chips
const STORE_CATEGORIES = ['All', 'Food', 'Fashion', 'Electronics', 'Home', 'Beauty'];

const MarketplaceHome = () => {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { width } = useWindowDimensions();
  
  // Determine grid columns based on screen width
  const numColumns = width > 768 ? 3 : width > 480 ? 2 : 1;
  const cardWidth = (width - 48) / numColumns; // Account for padding

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    filterStores();
  }, [stores, searchQuery, selectedCategory]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const storesCollection = collection(db, 'stores');
      const storesSnapshot = await getDocs(storesCollection);
      
      const storesList = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Fetched ${storesList.length} stores`);
      setStores(storesList);
      setFilteredStores(storesList);
    } catch (error) {
      console.error('Error fetching stores:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load stores. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStores = () => {
    let filtered = [...stores];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(store => 
        store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(store => 
        store.category === selectedCategory
      );
    }
    
    setFilteredStores(filtered);
  };

  const navigateToStore = (storeId) => {
    router.replace({
      pathname: "/(public)/store/[id]",
      params: { id: storeId }
    });
  };

  const navigateToSellerDashboard = () => {
    router.replace("/(tabs)");
  };

  const navigateToCart = () => {
    router.push("/(public)/cart");
  };

  // Assign a consistent gradient to each store based on its index
  const getGradientColors = (index) => {
    return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  };

  const renderCategoryChip = (category) => (
    <TouchableOpacity 
      key={category}
      style={[
        styles.categoryChip, 
        selectedCategory === category && styles.selectedCategoryChip
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text 
        style={[
          styles.categoryChipText, 
          selectedCategory === category && styles.selectedCategoryChipText
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  const renderStore = ({ item, index }) => {
    const gradientColors = getGradientColors(index);
    const storeName = item.name || "Unnamed Store";
    
    return (
      <TouchableOpacity 
        style={[styles.storeCard, { width: cardWidth - 16 }]} 
        onPress={() => navigateToStore(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.storeImageContainer}>
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.storeImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={gradientColors}
              style={styles.gradientBackground}
            >
              <Ionicons name="storefront" size={48} color="rgba(255,255,255,0.9)" />
              <Text style={styles.storeInitial}>
                {storeName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          
          {/* Store badge */}
          <View style={styles.storeBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
          </View>
          
          {/* Store logo (circular) */}
          {item.logoUrl && (
            <View style={styles.storeLogoWrapper}>
              <Image 
                source={{ uri: item.logoUrl }} 
                style={styles.storeLogo}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
        
        <View style={styles.storeInfo}>
          <Text style={styles.storeName} numberOfLines={1}>{storeName}</Text>
          <Text style={styles.storeDescription} numberOfLines={2}>
            {item.description || 'No description available'}
          </Text>
          
          <View style={styles.storeFooter}>
            <View style={styles.productCount}>
              <Ionicons name="cart-outline" size={14} color="#666" />
              <Text style={styles.productCountText}>View Products</Text>
            </View>
            <Text style={styles.viewStoreText}>View Store →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Discovering stores...</Text>
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="storefront-outline" size={80} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No stores found</Text>
      {searchQuery || selectedCategory !== 'All' ? (
        <Text style={styles.emptyStateDescription}>
          Try a different search or category filter
        </Text>
      ) : (
        <Text style={styles.emptyStateDescription}>
          Be the first to create a store on ShopFlex!
        </Text>
      )}
      <TouchableOpacity 
        style={styles.becomeSeller}
        onPress={navigateToSellerDashboard}
      >
        <Text style={styles.becomeSellerText}>Become a Seller</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* App Header */}
      <View style={styles.header}>
        {/* Logo and Actions Row */}
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.sellerButton}
            onPress={navigateToSellerDashboard}
          >
            <Text style={styles.sellerButtonText}>I'm a Seller</Text>
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ShopFlex</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={navigateToCart}
          >
            <Ionicons name="cart-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stores..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFiltersContainer}
        >
          {STORE_CATEGORIES.map(renderCategoryChip)}
        </ScrollView>
      </View>
      
      {/* Content: Stores or Empty State */}
      {filteredStores.length > 0 ? (
        <FlatList
          data={filteredStores}
          renderItem={renderStore}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns} // Force re-render when columns change
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={numColumns > 1 ? styles.row : null}
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 0.5,
  },
  sellerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    minHeight: 32,
  },
  sellerButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  cartButton: {
    padding: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
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
    color: '#333',
  },
  categoryFiltersContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#007bff',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryChipText: {
    color: '#fff',
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingBottom: 60,
  },
  row: {
    justifyContent: 'space-between',
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storeImageContainer: {
    height: 160,
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInitial: {
    position: 'absolute',
    fontSize: 36,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
  },
  storeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#34C759',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeLogoWrapper: {
    position: 'absolute',
    bottom: -20,
    right: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  storeInfo: {
    padding: 16,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  storeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  storeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  productCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productCountText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  viewStoreText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    maxWidth: 280,
  },
  becomeSeller: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  becomeSellerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MarketplaceHome; 