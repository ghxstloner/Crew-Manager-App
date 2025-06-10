import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function ConfirmEnroll() {
  const params = useLocalSearchParams();

  const handleConfirm = async () => {
    Alert.alert('Información', 'Esta pantalla de confirmación ya no es necesaria. El enrolamiento se hace directamente desde la pantalla anterior.', [
      { text: 'OK', onPress: () => router.replace('/(tabs)') }
    ]);
  };

  const handleEdit = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Confirmar Datos</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={48} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoTitle}>Proceso Actualizado</Text>
            <Text style={styles.infoText}>
              El proceso de enrolamiento ha sido actualizado. Ahora el tripulante se registra directamente 
              desde la pantalla anterior sin necesidad de confirmación adicional.
            </Text>
            
            <TouchableOpacity style={styles.button} onPress={handleConfirm}>
              <Text style={styles.buttonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    justifyContent: 'center',
    flex: 1,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoIcon: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 15,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 150,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});