import { Tabs } from 'expo-router';
import { View } from 'react-native';

// Placeholder icon components (we'll use lucide-react-native later)
const HomeIcon = ({ color }: { color: string }) => (
  <View style={{ width: 24, height: 24, backgroundColor: color, borderRadius: 4 }} />
);
const TradeIcon = ({ color }: { color: string }) => (
  <View style={{ width: 24, height: 24, backgroundColor: color, borderRadius: 4 }} />
);
const LendingIcon = ({ color }: { color: string }) => (
  <View style={{ width: 24, height: 24, backgroundColor: color, borderRadius: 4 }} />
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#676FFF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#1F2937',
          borderTopWidth: 1,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: 'Trade',
          tabBarIcon: ({ color }) => <TradeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="lending"
        options={{
          title: 'Lending',
          tabBarIcon: ({ color }) => <LendingIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
