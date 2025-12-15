import { View, ScrollView } from 'react-native';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-black">
      <View className="p-4 gap-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-3xl font-bold text-white">ScaleX Mobile</Text>
        </View>

        {/* Welcome Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Welcome to ScaleX</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <Text className="text-gray-400">
              Your decentralized trading and lending platform
            </Text>
            <Button className="bg-orange-500">
              <Text className="text-white font-semibold">Connect Wallet</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Lending & Borrowing</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-gray-400">
              Supply assets to earn interest or borrow against your collateral
            </Text>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Spot Trading</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-gray-400">
              Trade cryptocurrencies with advanced order types
            </Text>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">App Status</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Metro Bundler</Text>
              <Text className="text-green-500 font-semibold">✓ Running</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">NativeWind</Text>
              <Text className="text-green-500 font-semibold">✓ Configured</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Expo Router</Text>
              <Text className="text-green-500 font-semibold">✓ Active</Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
