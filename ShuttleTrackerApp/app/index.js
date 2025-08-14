// app/index.js
import { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      router.replace('/login');
    }, 7000); // show splash for 7 seconds

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <View style={styles.container}>
        <Image source={require('../assets/images/splash.png')} style={styles.image} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1a49',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width:'120%',
    height:'180%',
    resizeMode: 'contain',
  },
});
