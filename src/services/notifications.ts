import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIF_ENABLED_KEY = 'gd_notif_enabled';
const NOTIF_HOUR_KEY = 'gd_notif_hour';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleRoutineReminder(hour = 8): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel existing
  await Notifications.cancelAllScheduledNotificationsAsync();

  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
  await AsyncStorage.setItem(NOTIF_HOUR_KEY, String(hour));

  const ROUTINE_MESSAGES = [
    "Your skin is waiting. 30 seconds for a check-in. 🌿",
    "Consistency builds results. Time for your daily scan. ✦",
    "Your streak is on the line — scan today to keep it. 🔥",
    "Small daily habits. Big skin results. Scan now. ✨",
    "TallowDermics reminder: check in with your skin today. 🌱",
  ];

  const msg = ROUTINE_MESSAGES[new Date().getDay() % ROUTINE_MESSAGES.length];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Velumi AI',
      body: msg,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

export async function cancelNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
}

export async function getNotificationSettings(): Promise<{ enabled: boolean; hour: number }> {
  const [enabled, hour] = await Promise.all([
    AsyncStorage.getItem(NOTIF_ENABLED_KEY),
    AsyncStorage.getItem(NOTIF_HOUR_KEY),
  ]);
  return {
    enabled: enabled === 'true',
    hour: hour ? parseInt(hour, 10) : 8,
  };
}
