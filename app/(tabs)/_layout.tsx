import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useTheme } from '../../src/state/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.iconOuter}>
      {/* Top indicator bar */}
      {focused && <View style={[styles.topIndicator, { backgroundColor: colors.primary }]} />}
      <View
        style={[
          styles.iconWrap,
          focused && { backgroundColor: colors.primary + '1F' },
        ]}
      >
        <Ionicons name={name} size={21} color={focused ? colors.primary : colors.textMuted} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const colors = useColors();
  const { scheme } = useTheme();
  // Top divider color flips per scheme; the rest comes from the palette.
  const topBorder = scheme === 'dark' ? 'rgba(245,240,234,0.08)' : 'rgba(28,24,20,0.07)';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { borderTopColor: topBorder }],
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.bgSheet }]} />
        ),
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
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    backgroundColor: 'transparent',
  },
  iconOuter: { alignItems: 'center', paddingTop: 4 },
  topIndicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  iconWrap: { width: 38, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, marginTop: 4 },
  label: { fontSize: 10, fontWeight: '600', marginTop: 1 },
});
