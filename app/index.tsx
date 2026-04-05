import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Storage } from '../src/services/storage';
import { Colors } from '../src/constants/colors';

export default function Index() {
  useEffect(() => {
    (async () => {
      const onboarded = await Storage.isOnboarded();
      if (onboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    })();
  }, []);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
});
