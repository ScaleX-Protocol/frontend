import { View, Text, ScrollView } from 'react-native';

export default function LendingScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-4">
          Lending
        </Text>
        <Text className="text-foreground">
          Lending interface coming soon...
        </Text>
      </View>
    </ScrollView>
  );
}
