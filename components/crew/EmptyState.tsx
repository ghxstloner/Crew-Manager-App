import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📋</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  icon: {
    fontSize: 48,
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});