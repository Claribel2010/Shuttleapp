import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { auth } from '../../firebase/firebase';

export default function RegisterShuttle() {
  const [shuttleID, setShuttleID] = useState('');
  const [name, setName] = useState(''); // ✅ Changed to match Firestore
  const [capacity, setCapacity] = useState('');
  const [driverName, setDriverName] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!shuttleID || !name || !capacity || !driverName) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'No user logged in.');
      return;
    }

    try {
      await setDoc(doc(db, 'shuttles', user.uid), {
        shuttleID,
        name, // ✅ Now matches your Firestore field
        capacity: parseInt(capacity),
        driverName,
        status: 'Available',
        occupied: 0, // optional: initialize
        uid: user.uid
      });

      Alert.alert('Success', 'Shuttle registered!');
      router.replace('/driver-dashboard');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Your Shuttle</Text>

      <TextInput
        placeholder="Shuttle ID"
        value={shuttleID}
        onChangeText={setShuttleID}
        style={styles.input}
      />

      <TextInput
        placeholder="Shuttle Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Capacity"
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Driver Name"
        value={driverName}
        onChangeText={setDriverName}
        style={styles.input}
      />

      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F4F4F4'
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff'
  }
});
