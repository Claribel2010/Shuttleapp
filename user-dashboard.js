import React, { useEffect, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../firebase/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const OPEN_WEATHER_API_KEY = '56fb56aca1fc1eb2be6103e3565dd59e';

// AlertsListScreen component remains the same and is included for completeness
const AlertsListScreen = ({ alerts, onClose, onClearAlerts }) => {
  return (
    <Modal visible={true} animationType="slide" onRequestClose={onClose}>
      <View style={alertsListStyles.container}>
        <View style={alertsListStyles.header}>
          <TouchableOpacity onPress={onClose} style={alertsListStyles.closeButton}>
            <Ionicons name="chevron-back" size={30} color="#333" />
          </TouchableOpacity>
          <Text style={alertsListStyles.headerTitle}>Driver Alerts</Text>
          <TouchableOpacity onPress={onClearAlerts} style={alertsListStyles.clearButton}>
            <Text style={alertsListStyles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={alerts}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => (
            <View style={alertsListStyles.alertCard}>
              <Text style={alertsListStyles.shuttleName}>{item.shuttleName}</Text>
              <Text style={alertsListStyles.alertMessage}>{item.message}</Text>
              <Text style={alertsListStyles.timestamp}>{item.timestamp.toDate().toLocaleString()}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={alertsListStyles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
              <Text style={alertsListStyles.emptyText}>No recent alerts</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
};

export default function UserDashboard() {
  const router = useRouter();
  const [activeShuttles, setActiveShuttles] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [alertsList, setAlertsList] = useState([]);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [newAlertsCount, setNewAlertsCount] = useState(0);

  const unsubscribersRef = useRef([]);
  const initialAlertsLoadedRef = useRef(false);

  // Function to fetch all dashboard data
  const fetchData = async () => {
    // Fetch weather
    setWeatherLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPEN_WEATHER_API_KEY}`
        );
        const weatherJson = await weatherResponse.json();
        if (weatherJson.cod === 200) {
          setWeatherData({
            temp: weatherJson.main.temp,
            description: weatherJson.weather[0].description,
            icon: weatherJson.weather[0].icon,
            city: weatherJson.name,
            humidity: weatherJson.main.humidity,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching weather or location:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time listeners for shuttles and alerts
    const shuttlesQuery = query(
      collection(db, 'shuttles'),
      where('status', '==', 'In Progress')
    );

    const unsubscribeShuttles = onSnapshot(shuttlesQuery, (snapshot) => {
      const shuttles = [];
      snapshot.forEach((doc) => {
        shuttles.push({ id: doc.id, ...doc.data() });
      });
      setActiveShuttles(shuttles);

      // Clean up old alert listeners
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];

      shuttles.forEach((shuttle) => {
        const alertsQuery = query(
          collection(db, 'shuttles', shuttle.id, 'alerts'),
          orderBy('timestamp', 'desc'),
          limit(5)
        );

        const unsubscribeAlerts = onSnapshot(alertsQuery, (alertsSnap) => {
          const fetchedAlerts = alertsSnap.docs.map(doc => ({
            shuttleName: shuttle.name || 'Unnamed Shuttle',
            message: doc.data().message || '',
            timestamp: doc.data().timestamp,
            id: doc.id,
          }));

          setAlertsList(prevAlerts => {
            const combinedAlerts = [...prevAlerts, ...fetchedAlerts];
            const uniqueAlerts = Array.from(new Map(combinedAlerts.map(a => [a.id, a])).values());
            const sortedAlerts = uniqueAlerts.sort((a, b) => b.timestamp - a.timestamp);
            
            // Check for new alerts and update count
            if (initialAlertsLoadedRef.current) {
              const newCount = sortedAlerts.filter(alert => !prevAlerts.some(p => p.id === alert.id)).length;
              if (newCount > 0) {
                setNewAlertsCount(prev => prev + newCount);
              }
            }
            
            return sortedAlerts;
          });
          initialAlertsLoadedRef.current = true;
        });
        unsubscribersRef.current.push(unsubscribeAlerts);
      });
    });

    return () => {
      unsubscribeShuttles();
      unsubscribersRef.current.forEach(unsub => unsub());
    };
  }, []);

  const handleShuttlePress = (shuttle) => {
    router.push({
      pathname: '/(users)/ShuttleInfoScreen',
      params: {
        driverUid: shuttle.driverUid,
        driver: shuttle.driverName || '',
        capacity: shuttle.capacity || '',
        status: shuttle.status,
        name: shuttle.name || '',
        shuttleID: shuttle.shuttleID || '',
      },
    });
  };

  const handleShowAlerts = () => {
    setShowAlertsModal(true);
    setNewAlertsCount(0); // Reset the new alerts count when the modal is opened
  };

  const handleClearAlerts = () => {
    setAlertsList([]);
    setShowAlertsModal(false);
  };

  const renderShuttleCard = ({ item }) => {
    const occupiedSeats = item.occupied || 0;
    const progress = (item.capacity && occupiedSeats) ? (occupiedSeats / item.capacity) * 100 : 0;
    const routeName = item.route || '';

    return (
      <TouchableOpacity
        style={styles.shuttleCard}
        onPress={() => handleShuttlePress(item)}
      >
        <View style={styles.shuttleInfo}>
          <View style={styles.shuttleIcon}>
            <Ionicons name="bus-outline" size={24} color="#007AFF" />
          </View>
          <View style={styles.shuttleTextContent}>
            <Text style={styles.shuttleName}>{item.name || 'Unnamed Shuttle'}</Text>
            {routeName.length > 0 && (
              <Text style={styles.shuttleRoute}>{routeName}</Text>
            )}
          </View>
          <View style={styles.shuttleStatus}>
            <View
              style={[
                styles.statusDot,
                item.status === 'In Progress' && styles.statusDotActive,
              ]}
            />
            <Text style={styles.statusText}>{item.status}</Text>
            <Text style={styles.seatCount}>
              {occupiedSeats}/{item.capacity || '?'} seats
            </Text>
          </View>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[styles.progressBar, { width: `${progress}%` }]}
          ></View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>UG Shuttle</Text>
          <Text style={styles.headerSubtitle}>Track your ride</Text>
        </View>

        {/* New icons for Quick Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton} onPress={fetchData}>
            <Ionicons name="refresh-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleShowAlerts}>
            <Ionicons name="notifications-outline" size={28} color="#fff" />
            {newAlertsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{newAlertsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.profileButton}
        >
          <Ionicons name="person-circle-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Weather Card */}
        <View style={styles.weatherCard}>
          {weatherLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : weatherData ? (
            <>
              <View style={styles.weatherInfoRow}>
                <View style={styles.weatherLeft}>
                  <Text style={styles.weatherTitle}>
                    {weatherData.description.charAt(0).toUpperCase() +
                      weatherData.description.slice(1)}
                  </Text>
                  <Text style={styles.weatherLocation}>Legon Campus</Text>
                </View>
                <View style={styles.weatherRight}>
                  <Text style={styles.weatherTemp}>
                    {weatherData.temp.toFixed(0)}°C
                  </Text>
                  <Text style={styles.weatherHumidity}>
                    {weatherData.humidity}% humidity
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.weatherTitle}>Weather data unavailable</Text>
          )}
        </View>

        {/* Active Shuttles */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Active Shuttles</Text>
          {activeShuttles.length === 0 ? (
            <Text style={styles.noShuttles}>No Active Shuttles</Text>
          ) : (
            <FlatList
              data={activeShuttles}
              keyExtractor={(item) => item.id}
              renderItem={renderShuttleCard}
              contentContainerStyle={styles.shuttleList}
            />
          )}
        </View>
        {/* The Quick Actions section is now removed from here */}
      </View>

      {/* Renders the AlertsListScreen when the state is true */}
      {showAlertsModal && <AlertsListScreen alerts={alertsList} onClose={() => setShowAlertsModal(false)} onClearAlerts={handleClearAlerts} />}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f7f9',
  },
  headerContainer: {
    backgroundColor: '#0d1a49',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a0a7b4',
    marginTop: 4,
  },
  // New styles for the header action buttons
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto', // Pushes the buttons to the right
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 10,
    position: 'relative',
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 50,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f5f7f9',
  },
  weatherCard: {
    backgroundColor: '#0d1a49',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherLeft: {
    flexDirection: 'column',
  },
  weatherRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  weatherTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  weatherLocation: {
    fontSize: 14,
    color: '#a0a7b4',
  },
  weatherTemp: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  weatherHumidity: {
    fontSize: 14,
    color: '#a0a7b4',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  shuttleList: {
    paddingBottom: 20,
  },
  shuttleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  shuttleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  shuttleIcon: {
    backgroundColor: '#eaf3ff',
    padding: 10,
    borderRadius: 10,
  },
  shuttleTextContent: {
    flex: 1,
    marginLeft: 15,
  },
  shuttleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shuttleRoute: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  shuttleStatus: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginBottom: 4,
  },
  statusDotActive: {
    backgroundColor: '#2ecc71',
  },
  statusText: {
    fontSize: 12,
    color: '#555',
  },
  seatCount: {
    fontSize: 12,
    color: '#777',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginTop: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ff6347',
    borderRadius: 3,
  },
  // The old quick actions styles are no longer needed, so they are removed.
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

const alertsListStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f9',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  closeButton: {
    padding: 5,
  },
  clearButton: {
    marginLeft: 'auto',
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  shuttleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d1a49',
    marginBottom: 5,
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#777',
  },
});
