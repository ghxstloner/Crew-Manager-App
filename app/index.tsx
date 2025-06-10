import { Redirect } from 'expo-router';
import { useSession } from '../store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../constants/colors';

export default function Index() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}