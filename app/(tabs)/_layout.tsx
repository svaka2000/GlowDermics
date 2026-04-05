import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={focused ? Colors.primary : Colors.textMuted} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'trending-up' : 'trending-up-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: 'Routine',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'list' : 'list-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: 'transparent',
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bgSheet,
  },
  iconWrap: { width: 38, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  iconWrapActive: { backgroundColor: 'rgba(196,98,45,0.12)' },
  label: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});
