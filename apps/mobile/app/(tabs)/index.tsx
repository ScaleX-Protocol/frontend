import { View, Text, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-4">
          ScaleX Mobile
        </Text>
        <Text className="text-foreground">
          Welcome to ScaleX DeFi Trading Platform
        </Text>
      </View>
    </ScrollView>
  );
}
