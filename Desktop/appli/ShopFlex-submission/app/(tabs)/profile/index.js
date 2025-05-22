import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import Toast from 'react-native-toast-message';

export default function Profile() {
    const [user, setUser] = useState(null);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Check if user is logged in
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    console.error('User not logged in');
                    setLoading(false);
                    router.replace('/signin');
                    return;
                }

                // Determine the best display name to use
                let bestName = '';
                
                // Option 1: Use Firebase displayName if available
                if (currentUser.displayName) {
                    bestName = currentUser.displayName;
                } else {
                    // Option 2: Use email prefix as fallback
                    const email = currentUser.email || '';
                    bestName = email.split('@')[0];
                }
                
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUser(userDoc.data());
                    // Update bestName if we have a displayName in Firestore
                    if (userDoc.data().displayName) {
                        bestName = userDoc.data().displayName;
                    }
                }

                // Fetch user's stores
                const storesQuery = query(
                    collection(db, 'stores'),
                    where('ownerId', '==', currentUser.uid)
                );
                const storesSnapshot = await getDocs(storesQuery);
                const storesData = storesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setStores(storesData);
                
                // Option 3: If no displayName but user has a store, use store name
                if (!currentUser.displayName && storesData.length > 0) {
                    // Only override the email prefix if we're using it (no displayName found yet)
                    if (bestName === currentUser.email.split('@')[0]) {
                        bestName = storesData[0].name;
                    }
                }
                
                setDisplayName(bestName);
            } catch (error) {
                console.error('Error fetching user data:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to load user data'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.replace('/(public)/');
        } catch (error) {
            console.error('Error signing out:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to sign out'
            });
        }
    };

    const handleStorePress = (storeId) => {
        router.push({
            pathname: '/store-detail',
            params: { id: storeId }
        });
    };

    const handleCreateStore = () => {
        router.push('/create-store');
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileImageContainer}>
                    {user?.photoURL ? (
                        <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.profileImagePlaceholder}>
                            <Ionicons name="person" size={50} color="#666" />
                        </View>
                    )}
                </View>
                <Text style={styles.name}>{displayName || 'User'}</Text>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Stores</Text>
                {stores.length === 0 ? (
                    <Text style={styles.emptyText}>No stores yet</Text>
                ) : (
                    <View>
                        {stores.map(store => (
                            <Pressable
                                key={store.id}
                                style={styles.storeItem}
                                onPress={() => handleStorePress(store.id)}
                            >
                                <Text style={styles.storeName}>{store.name}</Text>
                                <Text style={styles.storeDescription} numberOfLines={2}>
                                    {store.description}
                                </Text>
                            </Pressable>
                        ))}
                        
                        {/* View Public Store Button */}
                        <Pressable
                            style={styles.viewPublicButton}
                            onPress={() => router.push(`/(public)/store/${stores[0].id}`)}
                        >
                            <Ionicons name="eye-outline" size={24} color="white" />
                            <Text style={styles.viewPublicButtonText}>View My Public Store</Text>
                        </Pressable>
                    </View>
                )}
                <Pressable
                    style={styles.addButton}
                    onPress={handleCreateStore}
                >
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.addButtonText}>Add New Store</Text>
                </Pressable>
            </View>

            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    profileImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        marginBottom: 16,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    profileImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: '#666',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    storeItem: {
        backgroundColor: '#f8f8f8',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    storeName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    storeDescription: {
        fontSize: 14,
        color: '#666',
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginVertical: 20,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    signOutButton: {
        margin: 20,
        padding: 16,
        backgroundColor: '#FF3B30',
        borderRadius: 8,
        alignItems: 'center',
    },
    signOutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    viewPublicButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#34C759',
        padding: 12,
        borderRadius: 8,
        marginVertical: 12,
    },
    viewPublicButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
}); 