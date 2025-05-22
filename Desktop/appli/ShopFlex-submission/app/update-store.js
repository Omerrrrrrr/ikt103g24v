import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { ImageUpload } from '../components/ImageUpload';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

export default function UpdateStore() {
    const params = useLocalSearchParams();
    const { id } = params;
    
    const [name, setName] = useState(params.name || '');
    const [description, setDescription] = useState(params.description || '');
    const [logoUrl, setLogoUrl] = useState(params.logoUrl || '');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [storeData, setStoreData] = useState(null);

    useEffect(() => {
        const fetchStore = async () => {
            try {
                if (!id) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Store ID is missing'
                    });
                    router.back();
                    return;
                }

                // Verify user is logged in
                const user = auth.currentUser;
                if (!user) {
                    Toast.show({
                        type: 'error',
                        text1: 'Authentication Required',
                        text2: 'Please sign in to update store details'
                    });
                    router.push('/signin');
                    return;
                }
                
                // Get the store document
                const storeDoc = doc(db, 'stores', id);
                const storeSnap = await getDoc(storeDoc);
                
                if (storeSnap.exists()) {
                    const data = storeSnap.data();
                    
                    // Verify ownership
                    if (data.userId !== user.uid && data.ownerId !== user.uid) {
                        Toast.show({
                            type: 'error',
                            text1: 'Access Denied',
                            text2: 'You do not own this store'
                        });
                        router.back();
                        return;
                    }
                    
                    setStoreData(data);
                    setName(data.name || '');
                    setDescription(data.description || '');
                    setLogoUrl(data.logoUrl || '');
                } else {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Store not found'
                    });
                    router.back();
                }
            } catch (error) {
                console.error('Error fetching store:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to load store details'
                });
            } finally {
                setInitialLoading(false);
            }
        };

        fetchStore();
    }, [id]);

    const handleUpdateStore = async () => {
        if (!name || !description) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all required fields'
            });
            return;
        }

        // Check if user is logged in
        const user = auth.currentUser;
        if (!user) {
            console.error('User not logged in');
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'You must be logged in to update a store'
            });
            router.push('/signin');
            return;
        }
        
        setLoading(true);
        try {
            // Verify ownership again
            if (storeData && storeData.userId !== user.uid && storeData.ownerId !== user.uid) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'You do not have permission to edit this store'
                });
                setLoading(false);
                return;
            }

            const storeRef = doc(db, 'stores', id);
            await updateDoc(storeRef, {
                name,
                description,
                logoUrl,
                updatedAt: new Date()
            });
            
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Store updated successfully'
            });
            
            router.back();
        } catch (error) {
            console.error('Error updating store:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update store'
            });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading store details...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Update Store</Text>
                <Text style={styles.subtitle}>Edit your store details and logo</Text>
            </View>
            
            <View style={styles.imageSection}>
                <View style={styles.logoContainer}>
                    <ImageUpload 
                        onImageSelected={setLogoUrl} 
                        size={120}
                        shape="circle"
                        label="Store Logo"
                        initialImageUrl={logoUrl}
                        uploadType="storeLogo"
                    />
                    <Text style={styles.helperText}>Your logo appears in store listings</Text>
                </View>
            </View>

            <View style={styles.form}>
                <Text style={styles.sectionTitle}>Store Information</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Store Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter a catchy name for your store"
                        value={name}
                        onChangeText={setName}
                        maxLength={50}
                    />
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.descriptionInput]}
                        placeholder="Tell customers about your store and what you sell"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>{description.length}/500</Text>
                </View>

                <Pressable
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleUpdateStore}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={18} color="#fff" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Save Changes</Text>
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
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    imageSection: {
        padding: 20,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    form: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#444',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#eaeaea',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    descriptionInput: {
        height: 120,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 4,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
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
}); 