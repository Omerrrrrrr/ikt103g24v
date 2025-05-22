import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function StoreDetailRedirect() {
    const { id } = useLocalSearchParams();
    return <Redirect href={`/(public)/store/${id}`} />;
}

export function StoreDetail() {
    const { id } = useLocalSearchParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const fetchStoreAndProducts = async () => {
            try {
                // Safe way to check if user is logged in
                const currentUser = auth.currentUser;
                
                // Fetch store data
                const storeRef = doc(db, 'stores', id);
                const storeSnap = await getDoc(storeRef);
                
                if (storeSnap.exists()) {
                    const storeData = { id: storeSnap.id, ...storeSnap.data() };
                    setStore(storeData);
                    
                    // Check if current user is the store owner - only if user is logged in
                    if (currentUser && storeData.userId && currentUser.uid === storeData.userId) {
                        setIsOwner(true);
                    }
                    
                    // Fetch products for this store
                    const q = query(collection(db, 'products'), where('storeId', '==', id));
                    const querySnapshot = await getDocs(q);
                    
                    const productList = [];
                    querySnapshot.forEach((doc) => {
                        productList.push({ id: doc.id, ...doc.data() });
                    });
                    
                    setProducts(productList);
                } else {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Store not found'
                    });
                }
            } catch (error) {
                console.error('Error fetching store data:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to load store data: ' + (error.message || error)
                });
            } finally {
                setLoading(false);
            }
        };
        
        fetchStoreAndProducts();
    }, [id]);

    const handleEditStore = () => {
        router.push({
            pathname: '/update-store',
            params: { 
                id: store.id,
                name: store.name, 
                description: store.description,
                imageUrl: store.imageUrl,
                logoUrl: store.logoUrl || ''
            }
        });
    };

    const handleAddProduct = () => {
        router.push({
            pathname: '/add-product',
            params: { storeId: id }
        });
    };

    const handleProductPress = (product) => {
        router.push({
            pathname: '/product-detail',
            params: { 
                id: product.id,
                name: product.name,
                price: product.price,
                description: product.description,
                storeId: product.storeId,
                imageUrl: product.imageUrl 
            }
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading store details...</Text>
            </View>
        );
    }

    if (!store) {
        return (
            <View style={styles.errorContainer}>
                <Text>Store not found</Text>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Store Header */}
            <View style={styles.storeHeader}>
                {store.imageUrl ? (
                    <Image 
                        source={{ uri: store.imageUrl }} 
                        style={styles.storeImage} 
                    />
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Ionicons name="storefront-outline" size={60} color="#ccc" />
                    </View>
                )}
                
                <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    <Text style={styles.storeDescription}>{store.description}</Text>
                </View>
                
                {isOwner && (
                    <View style={styles.ownerActions}>
                        <Pressable style={styles.actionButton} onPress={handleEditStore}>
                            <Text style={styles.actionButtonText}>Edit Store</Text>
                        </Pressable>
                        
                        <Pressable style={styles.actionButton} onPress={handleAddProduct}>
                            <Text style={styles.actionButtonText}>Add Product</Text>
                        </Pressable>
                    </View>
                )}
            </View>
            
            {/* Products Section */}
            <View style={styles.productsSection}>
                <Text style={styles.sectionTitle}>Products</Text>
                
                {products.length === 0 ? (
                    <Text style={styles.noProducts}>No products available</Text>
                ) : (
                    <FlatList
                        data={products}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <Pressable 
                                style={styles.productItem} 
                                onPress={() => handleProductPress(item)}
                            >
                                {item.imageUrl ? (
                                    <Image 
                                        source={{ uri: item.imageUrl }} 
                                        style={styles.productImage} 
                                    />
                                ) : (
                                    <View style={styles.productImagePlaceholder}>
                                        <Ionicons name="image-outline" size={30} color="#ccc" />
                                    </View>
                                )}
                                
                                <View style={styles.productDetails}>
                                    <Text style={styles.productName}>{item.name}</Text>
                                    <Text style={styles.productPrice}>${parseFloat(item.price).toFixed(2)}</Text>
                                </View>
                            </Pressable>
                        )}
                    />
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#4a80f5',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    storeHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    storeImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 15,
    },
    placeholderContainer: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    storeInfo: {
        marginBottom: 15,
    },
    storeName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    storeDescription: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
    },
    ownerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#4a80f5',
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    productsSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    noProducts: {
        textAlign: 'center',
        color: '#666',
        padding: 20,
    },
    productItem: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    productImagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productDetails: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },
    productPrice: {
        fontSize: 14,
        color: '#4a80f5',
        fontWeight: '500',
    },
}); 