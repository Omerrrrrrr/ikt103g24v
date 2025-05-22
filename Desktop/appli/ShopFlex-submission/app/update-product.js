import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { ImageUpload } from '../components/ImageUpload';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

export default function UpdateProduct() {
    const { id, name: initialName, price: initialPrice, description: initialDescription, imageUrl: initialImageUrl } = useLocalSearchParams();
    const [name, setName] = useState(initialName);
    const [price, setPrice] = useState(initialPrice);
    const [description, setDescription] = useState(initialDescription);
    const [imageUrl, setImageUrl] = useState(initialImageUrl);
    const [loading, setLoading] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);

    const handleUpdate = async () => {
        if (!name || !price || !description) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all fields'
            });
            return;
        }

        // Verify user is logged in
        const currentUser = auth.currentUser;
        if (!currentUser) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'You must be logged in to update products'
            });
            router.push('/signin');
            return;
        }

        setLoading(true);
        try {
            await updateDoc(doc(db, 'products', id), {
                name,
                price: parseFloat(price),
                description,
                imageUrl,
                updatedAt: new Date()
            });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Product updated successfully'
            });
            router.back();
        } catch (error) {
            console.error('Error updating product:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update product'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelected = (url) => {
        setImageUrl(url);
        setShowImageUpload(false);
    };

    const toggleImageUpload = () => {
        setShowImageUpload(!showImageUpload);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.imageSection}>
                <View style={styles.imageContainer}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.image} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="image-outline" size={50} color="#666" />
                            <Text style={styles.placeholderText}>No image</Text>
                        </View>
                    )}
                </View>
                
                {showImageUpload ? (
                    <View style={styles.uploadContainer}>
                        <ImageUpload onImageSelected={handleImageSelected} size={100} />
                        <Text style={styles.uploadText}>Tap to select an image</Text>
                    </View>
                ) : (
                    <TouchableOpacity 
                        style={styles.changeImageButton} 
                        onPress={toggleImageUpload}
                    >
                        <Ionicons name="camera" size={16} color="#fff" />
                        <Text style={styles.changeImageText}>
                            {imageUrl ? 'Change Image' : 'Add Image'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Product Name"
                    value={name}
                    onChangeText={setName}
                />
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
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Updating...' : 'Update Product'}
                    </Text>
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
    imageSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    imageContainer: {
        width: '80%',
        height: 200,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
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
    placeholderText: {
        marginTop: 10,
        color: '#666',
    },
    uploadContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    uploadText: {
        marginTop: 8,
        color: '#666',
        fontSize: 14,
    },
    changeImageButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    changeImageText: {
        color: '#fff',
        marginLeft: 5,
        fontWeight: '500',
    },
    form: {
        padding: 20,
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
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
}); 