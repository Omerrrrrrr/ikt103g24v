import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, Redirect } from 'expo-router';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { ImageUpload } from '../components/ImageUpload';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

// Match the same categories used in the marketplace
// These EXACT categories will be used for filtering on the customer side
const PRODUCT_CATEGORIES = ['Food', 'Fashion', 'Electronics', 'Home', 'Beauty'];

// Style changes to make the dropdown visible
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    imageUploadContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    imageUploadText: {
        marginTop: 8,
        color: '#666',
    },
    form: {
        gap: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    descriptionInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    selectorInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    valuePlaceholder: {
        color: '#999',
    },
    valueSelected: {
        color: '#333',
    },
    dropdownMenu: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        zIndex: 1000, // Increase z-index to ensure visibility
        elevation: 5,  // Higher elevation for Android
        position: 'absolute', // Make it position absolutely
        top: 50,       // Position it below the selector
        left: 0,
        right: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    dropdownOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownOptionText: {
        fontSize: 16,
        color: '#333',
    },
    dropdownOptionSelected: {
        color: '#007AFF',
        fontWeight: '500',
    },
    noDataMessage: {
        padding: 16,
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    createStoreLink: {
        padding: 8,
    },
    createStoreLinkText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    dropdownOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryIcon: {
        marginRight: 8,
    },
    dropdownContainer: {
        position: 'relative',
        zIndex: 100,
        marginBottom: 20, // Add more margin to make room for dropdown
    },
});

// Move the getCategoryIcon function before it's used
const getCategoryIcon = (category) => {
    switch(category.toLowerCase()) {
        case 'food':
            return 'restaurant-outline';
        case 'fashion':
            return 'shirt-outline';
        case 'electronics':
            return 'hardware-chip-outline';
        case 'home':
            return 'home-outline';
        case 'beauty':
            return 'color-palette-outline';
        default:
            return 'pricetag-outline';
    }
};

export default function AddProduct() {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState('');
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Store selection
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [showStoresPicker, setShowStoresPicker] = useState(false);

    useEffect(() => {
        // Fetch user's stores on component mount
        fetchUserStores();
    }, []);

    const fetchUserStores = async () => {
        try {
            // Verify user is logged in
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Toast.show({
                    type: 'error',
                    text1: 'Authentication Required',
                    text2: 'Please sign in to add products'
                });
                router.push('/signin');
                return;
            }

            // Fetch stores owned by the current user
            const storesQuery = query(
                collection(db, 'stores'),
                where('userId', '==', currentUser.uid)
            );
            
            const storesSnapshot = await getDocs(storesQuery);
            const storesList = storesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setStores(storesList);
            
            // Set first store as default if any exists
            if (storesList.length > 0) {
                setSelectedStore(storesList[0]);
            }
            
            console.log(`Fetched ${storesList.length} stores for the current user`);
        } catch (error) {
            console.error('Error fetching stores:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load your stores'
            });
        }
    };

    const handleAddProduct = async () => {
        if (!name || !price || !description) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all required fields'
            });
            return;
        }

        if (!category) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please select a product category'
            });
            return;
        }

        if (!selectedStore) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please select a store for this product'
            });
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'products'), {
                name,
                price: parseFloat(price),
                description,
                imageUrl,
                category, // Add the category to the product data
                createdAt: new Date(),
                userId: auth.currentUser?.uid,
                storeId: selectedStore.id, // Add store ID to link product to store
                storeName: selectedStore.name // Add store name for convenience
            });
            
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Product added successfully'
            });
            
            // Reset form
            setName('');
            setPrice('');
            setDescription('');
            setImageUrl('');
            setCategory('');
            
            // Navigate to products list
            router.push('/products');
        } catch (error) {
            console.error('Error adding product:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to add product'
            });
        } finally {
            setLoading(false);
        }
    };

    const selectCategory = (selectedCategory) => {
        setCategory(selectedCategory);
        setShowCategoryPicker(false);
    };

    const selectStore = (store) => {
        setSelectedStore(store);
        setShowStoresPicker(false);
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Add New Product</Text>
            
            <View style={styles.imageUploadContainer}>
                <ImageUpload onImageSelected={setImageUrl} />
                <Text style={styles.imageUploadText}>Tap to upload image</Text>
            </View>

            <View style={styles.form}>
                {/* Store Selector */}
                <Pressable 
                    style={[styles.input, styles.selectorInput]} 
                    onPress={() => setShowStoresPicker(!showStoresPicker)}
                >
                    <Text style={selectedStore ? styles.valueSelected : styles.valuePlaceholder}>
                        {selectedStore ? selectedStore.name : "Select Store"}
                    </Text>
                    <Ionicons 
                        name={showStoresPicker ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#999" 
                    />
                </Pressable>

                {/* Store Dropdown */}
                {showStoresPicker && (
                    <View style={styles.dropdownMenu}>
                        {stores.length > 0 ? (
                            stores.map((store) => (
                                <TouchableOpacity
                                    key={store.id}
                                    style={styles.dropdownOption}
                                    onPress={() => selectStore(store)}
                                >
                                    <Text style={[
                                        styles.dropdownOptionText,
                                        selectedStore?.id === store.id && styles.dropdownOptionSelected
                                    ]}>
                                        {store.name}
                                    </Text>
                                    {selectedStore?.id === store.id && (
                                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                                    )}
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.noDataMessage}>
                                <Text style={styles.noDataText}>
                                    You need to create a store first
                                </Text>
                                <TouchableOpacity
                                    style={styles.createStoreLink}
                                    onPress={() => router.push('/create-store')}
                                >
                                    <Text style={styles.createStoreLinkText}>
                                        Create a Store
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Product Name"
                    value={name}
                    onChangeText={setName}
                />

                {/* Category Selector - Make this a View with relative positioning */}
                <View style={styles.dropdownContainer}>
                    <Pressable 
                        style={[styles.input, styles.selectorInput]} 
                        onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                    >
                        <Text style={category ? styles.valueSelected : styles.valuePlaceholder}>
                            {category || "Select Category"}
                        </Text>
                        <Ionicons 
                            name={showCategoryPicker ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#999" 
                        />
                    </Pressable>

                    {/* Make sure dropdown appears */}
                    {showCategoryPicker && (
                        <View style={styles.dropdownMenu}>
                            {PRODUCT_CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={styles.dropdownOption}
                                    onPress={() => selectCategory(cat)}
                                >
                                    <View style={styles.dropdownOptionContent}>
                                        <Ionicons 
                                            name={getCategoryIcon(cat)} 
                                            size={18} 
                                            color={cat === category ? "#007AFF" : "#666"} 
                                            style={styles.categoryIcon}
                                        />
                                        <Text style={[
                                            styles.dropdownOptionText,
                                            cat === category && styles.dropdownOptionSelected
                                        ]}>
                                            {cat}
                                        </Text>
                                    </View>
                                    {cat === category && (
                                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Price"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                />
                <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    placeholder="Description"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />

                <Pressable
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleAddProduct}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Adding...' : 'Add Product'}
                    </Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

export function AddProductRedirect() {
    // Redirect to the proper location in the tabs structure
    return <Redirect href="/(tabs)/add-product" />;
} 