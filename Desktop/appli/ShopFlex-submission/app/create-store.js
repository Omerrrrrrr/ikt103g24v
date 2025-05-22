import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { ImageUpload } from '../components/ImageUpload';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

export default function CreateStore() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateStore = async () => {
        if (!name || !description) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all fields'
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
                text2: 'You must be logged in to create a store'
            });
            router.push('/signin');
            return;
        }
        
        setLoading(true);
        try {
            await addDoc(collection(db, 'stores'), {
                name,
                description,
                logoUrl,
                createdAt: new Date(),
                ownerId: user.uid,
                userId: user.uid
            });
            
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Store created successfully'
            });
            
            router.back();
        } catch (error) {
            console.error('Error creating store:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to create store'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Create New Store</Text>
                <Text style={styles.subtitle}>Set up your store presence with a logo and details</Text>
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
                    <Text style={styles.helperText}>Your logo will appear in store listings</Text>
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
                    onPress={handleCreateStore}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Ionicons name="add-circle-outline" size={18} color="#fff" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Create Store</Text>
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

