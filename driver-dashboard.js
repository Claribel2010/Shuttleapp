import React, { useEffect, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { auth, db } from '../firebase/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import * as Location from 'expo-location';
import { onAuthStateChanged } from 'firebase/auth';

const { width } = Dimensions.get('window');

export default function DriverDashboard() {
  const [shuttle, setShuttle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');
  const locationIntervalRef = useRef(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [uid, setUid] = useState(null); // now stored in state
  const router = useRouter();

  // Listen for auth changes and set uid
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        loadShuttleData(user.uid);
      } else {
        setUid(null);
        setLoading(false);
        Alert.alert('Not signed in', 'Please log in to continue.');
        router.push('/loginn');
      }
    });

    return () => {
      unsubscribe();
      stopLocationTracking();
    };
  }, []);

  const loadShuttleData = async (driverUid) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Access Denied', 'We need your location to track the shuttle.');
        setLocationPermissionGranted(false);
      } else {
        setLocationPermissionGranted(true);
      }

      const docRef = doc(db, 'shuttles', driverUid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setShuttle(data);

        if (data.status === 'In Progress' && status === 'granted') {
          startLocationTracking(driverUid);
        }
      } else {
        Alert.alert('No shuttle registered. Please register first.');
      }
    } catch (error) {
      console.error('Error loading shuttle data:', error);
      Alert.alert('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = (driverUid) => {
    if (!locationPermissionGranted) return;
    if (locationIntervalRef.current) return;

    locationIntervalRef.current = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // Save latest location in main shuttle doc
        const shuttleRef = doc(db, 'shuttles', driverUid);
        await updateDoc(shuttleRef, {
          latitude,
          longitude,
          lastUpdated: serverTimestamp(),
        });

        // Also save in subcollection for history
        const locationRef = collection(db, 'shuttles', driverUid, 'locations');
        await addDoc(locationRef, {
          latitude,
          longitude,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.error('Location tracking error:', error);
      }
    }, 5000);
  };

  const stopLocationTracking = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const handleStartTrip = async () => {
    try {
      const docRef = doc(db, 'shuttles', uid);
      await updateDoc(docRef, { status: 'In Progress', occupied: 0 });
      setShuttle((prev) => ({ ...prev, status: 'In Progress', occupied: 0 }));
      if (locationPermissionGranted) startLocationTracking(uid);
      Alert.alert('✅ Trip Started', 'Your trip is now in progress.');
    } catch (error) {
      Alert.alert('Failed to start trip');
    }
  };

  const handleEndTrip = async () => {
    try {
      const docRef = doc(db, 'shuttles', uid);
      await updateDoc(docRef, { status: 'Trip Ended', occupied: 0 });
      setShuttle((prev) => ({ ...prev, status: 'Trip Ended', occupied: 0 }));
      stopLocationTracking();
      Alert.alert('🛑 Trip Ended', 'Your trip has been successfully ended.');
    } catch (error) {
      Alert.alert('Failed to end trip');
    }
  };

  const handleSendAlert = async () => {
    if (!alertMessage.trim()) {
      Alert.alert('Please enter an alert message.');
      return;
    }
    try {
      const shuttleAlertsRef = collection(db, 'shuttles', uid, 'alerts');
      await addDoc(shuttleAlertsRef, {
        message: alertMessage,
        timestamp: serverTimestamp(),
        shuttleName: shuttle?.name || 'Unnamed Shuttle',
      });

      setAlertMessage('');
      Alert.alert('📢 Alert sent to users!');
    } catch (error) {
      console.error('Error sending alert:', error);
      Alert.alert('Failed to send alert');
    }
  };

  const updateOccupiedCount = async (change) => {
    if (shuttle.status !== 'In Progress') {
      Alert.alert('Cannot update occupied count', 'Please start a trip first.');
      return;
    }

    const newOccupied = shuttle.occupied + change;
    if (newOccupied < 0 || newOccupied > shuttle.capacity) {
      return;
    }

    try {
      const docRef = doc(db, 'shuttles', uid);
      await updateDoc(docRef, { occupied: newOccupied });
      setShuttle((prev) => ({ ...prev, occupied: newOccupied }));
    } catch (error) {
      console.error('Failed to update occupied count:', error);
      Alert.alert('Failed to update occupied count');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (!shuttle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No shuttle data found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="person-circle-outline" size={36} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Shuttle Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shuttle Information</Text>
          <View style={styles.shuttleDetailsHeader}>
            <View style={styles.shuttleIconContainer}>
              <Ionicons name="bus-outline" size={30} color="#0d1a49" />
            </View>
            <View>
              <Text style={styles.shuttleName}>{shuttle.name}</Text>
              <Text style={styles.shuttleID}>ID: {shuttle.shuttleID}</Text>
            </View>
          </View>

          <View style={styles.shuttleStatsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Capacity</Text>
              <Text style={styles.statValue}>{shuttle.capacity}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Occupied</Text>
              <View style={styles.occupiedControls}>
                <Text style={styles.statValue}>{shuttle.occupied || 0}</Text>
                <View style={styles.occupiedButtons}>
                  <TouchableOpacity
                    style={styles.incrementButton}
                    onPress={() => updateOccupiedCount(1)}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.decrementButton}
                    onPress={() => updateOccupiedCount(-1)}
                  >
                    <Ionicons name="remove" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusValue, styles[`status_${shuttle.status?.replace(' ', '')}`]]}>
              {shuttle.status || 'Not Started'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.startEndButton, shuttle.status === 'In Progress' ? styles.endButton : styles.startButton]}
            onPress={shuttle.status === 'In Progress' ? handleEndTrip : handleStartTrip}
          >
            <Ionicons
              name={shuttle.status === 'In Progress' ? 'stop-circle-outline' : 'play-circle-outline'}
              size={24}
              color="#fff"
            />
            <Text style={styles.startEndButtonText}>
              {shuttle.status === 'In Progress' ? 'End Trip' : 'Start Trip'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Alert */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Send Alert to Users</Text>
          <TextInput
            style={styles.alertInput}
            placeholder="Type your alert message here..."
            placeholderTextColor="#888"
            value={alertMessage}
            onChangeText={setAlertMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendAlert}>
            <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sendButtonText}>Send Alert</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}



const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#e8f0fe',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0d1a49',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  shuttleDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  shuttleIconContainer: {
    backgroundColor: '#eaf3ff',
    padding: 10,
    borderRadius: 10,
    marginRight: 15,
  },
  shuttleName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  shuttleID: {
    fontSize: 16,
    color: '#777',
    marginTop: 4,
  },
  shuttleStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f5f7f9',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#777',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0d1a49',
    marginTop: 5,
  },
  occupiedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  occupiedButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incrementButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 50,
    marginLeft: 10,
  },
  decrementButton: {
    backgroundColor: '#E74C3C',
    padding: 8,
    borderRadius: 50,
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    color: '#fff',
  },
  status_InProgress: {
    backgroundColor: '#2ecc71',
  },
  status_TripEnded: {
    backgroundColor: '#e74c3c',
  },
  status_NotStarted: {
    backgroundColor: '#95a5a6',
  },
  startEndButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  startButton: {
    backgroundColor: '#2ecc71',
  },
  endButton: {
    backgroundColor: '#e74c3c',
  },
  startEndButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  alertInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    marginBottom: 15,
    backgroundColor: '#fafafa',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: '#0d1a49',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#3c4de7ff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
    fontSize: 16,
  },
  
});    