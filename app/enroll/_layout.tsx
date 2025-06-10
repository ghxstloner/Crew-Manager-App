import { Stack } from 'expo-router';
import { colors } from '../../constants/colors';

export default function EnrollLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors.light },
      }}
    >
      <Stack.Screen name="confirm" />
    </Stack>
  );
}