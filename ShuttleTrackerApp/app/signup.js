// SignupScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null);
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password || !role) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        role: role,
        createdAt: new Date().toISOString(),
      });

      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('name', name);

      if (role === 'driver') {
        router.replace('/driver/RegisterShuttle');
      } else {
        router.replace('/user-dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message || 'Unknown error');
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={styles.signupBox}>
          <Text style={styles.signupText}>Create Your Account</Text>
          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#888"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'user' && styles.selectedRole]}
              onPress={() => setRole('user')}
            >
              <Text style={[styles.roleText, role === 'user' && styles.selectedRoleText]}>I am a User</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'driver' && styles.selectedRole]}
              onPress={() => setRole('driver')}
            >
              <Text style={[styles.roleText, role === 'driver' && styles.selectedRoleText]}>I am a Driver</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSignup} style={styles.createAccountButton}>
            <Text style={styles.createAccountText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>
              Already have an account? <Text style={{ fontWeight: 'bold' }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f5f5f5', // plain background color
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupBox: {
    width: width * 0.85,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  signupText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: '#181963ff',
    borderWidth: 1,
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#181963ff',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedRole: {
    backgroundColor: '#181963ff',
    borderColor: '#181963ff',
  },
  roleText: {
    color: '#181963ff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedRoleText: {
    color: '#fff',
  },
  createAccountButton: {
    width: '100%',
    backgroundColor: '#003279',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  createAccountText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  loginLink: {
    color: '#555',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
  },
});
