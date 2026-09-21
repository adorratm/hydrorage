import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useT } from '@/lib/i18n';

export default function TabsLayout() {
  const tr = useT();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(25,27,38,0.95)',
          borderTopColor: 'rgba(98,114,164,0.35)',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primaryContainer,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          fontFamily: 'Ubuntu_700Bold',
        },
      }}
    >
      <Tabs.Screen
        name="takip"
        options={{
          title: tr('tabs.track'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="water" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: tr('tabs.track'),
        }}
      />
      <Tabs.Screen
        name="icecekler"
        options={{
          title: tr('tabs.drinks'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cafe" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: tr('tabs.drinks'),
        }}
      />
      <Tabs.Screen
        name="tehdit"
        options={{
          title: tr('tabs.threat'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: tr('tabs.threat'),
        }}
      />
      <Tabs.Screen
        name="istatistik"
        options={{
          title: tr('tabs.stats'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: tr('tabs.stats'),
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
