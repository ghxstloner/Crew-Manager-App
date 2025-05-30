import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.message}>Esta página no existe</Text>
      <Link href="/" style={styles.link}>
        Volver al inicio
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#001689',
    marginBottom: 10,
  },
  message: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  link: {
    fontSize: 16,
    color: '#001689',
    textDecorationLine: 'underline',
  },
});