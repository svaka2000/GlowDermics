import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="scan/index" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="results/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="scanner/index" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="dupes/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="goals/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="product/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="learn/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="learn/[slug]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="journal/index" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
});
