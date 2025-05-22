import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity 
} from 'react-native';
import { router } from 'expo-router';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../../services/firebaseConfig';
import { ImageUpload } from '../../../components/ImageUpload';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

// Define standard categories to ensure consistency between seller and customer sides
const PRODUCT_CATEGORIES = [
  { label: 'Select Category', value: '' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Home', value: 'home' },
  { label: 'Food', value: 'food' },
  { label: 'Fashion', value: 'fashion' },
  { label: 'Beauty', value: 'beauty' }
];

// Get icon name for a category
const getCategoryIcon = (category) => {
  switch(category) {
    case 'electronics': return 'hardware-chip-outline';
    case 'home': return 'home-outline';
    case 'food': return 'restaurant-outline';
    case 'fashion': return 'shirt-outline';
    case 'beauty': return 'color-palette-outline';
    default: return 'pricetag-outline';
  }
};

export default function AddProduct() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedStoreName, setSelectedStoreName] = useState('');
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  
  useEffect(() => {
    fetchUserStores();
  }, []);

  const fetchUserStores = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('❌ User not authenticated');
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'Please sign in to add products'
        });
        router.push('/signin');
        return;
      }

      console.log('🔍 Fetching stores for user:', currentUser.uid);
      const storesQuery = query(
        collection(db, 'stores'),
        where('userId', '==', currentUser.uid)
      );
      
      const storesSnapshot = await getDocs(storesQuery);
      const storeList = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('📦 Fetched stores:', storeList);
      setStores(storeList);
      
      // Set the first store as default if any exists
      if (storeList.length > 0) {
        const firstStore = storeList[0];
        setSelectedStoreId(firstStore.id);
        setSelectedStoreName(firstStore.name || firstStore.storeName || 'Unnamed Store');
        console.log('✅ Set default store:', {
          id: firstStore.id,
          name: firstStore.name || firstStore.storeName
        });
      }
    } catch (error) {
      console.error('❌ Error fetching stores:', error);
      Toast.show({
        type: 'error',
        text1: 'Error loading stores',
        text2: error.message
      });
    }
  };

  const handleAddProduct = async () => {
    try {
      console.log('🧪 Selected Store ID:', selectedStoreId);
      console.log('📦 Stores array:', stores);

      const selectedStore = stores?.find((store) => store.id === selectedStoreId);
      console.log('🏪 Selected Store Object:', selectedStore);

      const storeName = selectedStore?.name ?? selectedStore?.storeName ?? 'Unnamed Store';
      console.log('🔍 Final Store Name:', storeName, '| Type:', typeof storeName);

      // Validate all required fields
      if (!name || !price || !description || !selectedStoreId || !category) {
        console.log('❌ Missing fields', {
          name,
          price,
          description,
          selectedStoreId,
          category
        });
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please fill in all product details'
        });
        return;
      }

      setLoading(true);

      const productData = {
        name: name.trim(),
        price: parseFloat(price) || 0,
        description: description.trim(),
        category: category.toLowerCase(),
        storeId: selectedStoreId,
        storeName, // ✅ Always defined string
        createdAt: new Date(),
        userId: auth.currentUser.uid,
        imageUrl: imageUrl || null,
        stock: stock ? parseInt(stock, 10) : 0,
        status: 'active',
        updatedAt: new Date()
      };

      console.log('📤 Final productData:', productData);

      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('✅ Product saved to Firestore!');
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Product added successfully'
      });
      
      // Reset form
      setName('');
      setPrice('');
      setDescription('');
      setCategory('');
      setStock('');
      setImageUrl('');
      
      // Navigate to products list
      router.push('/(tabs)/products');
    } catch (error) {
      console.error('❌ Firestore Save Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add product: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a function to handle category selection
  const selectCategory = (value) => {
    setCategory(value);
    setShowCategoryPicker(false);
  };

  if (stores.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="storefront-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No Stores Yet</Text>
        <Text style={styles.emptyText}>
          You need to create a store before adding products
        </Text>
        <TouchableOpacity 
          style={styles.createStoreButton}
          onPress={() => router.push('/create-store')}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.createStoreText}>Create Store</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Product</Text>
      
      <View style={styles.formContainer}>
        <View style={styles.storeSelector}>
          <Text style={styles.sectionTitle}>Select Store</Text>
          <Pressable
            style={styles.storeSelectorButton}
            onPress={() => setShowStoreSelector(!showStoreSelector)}
          >
            <Text style={styles.selectedStoreText}>
              {selectedStoreName || "Select a store"}
            </Text>
            <Ionicons 
              name={showStoreSelector ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </Pressable>
          
          {showStoreSelector && (
            <View style={styles.storeDropdown}>
              {stores.map(store => (
                <Pressable
                  key={store.id}
                  style={styles.storeOption}
                  onPress={() => {
                    setSelectedStoreId(store.id);
                    setSelectedStoreName(store.name || store.storeName || 'Unnamed Store');
                    setShowStoreSelector(false);
                  }}
                >
                  <Text style={[
                    styles.storeOptionText,
                    selectedStoreId === store.id && styles.selectedStoreOptionText
                  ]}>
                    {store.name || store.storeName || 'Unnamed Store'}
                  </Text>
                  {selectedStoreId === store.id && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Product Image</Text>
          <View style={styles.imageUploadContainer}>
            <ImageUpload 
              onImageSelected={setImageUrl} 
              size={120} 
              shape="rounded"
              initialImageUrl={imageUrl}
              label="Product Photo"
              uploadType="product"
            />
            <Text style={styles.imageHelperText}>
              Tap to upload a product image
            </Text>
          </View>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Stock</Text>
              <TextInput
                style={styles.input}
                placeholder="Quantity"
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <Pressable
              style={styles.categorySelector}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <View style={styles.categorySelectorContent}>
                {category ? (
                  <Ionicons 
                    name={getCategoryIcon(category)} 
                    size={20} 
                    color="#007AFF" 
                    style={styles.categoryIcon} 
                  />
                ) : (
                  <Ionicons 
                    name="pricetag-outline" 
                    size={20} 
                    color="#999" 
                    style={styles.categoryIcon} 
                  />
                )}
                <Text style={category ? styles.categorySelected : styles.categoryPlaceholder}>
                  {category ? PRODUCT_CATEGORIES.find(cat => cat.value === category)?.label : 'Select Category'}
                </Text>
              </View>
              <Ionicons 
                name={showCategoryPicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </Pressable>
            
            {showCategoryPicker && (
              <View style={styles.categoryDropdown}>
                {PRODUCT_CATEGORIES.filter(cat => cat.value !== '').map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={styles.categoryOption}
                    onPress={() => selectCategory(cat.value)}
                  >
                    <View style={styles.categoryOptionContent}>
                      <Ionicons 
                        name={getCategoryIcon(cat.value)} 
                        size={20} 
                        color={cat.value === category ? "#007AFF" : "#666"} 
                        style={styles.categoryIcon} 
                      />
                      <Text style={[
                        styles.categoryOptionText,
                        cat.value === category && styles.categoryOptionSelected
                      ]}>
                        {cat.label}
                      </Text>
                    </View>
                    {cat.value === category && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your product..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
        
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAddProduct}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Add Product</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 16,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  storeSelector: {
    marginBottom: 16,
    position: 'relative',
  },
  storeSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
  },
  selectedStoreText: {
    fontSize: 16,
    color: '#333',
  },
  storeDropdown: {
    position: 'absolute',
    top: 86,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storeOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedStoreOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  imageSection: {
    marginBottom: 16,
  },
  imageUploadContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  imageHelperText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
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
  createStoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  categorySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  categorySelected: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  categoryIcon: {
    marginRight: 10,
  },
  categoryDropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
  },
  categoryOptionSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
}); 