import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeIcon from '../../assets/icon/ic_home.svg';
import LendingIcon from '../../assets/icon/ic_lending.svg';
import TradeIcon from '../../assets/icon/ic_trade.svg';

function TabIcon({ focused, name }: { focused: boolean; name: string }) {
  const color = focused ? '#E26B1D' : '#888888';
  const size = 24;

  const getIcon = () => {
    switch (name) {
      case 'Home':
        return <HomeIcon width={size} height={size} color={color} />;
      case 'Trade':
        return <TradeIcon width={size} height={size} color={color} />;
      case 'Lending':
        return <LendingIcon width={size} height={size} color={color} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.tabIconContainer}>
      {getIcon()}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E26B1D',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#0D0D0D',
          borderTopColor: '#1A1A1A',
          borderTopWidth: 1,
          height: 80 + insets.bottom,
          paddingBottom: (insets.bottom > 0 ? insets.bottom : 0) + 20,
          paddingTop: 12,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="Home" />,
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: 'Trade',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="Trade" />,
        }}
      />
      <Tabs.Screen
        name="lending"
        options={{
          title: 'Lending',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="Lending" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
