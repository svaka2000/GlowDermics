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
          <Stack.Screen name="products/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="quiz/index" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="report/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="routine-analyzer/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="habits/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ingredient/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ingredient/[name]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="skin-type/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="skin-type/[type]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="compare/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="milestones/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="forecast/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ingredient-check/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="seasonal/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="sensitivity/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="checkin/index" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="calendar/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="skin-dna/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="diet/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="budget/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="skin-age/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="routine-builder/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="weekly-digest/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="blacklist/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="challenge/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="skin-story/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="privacy/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="stress-log/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="skin-iq/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="product-deck/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="supplements/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="guided-facial/index" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="skin-weather/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="acne-diary/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="sleep-log/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="hydration/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="coach-chat/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="hormonal-log/index" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
});
