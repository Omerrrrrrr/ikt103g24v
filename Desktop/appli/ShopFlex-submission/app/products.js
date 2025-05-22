import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Image } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';

export default function ProductsRedirect() {
    // Redirect to the proper location in the tabs structure
    return <Redirect href="/(tabs)/products" />;
}

export function ProductList() {
    const [products, setProducts] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchProducts = async () => {
            const querySnapshot = await getDocs(collection(db, 'products'));
            const productData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setProducts(productData);
        };

        fetchProducts();
    }, []);

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.item}
                        onPress={() => router.push({
                            pathname: '/product-detail',
                            params: {
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                description: item.description,
                                imageUrl: item.imageUrl
                            }
                        })}
                    >
                        <View style={styles.imageContainer}>
                            {item.imageUrl ? (
                                <Image source={{ uri: item.imageUrl }} style={styles.image} />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Ionicons name="image" size={40} color="#666" />
                                </View>
                            )}
                        </View>
                        <View style={styles.details}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.price}>${parseFloat(item.price).toFixed(2)}</Text>
                        </View>
                    </Pressable>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    item: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    details: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    price: {
        fontSize: 14,
        color: '#007AFF',
    },
}); 