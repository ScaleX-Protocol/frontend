import { View, Text, ScrollView } from 'react-native';

export default function TradeScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-4">
          Trade
        </Text>
        <Text className="text-foreground">
          Trading interface coming soon...
        </Text>
      </View>
    </ScrollView>
  );
}
