import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function ProductDetail() {
    const { id, name: initialName, price: initialPrice, description: initialDescription, imageUrl: initialImageUrl } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [name, setName] = useState(initialName);
    const [price, setPrice] = useState(initialPrice);
    const [description, setDescription] = useState(initialDescription);
    const [imageUrl, setImageUrl] = useState(initialImageUrl);
    const [productData, setProductData] = useState(null);

    useEffect(() => {
        // Fetch the full product data to verify ownership
        const fetchProduct = async () => {
            try {
                // Verify user is logged in
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    console.log('User not authenticated');
                    return;
                }

                const productDoc = await getDoc(doc(db, 'products', id));
                if (productDoc.exists()) {
                    const data = productDoc.data();
                    setProductData(data);
                    
                    // Update product details with the latest from the database
                    setName(data.name || initialName);
                    setPrice(data.price?.toString() || initialPrice);
                    setDescription(data.description || initialDescription);
                    setImageUrl(data.imageUrl || initialImageUrl);
                    
                    // Check if current user is the product owner
                    if (data.userId === currentUser.uid) {
                        setIsOwner(true);
                    } else {
                        console.log('User does not own this product');
                    }
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to load product details'
                });
            }
        };

        fetchProduct();
    }, [id]);

    const handleDelete = async () => {
        // Verify user is logged in
        const currentUser = auth.currentUser;
        if (!currentUser) {
            Toast.show({
                type: 'error',
                text1: 'Authentication Required',
                text2: 'You must be logged in to delete products'
            });
            router.push('/signin');
            return;
        }

        // Verify product ownership
        if (!isOwner) {
            Toast.show({
                type: 'error',
                text1: 'Permission Denied',
                text2: 'You can only delete your own products'
            });
            return;
        }

        setLoading(true);
        try {
            await deleteDoc(doc(db, 'products', id));
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Product deleted successfully'
            });
            router.back();
        } catch (error) {
            console.error('Error deleting product:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete product: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = () => {
        if (!isOwner) {
            Toast.show({
                type: 'error',
                text1: 'Permission Denied',
                text2: 'You can only update your own products'
            });
            return;
        }

        router.push({
            pathname: '/update-product',
            params: { id, name, price, description, imageUrl }
        });
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.imageContainer}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="image" size={50} color="#666" />
                    </View>
                )}
            </View>
            
            <View style={styles.details}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.price}>${price}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>

            {isOwner ? (
                <View style={styles.actions}>
                    <Pressable
                        style={[styles.button, styles.updateButton]}
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Update Product</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.button, styles.deleteButton]}
                        onPress={handleDelete}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Delete Product</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.notOwnerMessage}>
                    <Text style={styles.infoText}>
                        You are viewing this product as a customer.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    imageContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#f5f5f5',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    details: {
        padding: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    price: {
        fontSize: 20,
        color: '#007AFF',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    actions: {
        padding: 20,
        gap: 12,
    },
    button: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    updateButton: {
        backgroundColor: '#007AFF',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    notOwnerMessage: {
        padding: 20,
        alignItems: 'center',
    },
    infoText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
    },
}); 