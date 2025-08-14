// app/profile/index.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    (async () => {
      try {
        const storedRole = await AsyncStorage.getItem('role');
        const storedName = await AsyncStorage.getItem('name');

        if (storedRole) setRole(storedRole);
        if (storedName) setName(storedName);

        if (!storedName) {
          if (user?.displayName) {
            setName(user.displayName);
          } else if (user?.uid) {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const d = docSnap.data();
              if (d?.name) setName(d.name);
            }
          }
        }

        setEmail(user?.email ?? '');

        if (!storedRole && user?.uid) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const d = docSnap.data();
            if (d?.role) setRole(d.role);
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    })();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            await AsyncStorage.removeItem('role');
            await AsyncStorage.removeItem('name');
            router.replace('/login');
          } catch (err) {
            console.error('Sign out error', err);
            Alert.alert('Error', 'Failed to sign out. Try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#e6e9f0" />
      </TouchableOpacity>

      <View style={styles.profileCard}>
        <Image
          source={require('../../assets/images/avatar-placeholder.png')}
          style={styles.avatar}
        />
        <Text style={styles.name}>{name || 'No name'}</Text>
        <Text style={styles.email}>{email || user?.email || 'No email'}</Text>
        <Text style={styles.role}>Role: {role ?? 'user'}</Text>
      </View>

      <View style={styles.actions}>
        {/* The switch role button has been removed */}
        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleSignOut}
        >
          <Text style={[styles.actionText, { color: '#0d1a49' }]}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1a49',
    paddingHorizontal: 20,
    justifyContent: 'center', // centers vertically
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 30,
    padding: 6,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#e6e9f0', // soft grey-blue tone
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    marginBottom: 12
  },
  name: { fontSize: 22, fontWeight: '700', color: '#0d1a49' },
  email: { fontSize: 15, color: '#0d1a49', marginTop: 4 },
  role: { fontSize: 15, color: '#0d1a49', marginTop: 6 },

  actions: { width: '100%' },
  actionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionText: { fontSize: 16, color: '#0d1a49', fontWeight: '700' },
  logoutButton: { backgroundColor: '#e6e9f0' },
});
