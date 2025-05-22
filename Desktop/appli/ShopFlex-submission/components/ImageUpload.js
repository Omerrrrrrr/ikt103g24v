import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../services/firebaseConfig';
import Toast from 'react-native-toast-message';
import * as FileSystem from 'expo-file-system';

export function ImageUpload({ 
    onImageSelected, 
    size = 80, 
    initialImageUrl = null, 
    shape = "circle", 
    label = null,
    uploadType = "product" // New parameter to determine storage path
}) {
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(initialImageUrl);
    
    useEffect(() => {
        // Update image URL if initialImageUrl changes (e.g. when parent component updates)
        setImageUrl(initialImageUrl);
    }, [initialImageUrl]);

    const pickImage = async () => {
        setUploading(false);
        console.log("🔍 Starting image pick process");
        
        try {
            // Check if user is logged in first
            const user = auth.currentUser;
            console.log("👤 Auth check:", user ? `User logged in (${user.uid})` : "No user logged in");
            
            if (!user) {
                Toast.show({
                    type: 'error',
                    text1: 'Authentication Required',
                    text2: 'Please sign in to upload images'
                });
                return;
            }
            
            // Request permissions (in a simpler way)
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log("🔐 Permission status:", status);
            
            if (status !== 'granted') {
                Toast.show({
                    type: 'error',
                    text1: 'Permission denied',
                    text2: 'Please allow access to your photo library'
                });
                return;
            }
            
            // Use a simpler image picker configuration to avoid version issues
            console.log("📸 Launching image picker");
            const result = await ImagePicker.launchImageLibraryAsync({
                quality: 0.5,
                allowsEditing: true,
                mediaTypes: ImagePicker.MediaTypeOptions.Images
            });
            
            console.log("📱 Image picker result:", result.canceled ? "Canceled" : "Image selected");
            
            if (result.canceled) {
                return;
            }
            
            const imageUri = result.assets[0].uri;
            console.log("🖼️ Image URI:", imageUri);
            
            // Start upload process
            await uploadImageToFirebase(imageUri, user);
            
        } catch (error) {
            console.error("❌ Error in pickImage:", error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: `Failed to pick image: ${error.message || "Unknown error"}`
            });
        }
    };
    
    const uploadImageToFirebase = async (imageUri, user) => {
        console.log("🚀 Starting upload process");
        setUploading(true);
        
        try {
            if (!user || !auth.currentUser) {
                console.error("❌ User not logged in during upload");
                Toast.show({
                    type: 'error',
                    text1: 'Authentication Error',
                    text2: 'User session expired. Please sign in again.'
                });
                setUploading(false);
                return;
            }
            
            console.log("👤 User ID for upload:", user.uid);
            
            try {
                const fileInfo = await FileSystem.getInfoAsync(imageUri);
                console.log("📁 File size:", (fileInfo.size / 1024 / 1024).toFixed(2) + "MB");
                console.log("📁 File exists:", fileInfo.exists);
                console.log("📁 File URI:", fileInfo.uri);
                
                if (!fileInfo.exists) {
                    throw new Error("Selected file does not exist");
                }
            } catch (error) {
                console.error("❌ Error getting file info:", error);
                throw new Error("Failed to access image file: " + error.message);
            }
            
            console.log("🔄 Fetching image as blob");
            let blob;
            try {
                const response = await fetch(imageUri);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                blob = await response.blob();
                console.log("✅ Blob created successfully, size:", blob.size);
                console.log("✅ Blob type:", blob.type);
                
                if (blob.size === 0) {
                    throw new Error("Blob is empty");
                }
            } catch (blobError) {
                console.error("❌ Error creating blob:", blobError);
                throw new Error("Failed to create blob from image: " + blobError.message);
            }
            
            // Create a simpler storage path based on upload type
            const timestamp = Date.now();
            let storagePath;
            
            if (uploadType === "storeLogo") {
                storagePath = `store-logos/${user.uid}/logo-${timestamp}.jpg`;
            } else if (uploadType === "storeBanner") {
                storagePath = `store-banners/${user.uid}/banner-${timestamp}.jpg`;
            } else {
                storagePath = `products/${user.uid}/product-${timestamp}.jpg`;
            }
            
            console.log("📂 Upload path:", storagePath);
            
            // Create storage reference
            const storageRef = ref(storage, storagePath);
            console.log("🔗 Storage reference created:", storageRef.fullPath);
            
            Toast.show({
                type: 'info',
                text1: 'Uploading...',
                text2: 'Please wait while your image uploads'
            });
            
            // Try to upload with error payload logging
            try {
                console.log("⬆️ Starting uploadBytes with blob size:", blob.size);
                
                // Create metadata to ensure content type is correct
                const metadata = {
                    contentType: 'image/jpeg',
                };
                
                // Log the exact upload reference
                console.log("🔍 Storage ref full path:", storageRef.fullPath);
                console.log("🔍 Storage ref bucket:", storageRef.bucket);
                
                const uploadResult = await uploadBytes(storageRef, blob, metadata);
                console.log("✅ Upload successful:", uploadResult);
                
                const downloadURL = await getDownloadURL(storageRef);
                console.log("✅ Download URL received:", downloadURL);
                
                // Set the local state with the new URL
                setImageUrl(downloadURL);
                
                // Notify the parent component
                onImageSelected(downloadURL);
                
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Image uploaded successfully!'
                });
            } catch (uploadError) {
                console.error("❌ Storage error details:", uploadError.serverResponse || "No server response");
                console.error("❌ Storage error status:", uploadError.status_ || "No status");
                console.error("❌ Storage error name:", uploadError.name);
                console.error("❌ Storage error code:", uploadError.code);
                console.error("❌ Storage error message:", uploadError.message);
                console.error("❌ Storage error stack:", uploadError.stack);
                
                // Show a more helpful error message based on the failure
                let errorMessage = "Upload failed";
                if (uploadError.status_ === 404) {
                    errorMessage = "Storage bucket not found. Check Firebase configuration.";
                } else if (uploadError.code === "storage/unauthorized") {
                    errorMessage = "Not authorized to upload. Check Firebase rules.";
                } else if (uploadError.code === "storage/canceled") {
                    errorMessage = "Upload was canceled.";
                } else if (uploadError.code === "storage/retry-limit-exceeded") {
                    errorMessage = "Upload failed due to network issues. Please try again.";
                } else if (uploadError.code === "storage/invalid-argument") {
                    errorMessage = "Invalid image file.";
                } else {
                    errorMessage = `${uploadError.message || "Unknown error"}`;
                }
                
                Toast.show({
                    type: 'error',
                    text1: 'Upload Failed',
                    text2: errorMessage
                });
                
                throw uploadError; // Re-throw to be caught by outer catch
            }
            
        } catch (error) {
            console.error("❌ Error uploading image:", error);
            console.error("❌ Error code:", error.code);
            console.error("❌ Error message:", error.message);
            console.error("❌ Error details:", JSON.stringify(error, null, 2));
            
            let errorMessage = `Upload failed: ${error.message}`;
            
            if (error.code) {
                switch(error.code) {
                    case 'storage/unauthorized':
                        errorMessage = 'You do not have permission to upload';
                        break;
                    case 'storage/canceled':
                        errorMessage = 'Upload was canceled';
                        break;
                    case 'storage/retry-limit-exceeded':
                        errorMessage = 'Upload failed due to network issues';
                        break;
                    case 'storage/invalid-argument':
                        errorMessage = 'Invalid image file';
                        break;
                    default:
                        if (error.code.includes('storage/')) {
                            errorMessage = `Storage error: ${error.code}`;
                        }
                }
            }
            
            Toast.show({
                type: 'error',
                text1: 'Upload Failed',
                text2: errorMessage
            });
        } finally {
            setUploading(false);
            console.log("🏁 Upload process finished");
        }
    };

    // Determine border radius based on shape
    const getBorderRadius = () => {
        if (shape === "circle") {
            return size / 2;
        } else if (shape === "rounded") {
            return 12;
        }
        return 0; // square
    };

    return (
        <View style={styles.wrapper}>
            {label && <Text style={styles.label}>{label}</Text>}
            
            <Pressable 
                style={[
                    styles.container, 
                    { 
                        width: size, 
                        height: size, 
                        borderRadius: getBorderRadius() 
                    },
                    imageUrl ? styles.containerWithImage : styles.containerEmpty
                ]} 
                onPress={pickImage}
                disabled={uploading}
            >
                {uploading ? (
                    <ActivityIndicator color="#007AFF" size="large" />
                ) : imageUrl ? (
                    <>
                        <Image 
                            source={{ uri: imageUrl }} 
                            style={[
                                styles.image, 
                                { borderRadius: getBorderRadius() }
                            ]} 
                            resizeMode="cover"
                        />
                        <View style={styles.editIconContainer}>
                            <Ionicons name="create-outline" size={size * 0.25} color="#fff" />
                        </View>
                    </>
                ) : (
                    <>
                        <Ionicons name="camera" size={size * 0.4} color="#007AFF" />
                        <Text style={styles.uploadText}>Upload</Text>
                    </>
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8,
    },
    container: {
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    containerEmpty: {
        borderWidth: 2,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
    },
    containerWithImage: {
        borderWidth: 0,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0, 122, 255, 0.8)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        fontSize: 10,
        color: '#007AFF',
        marginTop: 4,
    },
});
