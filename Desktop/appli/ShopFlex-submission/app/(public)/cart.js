import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../services/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';

export default function CartScreen() {
  const { cartItems, setCartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  // Get cart total
  const cartTotal = getCartTotal();

  // Group cart items by store
  const itemsByStore = cartItems.reduce((stores, item) => {
    const { storeId, storeName } = item;
    if (!stores[storeId]) {
      stores[storeId] = {
        storeId,
        storeName,
        items: []
      };
    }
    stores[storeId].items.push(item);
    return stores;
  }, {});

  const storeGroups = Object.values(itemsByStore);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setPlacingOrder(true);
      const storedCart = await AsyncStorage.getItem('cart');
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        // Fetch products details from Firestore for each cart item
        const cartWithDetails = await Promise.all(
          parsedCart.map(async (item) => {
            try {
              const productDoc = await getDoc(doc(db, 'products', item.productId));
              if (productDoc.exists()) {
                const productData = productDoc.data();
                return {
                  ...item,
                  productDetails: {
                    id: productDoc.id,
                    ...productData
                  }
                };
              } else {
                return { ...item, productDetails: { name: 'Product not found', price: 0 } };
              }
            } catch (err) {
              console.error('Error fetching product details:', err);
              return { ...item, productDetails: { name: 'Error loading product', price: 0 } };
            }
          })
        );

        setCartItems(cartWithDetails);
        calculateTotal(cartWithDetails);
      } else {
        setCartItems([]);
        setTotalPrice(0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load cart',
        text2: 'Please try again later'
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      return sum + (item.quantity * (item.productDetails?.price || 0));
    }, 0);
    setTotalPrice(total);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Cart is empty',
        text2: 'Add products to your cart first'
      });
      return;
    }

    setPlacingOrder(true);

    try {
      // Create an order for each store
      const orderPromises = storeGroups.map(async (group) => {
        const { storeId, items } = group;
        
        // Validate storeId
        if (!storeId) {
          console.error('⚠️ Missing storeId for order:', group);
          Toast.show({
            type: 'error',
            text1: 'Order Error',
            text2: 'Invalid store information'
          });
          return null;
        }
        
        // Calculate total for this store's items
        const storeTotal = items.reduce((total, item) => {
          return total + ((item.productDetails?.price || 0) * (item.quantity || 1));
        }, 0);
        
        // Validate items
        const validItems = items.map(item => ({
          productId: item.productId || 'unknown',
          name: item.productDetails?.name || 'Product',
          price: parseFloat(item.productDetails?.price || 0),
          quantity: item.quantity || 1,
          imageUrl: item.productDetails?.imageUrl || null,
        }));
        
        // Create the order object with validated data
        const order = {
          storeId,
          items: validItems,
          total: storeTotal,
          userId: auth.currentUser?.uid || null,
          userEmail: auth.currentUser?.email || 'anonymous',
          createdAt: serverTimestamp(),
          status: 'placed'
        };
        
        // Log order data before submission
        console.log('Creating order with:', {
          storeId,
          itemsCount: validItems.length,
          total: storeTotal,
          userId: auth.currentUser?.uid || null
        });
        
        // Final validation check
        if (!storeId || !Array.isArray(validItems) || storeTotal === undefined) {
          console.error('🔥 Invalid order data, aborting save');
          return null;
        }
        
        // Save to Firestore
        const orderRef = await addDoc(collection(db, 'orders'), order);
        return orderRef.id;
      });
      
      // Wait for all orders to be created, filtering out any null results
      const orderResults = await Promise.all(orderPromises);
      const validOrders = orderResults.filter(id => id !== null);
      
      if (validOrders.length > 0) {
        // Clear the cart
        clearCart();
        
        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Order Placed Successfully',
          text2: 'Thank you for your order!'
        });
        
        // Navigate back to the main page using our reliable function
        goToMainPage();
      } else {
        throw new Error('No valid orders were created');
      }
      
    } catch (error) {
      console.error('Error placing order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to place order. Please try again.'
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  const increaseQuantity = (productId, currentQuantity) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const decreaseQuantity = (productId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    } else {
      removeFromCart(productId);
    }
  };

  // Handle navigation back to main page
  const goToMainPage = () => {
    // Use push instead of navigate for better compatibility
    router.push("/(public)/");
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.productImageContainer}>
        {item.productDetails?.imageUrl ? (
          <Image source={{ uri: item.productDetails.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={30} color="#ccc" />
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <View>
          <Text style={styles.productName}>{item.productDetails?.name || 'Product'}</Text>
          <Text style={styles.storeIndicator}>
            <Ionicons name="storefront-outline" size={12} color="#666" style={styles.storeIcon} />
            {item.storeName || 'Unknown Store'}
          </Text>
          <Text style={styles.productPrice}>${parseFloat(item.productDetails?.price || 0).toFixed(2)}</Text>
        </View>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => decreaseQuantity(item.productId, item.quantity)}
            disabled={item.quantity <= 1}
          >
            <Ionicons name="remove" size={18} color={item.quantity <= 1 ? "#ccc" : "#007AFF"} />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => increaseQuantity(item.productId, item.quantity)}
          >
            <Ionicons name="add" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.itemTotalContainer}>
        <Text style={styles.itemTotalLabel}>Total</Text>
        <Text style={styles.itemTotalPrice}>
          ${parseFloat((item.productDetails?.price || 0) * item.quantity).toFixed(2)}
        </Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(item.productId)}
        >
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStoreGroup = ({ item }) => (
    <View style={styles.storeGroup}>
      <View style={styles.storeHeader}>
        <Ionicons name="storefront" size={20} color="#555" />
        <Text style={styles.storeName}>{item.storeName}</Text>
      </View>
      <FlatList
        data={item.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.productId}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />
    </View>
  );

  const EmptyCart = () => (
    <View style={styles.emptyCart}>
      <Ionicons name="cart-outline" size={80} color="#ccc" />
      <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
      <Text style={styles.emptyCartText}>Add items to your cart to see them here</Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={goToMainPage}
      >
        <Text style={styles.browseButtonText}>Browse Stores</Text>
      </TouchableOpacity>
    </View>
  );

  if (placingOrder) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Placing order...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goToMainPage}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearCart}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={storeGroups}
        renderItem={renderStoreGroup}
        keyExtractor={(item) => item.storeId}
        contentContainerStyle={styles.cartList}
        ListFooterComponent={
          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryTitle}>Order Summary</Text>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>$0.00</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryItem}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={handlePlaceOrder}
              disabled={placingOrder}
            >
              {placingOrder ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.placeOrderButtonText}>Place Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  cartList: {
    padding: 16,
    paddingBottom: 40,
  },
  storeGroup: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  storeIndicator: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    marginRight: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 25,
    textAlign: 'center',
  },
  itemTotalContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },
  itemTotalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  removeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  placeOrderButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  placeOrderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
}); 