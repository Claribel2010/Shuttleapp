import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function RoleSelection() {
  const router = useRouter();

  const handleDriverPress = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to continue.');
      return;
    }

    try {
      const docRef = doc(db, 'shuttles', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        router.replace('/driver-dashboard');
      } else {
        router.replace('/driver/RegisterShuttle');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong checking your shuttle registration.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Replace with your app's logo or a relevant icon */}
        <Ionicons name="car-sport" size={60} color="#3478f6" />
        <Text style={styles.appTitle}>QuickShuttle</Text>
      </View>

      <Text style={styles.title}>How would you like to use the app?</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cardButton}
          onPress={() => router.replace('/user-dashboard')}
        >
          <Ionicons name="person-circle-outline" size={50} color="#3478f6" />
          <Text style={styles.cardButtonTitle}>I'm a User </Text>
          <Text style={styles.cardButtonSubtitle}>Find and track shuttles near you.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardButton}
          onPress={handleDriverPress}
        >
          <Ionicons name="car-outline" size={50} color="#34a853" />
          <Text style={styles.cardButtonTitle}>I'm a Driver</Text>
          <Text style={styles.cardButtonSubtitle}>Manage your shuttle and routes.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 40,
    color: '#555',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  cardButton: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 16,
    marginVertical: 10,
    width: '90%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardButtonTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 15,
    color: '#333',
  },
  cardButtonSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
    textAlign: 'center',
  },
});