import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { db } from '../../firebase/firebase';

export default function ShuttleMapScreen({ route }) {
  const { shuttleId } = route.params;
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const locationRef = collection(db, "shuttles", shuttleId, "locations");
    const q = query(locationRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data();
        setLocation({
          latitude: latest.latitude,
          longitude: latest.longitude,
        });
      }
    });

    return () => unsubscribe();
  }, [shuttleId]);

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      {/* OSM Tile Layer */}
      <UrlTile
        urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
        flipY={false}
      />

      {/* Shuttle Marker */}
      <Marker
        coordinate={location}
        title="Shuttle Location"
        description="Live GPS Tracking"
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
