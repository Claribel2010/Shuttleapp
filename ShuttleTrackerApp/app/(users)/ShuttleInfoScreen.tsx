import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../firebase/firebase';

// Define the shape of the shuttle data
interface ShuttleData {
  shuttleID?: string;
  name?: string;
  driver?: string;
  capacity?: string;
  occupied: number;
  status?: string;
}

export default function ShuttleInfoScreen() {
  const router = useRouter();
  // useLocalSearchParams returns a string for all params, so we assert the types.
  const { shuttleID, name, driver, capacity, driverUid} = useLocalSearchParams<{
    shuttleID: string;
    name: string;
    driver: string;
    capacity: string;
   driverUid: string;
  }>();

  const [shuttleData, setShuttleData] = useState<ShuttleData>({
    occupied: 0,
    shuttleID,
    name,
    driver,
    capacity,
  });
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [issueText, setIssueText] = useState('');

  // Real-time listener for shuttle data
  useEffect(() => {
    if (!driverUid) {
      setLoading(false);
      return;
    }

    const shuttleDocRef = doc(db, 'shuttles', driverUid);
    const unsubscribe = onSnapshot(
      shuttleDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setShuttleData((prev) => ({
            ...prev,
            occupied: (data.occupied as number) || 0,
            status: data.status as string,
          }));
        } else {
          Alert.alert('Shuttle not found', 'The selected shuttle no longer exists.');
          router.back();
        }
        setLoading(false);
      },
      (error) => {
        console.error('Failed to listen for shuttle updates:', error);
        Alert.alert('Error', 'Failed to get real-time updates for the shuttle.');
        setLoading(false);
      }
    );

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, [driverUid, router]);

  const handleReportSubmit = () => {
    if (!issueText.trim()) {
      Alert.alert('Please describe your issue before submitting.');
      return;
    }
    Alert.alert('Report Submitted', 'Thank you for your feedback. We will look into it.');
    setIssueText('');
    setReporting(false);
  };

  const handleViewLiveMap = () => {
    router.push({
      pathname: '/(users)/ShuttleMapScreen',
      params: { id: driverUid, // required to fetch location data
      name: shuttleData.name || '',
      occupied: shuttleData.occupied || 0,
      capacity: shuttleData.capacity || '',
      },
    });
  };

  const handleToggleReporting = () => {
    setReporting((prev) => !prev);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0d1a49" />
        <Text style={styles.loadingText}>Loading shuttle info...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{shuttleData.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Shuttle Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bus" size={28} color="#0d1a49" />
            <Text style={styles.cardTitle}>Shuttle Details</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Shuttle ID</Text>
            <Text style={styles.infoValue}>{shuttleData.shuttleID}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Driver Name</Text>
            <Text style={styles.infoValue}>{shuttleData.driver}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Capacity</Text>
            <Text style={styles.infoValue}>{shuttleData.capacity} seats</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Occupied</Text>
            <Text style={styles.infoValue}>{shuttleData.occupied || 0} seats</Text>
          </View>
        </View>

        {/* Action Buttons Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={28} color="#0d1a49" />
            <Text style={styles.cardTitle}>Live Tracking</Text>
          </View>
          <TouchableOpacity style={styles.liveMapButton} onPress={handleViewLiveMap}>
            <Ionicons name="map-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.liveMapButtonText}>View Live Map</Text>
          </TouchableOpacity>
        </View>

        {/* Report Issue Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="warning-outline" size={28} color="#d64545" />
            <Text style={styles.cardTitle}>Report Issue</Text>
          </View>
          {!reporting ? (
            <TouchableOpacity style={styles.reportButton} onPress={handleToggleReporting}>
              <Ionicons name="chatbox-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.reportButtonText}>Report an Issue</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <Text style={styles.reportLabel}>Please describe the issue in detail:</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 'Driver is speeding', 'Shuttle is full', 'AC is not working'"
                placeholderTextColor="#999"
                multiline
                value={issueText}
                onChangeText={setIssueText}
              />
              <View style={styles.reportActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleToggleReporting}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleReportSubmit}>
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef2f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d1a49',
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
  },
  liveMapButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  liveMapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  reportButton: {
    backgroundColor: '#d64545',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  reportLabel: {
    fontSize: 16,
    color: '#444',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#444',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 