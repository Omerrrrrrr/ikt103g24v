import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export default function StoreListScreen() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'stores'));
        const storeList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStores(storeList);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (stores.length === 0) {
    return (
        <View style={styles.container}>
          <Text style={styles.title}>All Shops</Text>
          <Text>No stores found. Add a store first!</Text>
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <Text style={styles.title}>All Shops</Text>
        <FlatList
            data={stores}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View style={styles.storeCard}>
                  <Text style={styles.name}>{item.storeName || item.name}</Text>
                  <Text style={styles.contact}>{item.contact || 'No contact provided'}</Text>
                  <Text>{item.description || 'No description provided'}</Text>
                </View>
            )}
        />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  storeCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contact: {
    color: '#666',
    marginBottom: 6,
  },
});
