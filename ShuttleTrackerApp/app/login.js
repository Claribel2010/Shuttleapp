import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Top image in card */}
      <View style={styles.imageCard}>
        <Image
          source={{
            uri: 'https://media.istockphoto.com/id/507823045/photo/bus-in-the-city.jpg?s=612x612&w=0&k=20&c=Qo2yKSdXnmj67Qw82KGnLuNW0SG_akbXS3Oqjhfyaho=',
          }}
          style={styles.topImage}
        />
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <Text style={styles.heading}>Welcome to UG Shuttle App</Text>
        <Text style={styles.description}>
          Your reliable companion for campus shuttle tracking and easy navigation.
        </Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/loginn')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f0fa',
    paddingTop: 40, // pushed image down slightly
  },
  imageCard: {
    marginHorizontal: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    height: height * 0.35,
  },
  topImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#e6f0fa',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003279',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 18, // increased font size
    color: '#555',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 26,
  },
  loginButton: {
    backgroundColor: '#003279',
    paddingVertical: 15,
    borderRadius: 10,
    width: '90%', // increased width
    marginBottom: 15,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#005bb5',
    paddingVertical: 15,
    borderRadius: 10,
    width: '90%', // increased width
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
